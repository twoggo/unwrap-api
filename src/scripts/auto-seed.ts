import { createClient } from "@libsql/client"
import { createHash } from "node:crypto"

const dbUrl = process.env.DATABASE_URL ?? "file:./data/unwrap.db"
const client = createClient({ url: dbUrl })

// Run migration
const statements = [
  `CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
    stripe_customer_id TEXT UNIQUE, tier TEXT NOT NULL DEFAULT 'free',
    monthly_credits INTEGER NOT NULL DEFAULT 500, credits_used INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS api_keys (
    id TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES accounts(id),
    key_prefix TEXT NOT NULL, key_hash TEXT NOT NULL, label TEXT NOT NULL DEFAULT 'default',
    is_active INTEGER NOT NULL DEFAULT 1, last_used_at TEXT, created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS usage_logs (
    id TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES accounts(id),
    api_key_id TEXT NOT NULL REFERENCES api_keys(id), endpoint TEXT NOT NULL,
    status INTEGER NOT NULL, credits_used INTEGER NOT NULL,
    response_time_ms INTEGER, ip TEXT, timestamp TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES accounts(id),
    stripe_invoice_id TEXT UNIQUE, amount INTEGER NOT NULL, currency TEXT NOT NULL DEFAULT 'usd',
    status TEXT NOT NULL, period_start TEXT NOT NULL, period_end TEXT NOT NULL, created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS rate_limit_logs (
    id TEXT PRIMARY KEY, account_id TEXT NOT NULL, endpoint TEXT NOT NULL,
    blocked_at TEXT NOT NULL, reason TEXT NOT NULL
  )`,
]
for (const stmt of statements) {
  await client.execute(stmt)
}

// Seed demo account if none exists
const existing = await client.execute("SELECT id FROM accounts LIMIT 1")
if (existing.rows.length > 0) {
  console.log("Database ready.")
  client.close()
  process.exit(0)
}

const accountId = crypto.randomUUID()
const keyId = crypto.randomUUID()
const now = new Date().toISOString()

await client.execute({
  sql: `INSERT INTO accounts (id, email, name, tier, monthly_credits, credits_used, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  args: [accountId, "demo@unwrap.dev", "Demo User", "starter", 10000, 0, 1, now, now],
})

const rawKey = `uw_demo_${crypto.randomUUID().replace(/-/g, "")}`
const salt = process.env.API_KEY_HASH_SALT ?? "unwrap-default-salt"
const keyHash = createHash("sha256").update(`${salt}:${rawKey}`).digest("hex")

await client.execute({
  sql: `INSERT INTO api_keys (id, account_id, key_prefix, key_hash, label, is_active, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
  args: [keyId, accountId, rawKey.slice(0, 10), keyHash, "Demo Key", 1, now],
})

console.log(`\n========================================`)
console.log(`  Unwrap API is ready!`)
console.log(`  Demo API Key: ${rawKey}`)
console.log(`========================================\n`)

client.close()
