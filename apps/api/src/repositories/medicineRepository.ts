import { Pool } from 'pg';
import { normalizeText } from '@drug-medicine-lookup/shared';
import type {
  Medicine,
  ActiveIngredient,
  Presentation,
  SearchResult,
  FilterState,
} from '@drug-medicine-lookup/shared';
import { getPool } from '../db/client';

const PAGE_SIZE = 20;

// ---------------------------------------------------------------------------
// Row types returned by SQL queries
// ---------------------------------------------------------------------------

interface MedicineRow {
  id: string;
  commercial_name: string;
  laboratory: string;
  pharmaceutical_form: string;
  requires_prescription: boolean;
  presentations: Array<{ dose: string; units: string; quantity: number }> | null;
}

interface MedicineWithIngredientsRow extends MedicineRow {
  active_ingredient_ids: string[] | null;
  active_ingredient_names: string[] | null;
  active_ingredient_synonyms: string[][] | null;
}

interface CountRow {
  count: string;
}

// ---------------------------------------------------------------------------
// Helper: map a DB row to the Medicine domain type
// ---------------------------------------------------------------------------

function rowToMedicine(row: MedicineWithIngredientsRow): Medicine {
  const ids = row.active_ingredient_ids ?? [];
  const names = row.active_ingredient_names ?? [];
  const synonymsList = row.active_ingredient_synonyms ?? [];

  const activeIngredients: ActiveIngredient[] = ids.map((id, i) => ({
    id,
    name: names[i] ?? '',
    synonyms: synonymsList[i] ?? [],
  }));

  const presentations: Presentation[] = Array.isArray(row.presentations)
    ? row.presentations.map((p) => ({
        dose: p.dose,
        units: p.units,
        quantity: p.quantity,
      }))
    : [];

  return {
    id: row.id,
    commercialName: row.commercial_name,
    laboratory: row.laboratory,
    pharmaceuticalForm: row.pharmaceutical_form,
    requiresPrescription: row.requires_prescription,
    presentations,
    activeIngredients,
  };
}

// ---------------------------------------------------------------------------
// Helper: build the ORDER BY clause from FilterState
// ---------------------------------------------------------------------------

function buildOrderBy(filters: FilterState): string {
  if (filters.sortOrder === 'name_desc') {
    return 'ORDER BY m.commercial_name DESC';
  }
  return 'ORDER BY m.commercial_name ASC';
}

// ---------------------------------------------------------------------------
// MedicineRepository
// ---------------------------------------------------------------------------

/**
 * Repository for medicine-related database operations.
 *
 * Accepts an optional `Pool` in the constructor so tests can inject a
 * pg-mem-backed pool without touching the singleton.
 *
 * Search queries use `ILIKE '%term%'` on the `*_normalized` columns.
 * Uses JOIN instead of correlated EXISTS for pg-mem compatibility.
 */
export class MedicineRepository {
  private readonly pool: Pool;

  constructor(pool?: Pool) {
    this.pool = pool ?? getPool();
  }

  // -------------------------------------------------------------------------
  // searchByActiveIngredient
  // -------------------------------------------------------------------------

