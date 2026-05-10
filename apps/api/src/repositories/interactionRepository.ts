import { Pool } from 'pg';
import type { DrugInteraction, ActiveIngredient } from '@drug-medicine-lookup/shared';
import { getPool } from '../db/client';

// ---------------------------------------------------------------------------
// Row type returned by the SQL query
// ---------------------------------------------------------------------------

interface DrugInteractionRow {
  ingredient_a_id: string;
  ingredient_a_name: string;
  ingredient_a_synonyms: string[] | null;
  ingredient_b_id: string;
  ingredient_b_name: string;
  ingredient_b_synonyms: string[] | null;
  severity: 'leve' | 'moderada' | 'grave';
  description: string;
}

// ---------------------------------------------------------------------------
// Helper: map a DB row to the DrugInteraction domain type
// ---------------------------------------------------------------------------

function rowToInteraction(row: DrugInteractionRow): DrugInteraction {
  const ingredientA: ActiveIngredient = {
    id: row.ingredient_a_id,
    name: row.ingredient_a_name,
    synonyms: row.ingredient_a_synonyms ?? [],
  };

  const ingredientB: ActiveIngredient = {
    id: row.ingredient_b_id,
    name: row.ingredient_b_name,
    synonyms: row.ingredient_b_synonyms ?? [],
  };

  return {
    ingredientA,
    ingredientB,
    severity: row.severity,
    description: row.description,
  };
}

// ---------------------------------------------------------------------------
// InteractionRepository
// ---------------------------------------------------------------------------

/**
 * Repository for drug interaction database operations.
 *
 * Accepts an optional `Pool` in the constructor so tests can inject a
 * pg-mem-backed pool without touching the singleton.
 *
 * The `findInteractions` method returns both (A, B) and (B, A) directions
 * to guarantee symmetry: if ingredient X interacts with ingredient Y, the
 * result will include an entry with X as ingredientA and Y as ingredientB,
 * AND an entry with Y as ingredientA and X as ingredientB.
 */
export class InteractionRepository {
  private readonly pool: Pool;

  constructor(pool?: Pool) {
    this.pool = pool ?? getPool();
  }

  /**
   * Returns all drug interactions involving any of the given ingredient IDs.
   *
   * Both directions (A→B and B→A) are returned to guarantee symmetry.
   * If `ingredientIds` is empty, returns `[]` immediately without querying.
   *
   * @param ingredientIds - Array of active ingredient UUIDs to check
   */
  async findInteractions(ingredientIds: string[]): Promise<DrugInteraction[]> {
    if (ingredientIds.length === 0) {
      return [];
    }

    // Build parameterized placeholders: $1, $2, ..., $N
    const placeholders = ingredientIds.map((_, i) => `$${i + 1}`).join(', ');

    // Query rows where either ingredient_a_id or ingredient_b_id is in the list.
    // We return both the canonical (A, B) row AND a synthetic (B, A) row so
    // callers always see interactions in both directions.
    const sql = `
      SELECT
        ai_a.id          AS ingredient_a_id,
        ai_a.name        AS ingredient_a_name,
        ai_a.synonyms    AS ingredient_a_synonyms,
        ai_b.id          AS ingredient_b_id,
        ai_b.name        AS ingredient_b_name,
        ai_b.synonyms    AS ingredient_b_synonyms,
        di.severity,
        di.description
      FROM drug_interactions di
      JOIN active_ingredients ai_a ON ai_a.id = di.ingredient_a_id
      JOIN active_ingredients ai_b ON ai_b.id = di.ingredient_b_id
      WHERE di.ingredient_a_id IN (${placeholders})
         OR di.ingredient_b_id IN (${placeholders})
    `;

    const result = await this.pool.query<DrugInteractionRow>(sql, ingredientIds);

    // For each DB row, emit both (A, B) and (B, A) to guarantee symmetry.
    const interactions: DrugInteraction[] = [];

    for (const row of result.rows) {
      // Original direction: A → B
      interactions.push(rowToInteraction(row));

      // Reversed direction: B → A (same severity and description)
      const reversed: DrugInteractionRow = {
        ingredient_a_id: row.ingredient_b_id,
        ingredient_a_name: row.ingredient_b_name,
        ingredient_a_synonyms: row.ingredient_b_synonyms,
        ingredient_b_id: row.ingredient_a_id,
        ingredient_b_name: row.ingredient_a_name,
        ingredient_b_synonyms: row.ingredient_a_synonyms,
        severity: row.severity,
        description: row.description,
      };
      interactions.push(rowToInteraction(reversed));
    }

    return interactions;
  }
}
