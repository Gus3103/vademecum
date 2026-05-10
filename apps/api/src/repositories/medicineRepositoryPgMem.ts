/**
 * pg-mem compatible version of MedicineRepository for local development.
 *
 * pg-mem does NOT support: array_agg, string_agg, correlated subqueries.
 * Workaround: fetch medicines, ingredients and conditions in separate queries, join in JS.
 *
 * This file is ONLY used by devServer.ts. Production uses medicineRepository.ts.
 */

import { Pool } from 'pg';
import { normalizeText } from '@drug-medicine-lookup/shared';
import type {
  Medicine,
  ActiveIngredient,
  Presentation,
  SearchResult,
  FilterState,
  ConditionCategory,
} from '@drug-medicine-lookup/shared';

const PAGE_SIZE = 20;

interface MedicineRow {
  id: string;
  commercial_name: string;
  laboratory: string;
  pharmaceutical_form: string;
  requires_prescription: boolean;
  presentations: Array<{ dose: string; units: string; quantity: number }> | null;
}

interface IngredientRow {
  medicine_id: string;
  ingredient_id: string;
  ingredient_name: string;
}

interface ConditionRow {
  ingredient_id: string;
  condition_id: string;
  condition_name: string;
  condition_category: string;
}

interface CountRow { count: string; }

function buildOrderBy(filters: FilterState): string {
  return filters.sortOrder === 'name_desc'
    ? 'ORDER BY commercial_name DESC'
    : 'ORDER BY commercial_name ASC';
}

function buildFilterClauses(
  filters: FilterState,
  initialParams: unknown[],
): { whereClauses: string[]; params: unknown[] } {
  const whereClauses: string[] = [];
  const params: unknown[] = [...initialParams];
  if (filters.laboratory) {
    params.push(filters.laboratory);
    whereClauses.push('laboratory = $' + String(params.length));
  }
  if (filters.pharmaceuticalForm) {
    params.push(filters.pharmaceuticalForm);
    whereClauses.push('pharmaceutical_form = $' + String(params.length));
  }
  if (filters.requiresPrescription != null) {
    params.push(filters.requiresPrescription);
    whereClauses.push('requires_prescription = $' + String(params.length));
  }
  return { whereClauses, params };
}

async function fetchIngredients(pool: Pool, medicineIds: string[]): Promise<Map<string, ActiveIngredient[]>> {
  if (medicineIds.length === 0) return new Map();

  const placeholders = medicineIds.map((_, i) => '$' + String(i + 1)).join(', ');

  const ingResult = await pool.query<IngredientRow>(
    'SELECT mi.medicine_id, ai.id AS ingredient_id, ai.name AS ingredient_name' +
    ' FROM medicine_ingredients mi' +
    ' JOIN active_ingredients ai ON ai.id = mi.active_ingredient_id' +
    ' WHERE mi.medicine_id IN (' + placeholders + ')',
    medicineIds,
  );

  // Collect unique ingredient IDs
  const ingredientIds = [...new Set(ingResult.rows.map((r) => r.ingredient_id))];

  // Fetch conditions for those ingredients
  const conditionMap = new Map<string, Array<{ id: string; name: string; category: string }>>();
  if (ingredientIds.length > 0) {
    try {
      const condPlaceholders = ingredientIds.map((_, i) => '$' + String(i + 1)).join(', ');
      const condResult = await pool.query<ConditionRow>(
        'SELECT ic.active_ingredient_id AS ingredient_id, c.id AS condition_id,' +
        ' c.name AS condition_name, c.category AS condition_category' +
        ' FROM ingredient_conditions ic' +
        ' JOIN conditions c ON c.id = ic.condition_id' +
        ' WHERE ic.active_ingredient_id IN (' + condPlaceholders + ')',
        ingredientIds,
      );
      for (const row of condResult.rows) {
        const list = conditionMap.get(row.ingredient_id) ?? [];
        list.push({ id: row.condition_id, name: row.condition_name, category: row.condition_category });
        conditionMap.set(row.ingredient_id, list);
      }
    } catch {
      // conditions table may not exist in older test setups — ignore
    }
  }

  // Build medicine → ingredients map (with conditions)
  const map = new Map<string, ActiveIngredient[]>();
  for (const row of ingResult.rows) {
    const list = map.get(row.medicine_id) ?? [];
    const conditions = (conditionMap.get(row.ingredient_id) ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      category: c.category as ConditionCategory,
    }));
    list.push({ id: row.ingredient_id, name: row.ingredient_name, synonyms: [], conditions });
    map.set(row.medicine_id, list);
  }

  return map;
}

