/**
 * Test database helper using pg-mem.
 *
 * pg-mem limitations handled here:
 *  - pg_trgm extension and GIN indexes are NOT supported → skipped
 *  - Trigger support is limited → normalized columns must be set manually
 *    when inserting test data (use the helper functions below)
 *  - gen_random_uuid() is supported in pg-mem >= 2.x
 *
 * Usage in tests:
 *
 *   import { createTestDb, normalizeForTest } from '../db/testDb';
 *
 *   let db: TestDb;
 *   beforeEach(async () => { db = await createTestDb(); });
 *   afterEach(async () => { await db.pool.end(); });
 */

import { IMemoryDb, newDb, DataType } from 'pg-mem';
import { Pool } from 'pg';
import { normalizeText } from '@drug-medicine-lookup/shared';

export interface TestDb {
  /** pg-mem in-memory database instance */
  memDb: IMemoryDb;
  /** pg-compatible Pool backed by pg-mem */
  pool: Pool;
}

/**
 * Convenience re-export so test files don't need to import from shared.
 */
export { normalizeText as normalizeForTest };

/**
 * Creates a fresh in-memory database with the application schema applied.
 *
 * GIN indexes and the pg_trgm extension are intentionally omitted because
 * pg-mem does not support them. Trigger-based normalization is also omitted;
 * callers must supply pre-normalized values when inserting test data.
 */
export async function createTestDb(): Promise<TestDb> {
  const memDb = newDb();

  // pg-mem supports gen_random_uuid() natively; register it just in case
  // an older version needs it explicitly.
  try {
    memDb.public.registerFunction({
      name: 'gen_random_uuid',
      returns: DataType.text,
      implementation: () => {
        // Simple UUID v4 generator
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
      },
    });
  } catch {
    // Already registered — ignore
  }

  // Apply the schema (without pg_trgm, GIN indexes, and triggers)
  await applyTestSchema(memDb);

  // Create a pg-compatible Pool adapter
  const pool = memDb.adapters.createPg().Pool as unknown as typeof Pool;
  const testPool = new pool() as unknown as Pool;

  return { memDb, pool: testPool };
}

/**
 * Applies a pg-mem-compatible subset of the application schema.
 *
 * Omissions vs. the real migration:
 *  - No `CREATE EXTENSION pg_trgm`
 *  - No GIN indexes (idx_ai_name_trgm, idx_med_name_trgm)
 *  - No trigger function or triggers (normalization must be done in test helpers)
 *  - `TIMESTAMPTZ` is replaced with `TIMESTAMP` where pg-mem has issues
 */
