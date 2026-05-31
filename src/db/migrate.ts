import { createClient } from "@libsql/client"
import { drizzle } from "drizzle-orm/libsql"
import * as schema from "./schema.js"

async function migrate() {
  const client = createClient({
    url: process.env.DATABASE_URL ?? "file:./data/unwrap.db",
  })
  const db = drizzle(client, { schema })

  // Create tables manually (lightweight migration)
  const statements = [
    `CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      stripe_customer_id TEXT UNIQUE,
      tier TEXT NOT NULL DEFAULT 'free',
      monthly_credits INTEGER NOT NULL DEFAULT 500,
      credits_used INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL REFERENCES accounts(id),
      key_prefix TEXT NOT NULL,
      key_hash TEXT NOT NULL,
      label TEXT NOT NULL DEFAULT 'default',
      is_active INTEGER NOT NULL DEFAULT 1,
      last_used_at TEXT,
      created_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS usage_logs (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL REFERENCES accounts(id),
      api_key_id TEXT NOT NULL REFERENCES api_keys(id),
      endpoint TEXT NOT NULL,
      status INTEGER NOT NULL,
      credits_used INTEGER NOT NULL,
      response_time_ms INTEGER,
      ip TEXT,
      timestamp TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL REFERENCES accounts(id),
      stripe_invoice_id TEXT UNIQUE,
      amount INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'usd',
      status TEXT NOT NULL,
      period_start TEXT NOT NULL,
      period_end TEXT NOT NULL,
      created_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS rate_limit_logs (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      endpoint TEXT NOT NULL,
      blocked_at TEXT NOT NULL,
      reason TEXT NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS idx_usage_account ON usage_logs(account_id)`,
    `CREATE INDEX IF NOT EXISTS idx_usage_timestamp ON usage_logs(timestamp)`,
    `CREATE INDEX IF NOT EXISTS idx_api_keys_account ON api_keys(account_id)`,
    `CREATE INDEX IF NOT EXISTS idx_invoices_account ON invoices(account_id)`,
  ]

  for (const stmt of statements) {
    await client.execute(stmt)
  }

  console.log("Migration complete")
  client.close()
}

migrate().catch(console.error)