function rowToMedicine(row: MedicineRow, ingredients: ActiveIngredient[]): Medicine {
  const presentations: Presentation[] = Array.isArray(row.presentations)
    ? row.presentations.map((p) => ({ dose: p.dose, units: p.units, quantity: p.quantity }))
    : [];
  return {
    id: row.id,
    commercialName: row.commercial_name,
    laboratory: row.laboratory,
    pharmaceuticalForm: row.pharmaceutical_form,
    requiresPrescription: row.requires_prescription,
    presentations,
    activeIngredients: ingredients,
  };
}

export class MedicineRepositoryPgMem {
  constructor(private readonly pool: Pool) {}

  async searchByActiveIngredient(query: string, filters: FilterState, page: number): Promise<SearchResult> {
    const term = '%' + normalizeText(query) + '%';
    const offset = (page - 1) * PAGE_SIZE;
    const { whereClauses, params } = buildFilterClauses(filters, [term]);
    const filterWhere = whereClauses.length > 0 ? 'AND ' + whereClauses.join(' AND ') : '';

    const idsSql =
      'SELECT DISTINCT m.id FROM medicines m' +
      ' JOIN medicine_ingredients mi ON mi.medicine_id = m.id' +
      ' JOIN active_ingredients ai ON ai.id = mi.active_ingredient_id' +
      ' WHERE ai.name_normalized ILIKE $1 ' + filterWhere;

    const idsResult = await this.pool.query<{ id: string }>(idsSql, params);
    const allIds = idsResult.rows.map((r) => r.id);
    const total = allIds.length;
    const pageIds = allIds.slice(offset, offset + PAGE_SIZE);

    if (pageIds.length === 0) {
      return { medicines: [], total, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE) };
    }

    const placeholders = pageIds.map((_, i) => '$' + String(i + 1)).join(', ');
    const orderBy = buildOrderBy(filters);
    const medSql =
      'SELECT id, commercial_name, laboratory, pharmaceutical_form, requires_prescription, presentations' +
      ' FROM medicines WHERE id IN (' + placeholders + ') ' + orderBy;

    const [medResult, ingredientMap] = await Promise.all([
      this.pool.query<MedicineRow>(medSql, pageIds),
      fetchIngredients(this.pool, pageIds),
    ]);

    const medicines = medResult.rows.map((row) =>
      rowToMedicine(row, ingredientMap.get(row.id) ?? []),
    );

    return { medicines, total, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE) };
  }

  async searchByCommercialName(query: string, filters: FilterState, page: number): Promise<SearchResult> {
    const term = '%' + normalizeText(query) + '%';
    const offset = (page - 1) * PAGE_SIZE;
    const { whereClauses, params } = buildFilterClauses(filters, [term]);
    const filterWhere = whereClauses.length > 0 ? 'AND ' + whereClauses.join(' AND ') : '';

    const countSql =
      'SELECT COUNT(*)::text AS count FROM medicines WHERE commercial_name_normalized ILIKE $1 ' + filterWhere;
    const countResult = await this.pool.query<CountRow>(countSql, params);
    const total = parseInt(countResult.rows[0]?.count ?? '0', 10);

    const orderBy = buildOrderBy(filters);
    const medSql =
      'SELECT id, commercial_name, laboratory, pharmaceutical_form, requires_prescription, presentations' +
      ' FROM medicines WHERE commercial_name_normalized ILIKE $1 ' + filterWhere +
      ' ' + orderBy +
      ' LIMIT ' + String(PAGE_SIZE) + ' OFFSET ' + String(offset);

    const medResult = await this.pool.query<MedicineRow>(medSql, params);
    const pageIds = medResult.rows.map((r) => r.id);
    const ingredientMap = await fetchIngredients(this.pool, pageIds);

    const medicines = medResult.rows.map((row) =>
      rowToMedicine(row, ingredientMap.get(row.id) ?? []),
    );

    return { medicines, total, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE) };
  }

  async getSuggestions(query: string, type: 'active' | 'commercial'): Promise<string[]> {
    const term = '%' + normalizeText(query) + '%';
    const sql = type === 'active'
      ? 'SELECT DISTINCT name FROM active_ingredients WHERE name_normalized ILIKE $1 ORDER BY name ASC LIMIT 10'
      : 'SELECT DISTINCT commercial_name AS name FROM medicines WHERE commercial_name_normalized ILIKE $1 ORDER BY name ASC LIMIT 10';
    const result = await this.pool.query<{ name: string }>(sql, [term]);
    return result.rows.map((r) => r.name);
  }

  async findById(id: string): Promise<Medicine | null> {
    const sql =
      'SELECT id, commercial_name, laboratory, pharmaceutical_form, requires_prescription, presentations' +
      ' FROM medicines WHERE id = $1';
    const result = await this.pool.query<MedicineRow>(sql, [id]);
    if (result.rows.length === 0 || result.rows[0] == null) return null;
    const row = result.rows[0];
    const ingredientMap = await fetchIngredients(this.pool, [row.id]);
    return rowToMedicine(row, ingredientMap.get(row.id) ?? []);
  }
}