async function applyTestSchema(db: IMemoryDb): Promise<void> {
  const { Pool: PgMemPool } = db.adapters.createPg();
  const pool = new PgMemPool() as unknown as Pool;
  const client = await pool.connect();

  try {
    // active_ingredients
    await client.query(`
      CREATE TABLE IF NOT EXISTS active_ingredients (
        id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name             TEXT NOT NULL,
        name_normalized  TEXT NOT NULL,
        synonyms         TEXT[],
        created_at       TIMESTAMP DEFAULT now()
      )
    `);

    // medicines
    await client.query(`
      CREATE TABLE IF NOT EXISTS medicines (
        id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        commercial_name             TEXT NOT NULL,
        commercial_name_normalized  TEXT NOT NULL,
        laboratory                  TEXT NOT NULL,
        pharmaceutical_form         TEXT NOT NULL,
        requires_prescription       BOOLEAN NOT NULL DEFAULT true,
        presentations               JSONB,
        created_at                  TIMESTAMP DEFAULT now(),
        updated_at                  TIMESTAMP DEFAULT now()
      )
    `);

    // medicine_ingredients (N:M)
    await client.query(`
      CREATE TABLE IF NOT EXISTS medicine_ingredients (
        medicine_id          UUID REFERENCES medicines(id) ON DELETE CASCADE,
        active_ingredient_id UUID REFERENCES active_ingredients(id) ON DELETE CASCADE,
        PRIMARY KEY (medicine_id, active_ingredient_id)
      )
    `);

    // prospects
    await client.query(`
      CREATE TABLE IF NOT EXISTS prospects (
        id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        medicine_id       UUID UNIQUE REFERENCES medicines(id) ON DELETE CASCADE,
        indications       TEXT,
        dosage            TEXT,
        contraindications TEXT,
        warnings          TEXT,
        interactions_text TEXT,
        adverse_effects   TEXT,
        overdose          TEXT,
        storage           TEXT,
        updated_at        TIMESTAMP DEFAULT now()
      )
    `);

    // drug_interactions
    await client.query(`
      CREATE TABLE IF NOT EXISTS drug_interactions (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ingredient_a_id UUID REFERENCES active_ingredients(id),
        ingredient_b_id UUID REFERENCES active_ingredients(id),
        severity        TEXT NOT NULL,
        description     TEXT NOT NULL,
        UNIQUE (ingredient_a_id, ingredient_b_id)
      )
    `);

    // B-tree indexes that pg-mem supports
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_med_lab
        ON medicines (laboratory)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_med_form
        ON medicines (pharmaceutical_form)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_interactions_a
        ON drug_interactions (ingredient_a_id)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_interactions_b
        ON drug_interactions (ingredient_b_id)
    `);
  } finally {
    client.release();
    await pool.end();
  }
}

// ---------------------------------------------------------------------------
// Convenience insert helpers
// These helpers automatically compute *_normalized columns since pg-mem
// does not run the PostgreSQL triggers.
// ---------------------------------------------------------------------------

export interface InsertActiveIngredientParams {
  id?: string;
  name: string;
  synonyms?: string[];
}

export interface InsertMedicineParams {
  id?: string;
  commercialName: string;
  laboratory: string;
  pharmaceuticalForm: string;
  requiresPrescription?: boolean;
  presentations?: Array<{ dose: string; units: string; quantity: number }>;
}

/**
 * Inserts an active ingredient into the test database.
 * Automatically computes `name_normalized`.
 */
export async function insertActiveIngredient(
  pool: Pool,
  params: InsertActiveIngredientParams,
): Promise<string> {
  const { id, name, synonyms = [] } = params;
  const nameNormalized = normalizeText(name);

  const result = await pool.query<{ id: string }>(
    id != null
      ? `INSERT INTO active_ingredients (id, name, name_normalized, synonyms)
         VALUES ($1, $2, $3, $4)
         RETURNING id`
      : `INSERT INTO active_ingredients (name, name_normalized, synonyms)
         VALUES ($1, $2, $3)
         RETURNING id`,
    id != null ? [id, name, nameNormalized, synonyms] : [name, nameNormalized, synonyms],
  );

  const row = result.rows[0];
  if (row == null) {
    throw new Error('Insert active_ingredient returned no rows');
  }
  return row.id;
}

/**
 * Inserts a medicine into the test database.
 * Automatically computes `commercial_name_normalized`.
 */
export async function insertMedicine(
  pool: Pool,
  params: InsertMedicineParams,
): Promise<string> {
  const {
    id,
    commercialName,
    laboratory,
    pharmaceuticalForm,
    requiresPrescription = true,
    presentations = [],
  } = params;

  const nameNormalized = normalizeText(commercialName);

  const result = await pool.query<{ id: string }>(
    id != null
      ? `INSERT INTO medicines
           (id, commercial_name, commercial_name_normalized, laboratory,
            pharmaceutical_form, requires_prescription, presentations)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`
      : `INSERT INTO medicines
           (commercial_name, commercial_name_normalized, laboratory,
            pharmaceutical_form, requires_prescription, presentations)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
    id != null
      ? [
          id,
          commercialName,
          nameNormalized,
          laboratory,
          pharmaceuticalForm,
          requiresPrescription,
          JSON.stringify(presentations),
        ]
      : [
          commercialName,
          nameNormalized,
          laboratory,
          pharmaceuticalForm,
          requiresPrescription,
          JSON.stringify(presentations),
        ],
  );

  const row = result.rows[0];
  if (row == null) {
    throw new Error('Insert medicine returned no rows');
  }
  return row.id;
}

/**
 * Links a medicine to an active ingredient in the test database.
 */
export async function linkMedicineIngredient(
  pool: Pool,
  medicineId: string,
  activeIngredientId: string,
): Promise<void> {
  await pool.query(
    `INSERT INTO medicine_ingredients (medicine_id, active_ingredient_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [medicineId, activeIngredientId],
  );
}
