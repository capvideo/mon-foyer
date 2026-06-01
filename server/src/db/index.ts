import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Convert SQLite ? placeholders to PostgreSQL $1, $2, ...
// Also flattens single-array-arg calling convention used in seed.ts
function toPositional(sql: string, args: any[]): [string, any[]] {
  const params = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
  let i = 0;
  return [sql.replace(/\?/g, () => `$${++i}`), params];
}

type RunResult = { lastID: number; changes: number };

const db = {
  async run(sql: string, ...args: any[]): Promise<RunResult> {
    const isInsert = /^\s*INSERT/i.test(sql);
    const finalSql = isInsert && !/RETURNING/i.test(sql) ? `${sql} RETURNING id` : sql;
    const [converted, params] = toPositional(finalSql, args);
    const result = await pool.query(converted, params);
    return {
      lastID: isInsert ? (result.rows[0]?.id ?? 0) : 0,
      changes: result.rowCount ?? 0,
    };
  },

  async get<T = any>(sql: string, ...args: any[]): Promise<T | undefined> {
    const [converted, params] = toPositional(sql, args);
    const result = await pool.query(converted, params);
    return result.rows[0] as T | undefined;
  },

  async all<T = any>(sql: string, ...args: any[]): Promise<T[]> {
    const [converted, params] = toPositional(sql, args);
    const result = await pool.query(converted, params);
    return result.rows as T[];
  },

  async exec(sql: string): Promise<void> {
    const statements = sql.split(';').map(s => s.trim()).filter(Boolean);
    for (const stmt of statements) {
      await pool.query(stmt);
    }
  },
};

export async function getDb() {
  return db;
}

export async function initDb(): Promise<void> {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      emoji TEXT NOT NULL DEFAULT '👤',
      email TEXT,
      password_hash TEXT
    );
    CREATE TABLE IF NOT EXISTS accounts (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      bank TEXT NOT NULL,
      initial_balance REAL NOT NULL DEFAULT 0,
      color TEXT NOT NULL DEFAULT '#378ADD'
    );
    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      account_id INTEGER NOT NULL,
      label TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      category TEXT NOT NULL,
      date TEXT NOT NULL,
      validated INTEGER NOT NULL DEFAULT 0,
      member_id TEXT,
      notes TEXT,
      is_rental INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS events (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT,
      end_date TEXT,
      end_time TEXT,
      description TEXT,
      member_ids TEXT NOT NULL DEFAULT '[]',
      color TEXT NOT NULL DEFAULT '#378ADD',
      location TEXT,
      reminder_minutes INTEGER
    );
    CREATE TABLE IF NOT EXISTS shopping_items (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      quantity TEXT,
      unit TEXT,
      checked INTEGER NOT NULL DEFAULT 0,
      added_by TEXT,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS todos (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      priority TEXT NOT NULL DEFAULT 'normal',
      assigned_to TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      due_date TEXT,
      event_id INTEGER,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS channels (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      member_ids TEXT NOT NULL DEFAULT '[]',
      icon TEXT
    );
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      channel_id TEXT NOT NULL,
      member_id TEXT NOT NULL,
      content TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'text',
      timestamp TEXT NOT NULL,
      metadata TEXT
    );
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id SERIAL PRIMARY KEY,
      member_id TEXT NOT NULL,
      endpoint TEXT NOT NULL,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS invites (
      token TEXT PRIMARY KEY,
      member_id TEXT NOT NULL,
      email TEXT NOT NULL,
      created_by TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used_at TEXT
    )
  `);
  // Migrations
  await pool.query(`ALTER TABLE members ADD COLUMN IF NOT EXISTS email TEXT`);
  await pool.query(`ALTER TABLE members ADD COLUMN IF NOT EXISTS password_hash TEXT`);
  await pool.query(`ALTER TABLE members ADD COLUMN IF NOT EXISTS is_admin INTEGER NOT NULL DEFAULT 0`);
  await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS members_email_idx ON members(email) WHERE email IS NOT NULL`);
}