  /**
   * Searches medicines whose active ingredients match the given query.
   *
   * @param query   - Raw search term (will be normalized internally)
   * @param filters - Optional filters: laboratory, pharmaceuticalForm, requiresPrescription, sortOrder
   * @param page    - 1-based page number
   */
  async searchByActiveIngredient(
    query: string,
    filters: FilterState,
    page: number,
  ): Promise<SearchResult> {
    const normalized = normalizeText(query);
    const term = '%' + normalized + '%';
    const offset = (page - 1) * PAGE_SIZE;

    // $1 = search term; filter params start at $2
    const { whereClauses, params } = buildFilterClauses(filters, [term]);
    const filterWhere =
      whereClauses.length > 0 ? 'AND ' + whereClauses.join(' AND ') : '';

    const orderBy = buildOrderBy(filters);
    const limitParam = '$' + String(params.length + 1);
    const offsetParam = '$' + String(params.length + 2);

    const countSql =
      'SELECT COUNT(DISTINCT m.id)::text AS count' +
      ' FROM medicines m' +
      ' JOIN medicine_ingredients mi ON mi.medicine_id = m.id' +
      ' JOIN active_ingredients ai ON ai.id = mi.active_ingredient_id' +
      ' WHERE ai.name_normalized ILIKE $1 ' + filterWhere;

    const dataSql =
      'SELECT m.id, m.commercial_name, m.laboratory, m.pharmaceutical_form,' +
      ' m.requires_prescription, m.presentations,' +
      ' array_agg(DISTINCT ai.id) AS active_ingredient_ids,' +
      ' array_agg(DISTINCT ai.name) AS active_ingredient_names,' +
      ' array_agg(ai.synonyms) AS active_ingredient_synonyms' +
      ' FROM medicines m' +
      ' JOIN medicine_ingredients mi ON mi.medicine_id = m.id' +
      ' JOIN active_ingredients ai ON ai.id = mi.active_ingredient_id' +
      ' WHERE ai.name_normalized ILIKE $1 ' + filterWhere +
      ' GROUP BY m.id, m.commercial_name, m.laboratory,' +
      ' m.pharmaceutical_form, m.requires_prescription, m.presentations' +
      ' ' + orderBy +
      ' LIMIT ' + limitParam + ' OFFSET ' + offsetParam;

    const allParams = [...params, PAGE_SIZE, offset];

    const [countResult, dataResult] = await Promise.all([
      this.pool.query<CountRow>(countSql, params),
      this.pool.query<MedicineWithIngredientsRow>(dataSql, allParams),
    ]);

    const total = parseInt(countResult.rows[0]?.count ?? '0', 10);
    const medicines = dataResult.rows.map(rowToMedicine);

    return {
      medicines,
      total,
      page,
      pageSize: PAGE_SIZE,
      totalPages: Math.ceil(total / PAGE_SIZE),
    };
  }

  // -------------------------------------------------------------------------
  // searchByCommercialName
  // -------------------------------------------------------------------------

  /**
   * Searches medicines by commercial name.
   *
   * @param query   - Raw search term (will be normalized internally)
   * @param filters - Optional filters
   * @param page    - 1-based page number
   */
  async searchByCommercialName(
    query: string,
    filters: FilterState,
    page: number,
  ): Promise<SearchResult> {
    const normalized = normalizeText(query);
    const term = '%' + normalized + '%';
    const offset = (page - 1) * PAGE_SIZE;

    // $1 = search term; filter params start at $2
    const { whereClauses, params } = buildFilterClauses(filters, [term]);
    const filterWhere =
      whereClauses.length > 0 ? 'AND ' + whereClauses.join(' AND ') : '';

    const orderBy = buildOrderBy(filters);
    const limitParam = '$' + String(params.length + 1);
    const offsetParam = '$' + String(params.length + 2);

    const countSql =
      'SELECT COUNT(DISTINCT m.id)::text AS count' +
      ' FROM medicines m' +
      ' WHERE m.commercial_name_normalized ILIKE $1 ' + filterWhere;

    const dataSql =
      'SELECT m.id, m.commercial_name, m.laboratory, m.pharmaceutical_form,' +
      ' m.requires_prescription, m.presentations,' +
      ' array_agg(DISTINCT ai.id) AS active_ingredient_ids,' +
      ' array_agg(DISTINCT ai.name) AS active_ingredient_names,' +
      ' array_agg(ai.synonyms) AS active_ingredient_synonyms' +
      ' FROM medicines m' +
      ' LEFT JOIN medicine_ingredients mi ON mi.medicine_id = m.id' +
      ' LEFT JOIN active_ingredients ai ON ai.id = mi.active_ingredient_id' +
      ' WHERE m.commercial_name_normalized ILIKE $1 ' + filterWhere +
      ' GROUP BY m.id, m.commercial_name, m.laboratory,' +
      ' m.pharmaceutical_form, m.requires_prescription, m.presentations' +
      ' ' + orderBy +
      ' LIMIT ' + limitParam + ' OFFSET ' + offsetParam;

    const allParams = [...params, PAGE_SIZE, offset];

    const [countResult, dataResult] = await Promise.all([
      this.pool.query<CountRow>(countSql, params),
      this.pool.query<MedicineWithIngredientsRow>(dataSql, allParams),
    ]);

    const total = parseInt(countResult.rows[0]?.count ?? '0', 10);
    const medicines = dataResult.rows.map(rowToMedicine);

    return {
      medicines,
      total,
      page,
      pageSize: PAGE_SIZE,
      totalPages: Math.ceil(total / PAGE_SIZE),
    };
  }

