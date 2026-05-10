import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { createPool, closePool } from './client';

/**
 * Reads and executes all migration SQL files in order.
 *
 * @param pool - Optional pool to use (defaults to the singleton pool).
 *               Pass a custom pool in tests to target pg-mem or a test DB.
 */
export async function runMigrations(pool?: Pool): Promise<void> {
  const targetPool = pool ?? createPool();
  const shouldClose = pool == null; // only close if we created the pool here

  const migrationsDir = path.join(__dirname, 'migrations');

  // Read all .sql files sorted lexicographically (001_, 002_, …)
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    console.warn('[migrate] No SQL migration files found in', migrationsDir);
    return;
  }

  const client = await targetPool.connect();
  try {
    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      console.log(`[migrate] Running migration: ${file}`);
      await client.query(sql);
      console.log(`[migrate] Completed: ${file}`);
    }
  } finally {
    client.release();
    if (shouldClose) {
      await closePool();
    }
  }
}

// Allow running directly: `ts-node src/db/migrate.ts`
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('[migrate] All migrations completed successfully.');
      process.exit(0);
    })
    .catch((err: unknown) => {
      console.error('[migrate] Migration failed:', err);
      process.exit(1);
    });
}
