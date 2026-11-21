import { PGlite } from '@electric-sql/pglite';
import pg from 'pg';

const schema = `
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  name VARCHAR(40) NOT NULL,
  email VARCHAR(254) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  language VARCHAR(12) NOT NULL DEFAULT 'python',
  avatar VARCHAR(16) NOT NULL DEFAULT 'turquoise',
  tutorial_completed BOOLEAN NOT NULL DEFAULT FALSE,
  lives INTEGER NOT NULL DEFAULT 5 CHECK (lives BETWEEN 0 AND 5),
  blocked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS email_codes (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose VARCHAR(10) NOT NULL CHECK (purpose IN ('verify', 'reset')),
  code_hash TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, purpose)
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS sessions_user_id ON sessions(user_id);
CREATE TABLE IF NOT EXISTS completions (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  language VARCHAR(12) NOT NULL,
  exercise_id VARCHAR(40) NOT NULL,
  points INTEGER NOT NULL DEFAULT 20,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, language, exercise_id)
);
CREATE TABLE IF NOT EXISTS attempts (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_id UUID NOT NULL,
  language VARCHAR(12) NOT NULL,
  exercise_id VARCHAR(40) NOT NULL,
  correct BOOLEAN NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, request_id)
);
CREATE INDEX IF NOT EXISTS attempts_user_time ON attempts(user_id, created_at DESC);
`;

export async function createDatabase({ url = '', ssl = false, directory } = {}) {
  if (url) {
    const pool = new pg.Pool({
      connectionString: url,
      ssl: ssl ? { rejectUnauthorized: true } : undefined,
      max: 10,
    });
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock(83214627)');
      await client.query(schema);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    return {
      query: (sql, params) => pool.query(sql, params),
      async transaction(run) {
        const connection = await pool.connect();
        try {
          await connection.query('BEGIN');
          const result = await run(connection);
          await connection.query('COMMIT');
          return result;
        } catch (error) {
          await connection.query('ROLLBACK');
          throw error;
        } finally {
          connection.release();
        }
      },
      close: () => pool.end(),
      engine: 'PostgreSQL',
    };
  }
  const database = await PGlite.create(directory);
  await database.exec(schema);
  return {
    query: (sql, params) => database.query(sql, params),
    transaction: (run) => database.transaction(run),
    close: () => database.close(),
    engine: 'PostgreSQL local (PGlite)',
  };
}