  // -------------------------------------------------------------------------
  // getSuggestions
  // -------------------------------------------------------------------------

  /**
   * Returns up to 10 suggestion strings for autocomplete.
   *
   * @param query - Raw search term (will be normalized internally)
   * @param type  - 'active' for active ingredient names, 'commercial' for commercial names
   */
  async getSuggestions(query: string, type: 'active' | 'commercial'): Promise<string[]> {
    const normalized = normalizeText(query);
    const term = '%' + normalized + '%';

    let sql: string;

    if (type === 'active') {
      sql =
        'SELECT DISTINCT name FROM active_ingredients' +
        ' WHERE name_normalized ILIKE $1 ORDER BY name ASC LIMIT 10';
    } else {
      sql =
        'SELECT DISTINCT commercial_name AS name FROM medicines' +
        ' WHERE commercial_name_normalized ILIKE $1 ORDER BY name ASC LIMIT 10';
    }

    const result = await this.pool.query<{ name: string }>(sql, [term]);
    return result.rows.map((row) => row.name);
  }

  // -------------------------------------------------------------------------
  // findById
  // -------------------------------------------------------------------------

  /**
   * Returns the full medicine record including active ingredients and presentations.
   *
   * @param id - UUID of the medicine
   * @returns The Medicine or null if not found
   */
  async findById(id: string): Promise<Medicine | null> {
    const sql =
      'SELECT m.id, m.commercial_name, m.laboratory, m.pharmaceutical_form,' +
      ' m.requires_prescription, m.presentations,' +
      ' array_agg(DISTINCT ai.id) AS active_ingredient_ids,' +
      ' array_agg(DISTINCT ai.name) AS active_ingredient_names,' +
      ' array_agg(ai.synonyms) AS active_ingredient_synonyms' +
      ' FROM medicines m' +
      ' LEFT JOIN medicine_ingredients mi ON mi.medicine_id = m.id' +
      ' LEFT JOIN active_ingredients ai ON ai.id = mi.active_ingredient_id' +
      ' WHERE m.id = $1' +
      ' GROUP BY m.id, m.commercial_name, m.laboratory,' +
      ' m.pharmaceutical_form, m.requires_prescription, m.presentations';

    const result = await this.pool.query<MedicineWithIngredientsRow>(sql, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    if (row == null) {
      return null;
    }

    return rowToMedicine(row);
  }
}

// ---------------------------------------------------------------------------
// Internal helper: build parameterized filter clauses
// ---------------------------------------------------------------------------

/**
 * Builds additional WHERE clauses and the corresponding parameter array
 * for the optional FilterState fields.
 *
 * @param filters       - The filter state from the caller
 * @param initialParams - Parameters already bound (e.g. the search term)
 */
function buildFilterClauses(
  filters: FilterState,
  initialParams: unknown[],
): { whereClauses: string[]; params: unknown[] } {
  const whereClauses: string[] = [];
  const params: unknown[] = [...initialParams];

  if (filters.laboratory != null && filters.laboratory !== '') {
    params.push(filters.laboratory);
    whereClauses.push('m.laboratory = $' + String(params.length));
  }

  if (filters.pharmaceuticalForm != null && filters.pharmaceuticalForm !== '') {
    params.push(filters.pharmaceuticalForm);
    whereClauses.push('m.pharmaceutical_form = $' + String(params.length));
  }

  if (filters.requiresPrescription != null) {
    params.push(filters.requiresPrescription);
    whereClauses.push('m.requires_prescription = $' + String(params.length));
  }

  return { whereClauses, params };
}
