import { createClient } from "@libsql/client"
import { createHash } from "node:crypto"

const client = createClient({
  url: process.env.DATABASE_URL ?? "file:./data/unwrap.db",
})

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
const keyHash = createHash("sha256")
  .update(`${salt}:${rawKey}`)
  .digest("hex")

await client.execute({
  sql: `INSERT INTO api_keys (id, account_id, key_prefix, key_hash, label, is_active, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
  args: [keyId, accountId, rawKey.slice(0, 10), keyHash, "Demo Key", 1, now],
})

console.log(`Account created: ${accountId}`)
console.log(`Raw API key: ${rawKey}`)
console.log(`\ncurl -H "x-api-key: ${rawKey}" http://localhost:3000/v1/account/usage`)

client.close()
