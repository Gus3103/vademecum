import { Pool } from 'pg';
import { normalizeText } from '@drug-medicine-lookup/shared';
import type { Condition, ConditionCategory, ActiveIngredient, ConditionSearchResult } from '@drug-medicine-lookup/shared';
import { getPool } from '../db/client';

interface ConditionRow {
  id: string;
  name: string;
  category: ConditionCategory;
}

interface IngredientRow {
  id: string;
  name: string;
  synonyms: string[] | null;
}

function rowToCondition(row: ConditionRow): Condition {
  return { id: row.id, name: row.name, category: row.category };
}

/**
 * Repository for condition (dolencia) database operations.
 */
export class ConditionRepository {
  private readonly pool: Pool;

  constructor(pool?: Pool) {
    this.pool = pool ?? getPool();
  }

  /**
   * Returns all conditions associated with a given active ingredient.
   */
  async findByIngredientId(ingredientId: string): Promise<Condition[]> {
    const sql =
      'SELECT c.id, c.name, c.category FROM conditions c' +
      ' JOIN ingredient_conditions ic ON ic.condition_id = c.id' +
      ' WHERE ic.active_ingredient_id = $1' +
      ' ORDER BY c.name ASC';

    const result = await this.pool.query<ConditionRow>(sql, [ingredientId]);
    return result.rows.map(rowToCondition);
  }

  /**
   * Returns all active ingredients associated with a given condition,
   * along with the condition details.
   */
  async findIngredientsByConditionId(conditionId: string): Promise<ConditionSearchResult | null> {
    const condSql = 'SELECT id, name, category FROM conditions WHERE id = $1';
    const condResult = await this.pool.query<ConditionRow>(condSql, [conditionId]);

    if (condResult.rows.length === 0 || condResult.rows[0] == null) return null;
    const condition = rowToCondition(condResult.rows[0]);

    const ingSql =
      'SELECT ai.id, ai.name, ai.synonyms FROM active_ingredients ai' +
      ' JOIN ingredient_conditions ic ON ic.active_ingredient_id = ai.id' +
      ' WHERE ic.condition_id = $1' +
      ' ORDER BY ai.name ASC';

    const ingResult = await this.pool.query<IngredientRow>(ingSql, [conditionId]);
    const activeIngredients: ActiveIngredient[] = ingResult.rows.map((r) => ({
      id: r.id,
      name: r.name,
      synonyms: r.synonyms ?? [],
    }));

    return { condition, activeIngredients };
  }

  /**
   * Searches conditions by name (case/accent insensitive).
   */
  async search(query: string): Promise<Condition[]> {
    const term = '%' + normalizeText(query) + '%';
    const sql =
      'SELECT id, name, category FROM conditions' +
      ' WHERE name_normalized ILIKE $1' +
      ' ORDER BY name ASC LIMIT 20';

    const result = await this.pool.query<ConditionRow>(sql, [term]);
    return result.rows.map(rowToCondition);
  }

  /**
   * Returns all conditions grouped by category.
   */
  async findAll(): Promise<Condition[]> {
    const sql = 'SELECT id, name, category FROM conditions ORDER BY category, name ASC';
    const result = await this.pool.query<ConditionRow>(sql);
    return result.rows.map(rowToCondition);
  }
}
