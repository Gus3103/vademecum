import { Pool, PoolConfig } from 'pg';

/**
 * Creates a PostgreSQL connection pool.
 *
 * Configuration is read from environment variables in this order:
 *  1. DATABASE_URL  — full connection string (postgres://user:pass@host:port/db)
 *  2. Individual PG* variables: PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD
 *
 * Falls back to pg's own defaults (PGHOST=localhost, PGPORT=5432, etc.)
 * when neither DATABASE_URL nor individual vars are set.
 */
export function createPool(overrides?: PoolConfig): Pool {
  const databaseUrl = process.env['DATABASE_URL'];

  const config: PoolConfig = databaseUrl
    ? {
        connectionString: databaseUrl,
        // Allow SSL in production (e.g. Heroku, RDS) but don't require it locally
        ssl:
          process.env['NODE_ENV'] === 'production'
            ? { rejectUnauthorized: false }
            : undefined,
      }
    : {
        host: process.env['PGHOST'] ?? 'localhost',
        port: process.env['PGPORT'] != null ? parseInt(process.env['PGPORT'], 10) : 5432,
        database: process.env['PGDATABASE'] ?? 'drug_medicine_lookup',
        user: process.env['PGUSER'] ?? 'postgres',
        password: process.env['PGPASSWORD'] ?? '',
      };

  return new Pool({ ...config, ...overrides });
}

/**
 * Singleton pool instance for the application.
 * Import this in repositories and services.
 */
let _pool: Pool | null = null;

export function getPool(): Pool {
  if (_pool === null) {
    _pool = createPool();
  }
  return _pool;
}

/**
 * Closes the singleton pool. Call during graceful shutdown.
 */
export async function closePool(): Promise<void> {
  if (_pool !== null) {
    await _pool.end();
    _pool = null;
  }
}
