import { Pool } from 'pg';
import type { Prospect } from '@drug-medicine-lookup/shared';
import { getPool } from '../db/client';

// ---------------------------------------------------------------------------
// Row type returned by the SQL query
// ---------------------------------------------------------------------------

interface ProspectRow {
  medicine_id: string;
  indications: string | null;
  dosage: string | null;
  contraindications: string | null;
  warnings: string | null;
  interactions_text: string | null;
  adverse_effects: string | null;
  overdose: string | null;
  storage: string | null;
}

// ---------------------------------------------------------------------------
// Helper: map a DB row to the Prospect domain type
// ---------------------------------------------------------------------------

function rowToProspect(row: ProspectRow): Prospect {
  return {
    medicineId: row.medicine_id,
    indications: row.indications ?? '',
    dosage: row.dosage ?? '',
    contraindications: row.contraindications ?? '',
    warnings: row.warnings ?? '',
    interactionsText: row.interactions_text ?? '',
    adverseEffects: row.adverse_effects ?? '',
    overdose: row.overdose ?? '',
    storage: row.storage ?? '',
  };
}

// ---------------------------------------------------------------------------
// ProspectRepository
// ---------------------------------------------------------------------------

/**
 * Repository for prospect-related database operations.
 *
 * Accepts an optional `Pool` in the constructor so tests can inject a
 * pg-mem-backed pool without touching the singleton.
 */
export class ProspectRepository {
  private readonly pool: Pool;

  constructor(pool?: Pool) {
    this.pool = pool ?? getPool();
  }

  /**
   * Returns the prospect for the given medicine ID, or `null` if not found.
   *
   * @param medicineId - UUID of the medicine
   */
  async findByMedicineId(medicineId: string): Promise<Prospect | null> {
    const sql = `
      SELECT
        medicine_id,
        indications,
        dosage,
        contraindications,
        warnings,
        interactions_text,
        adverse_effects,
        overdose,
        storage
      FROM prospects
      WHERE medicine_id = $1
    `;

    const result = await this.pool.query<ProspectRow>(sql, [medicineId]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    if (row == null) {
      return null;
    }

    return rowToProspect(row);
  }
}
