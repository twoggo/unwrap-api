import { createHash, randomBytes } from "node:crypto"
import { db } from "../db/index.js"
import { apiKeys, accounts } from "../db/schema.js"
import { eq, and } from "drizzle-orm"
import type { Tier, PlanConfig, PLANS } from "../types/index.js"

function hashApiKey(key: string): string {
  const salt = process.env.API_KEY_HASH_SALT ?? "unwrap-default-salt"
  return createHash("sha256")
    .update(`${salt}:${key}`)
    .digest("hex")
}

export function generateApiKey(): { raw: string; prefix: string; hash: string } {
  const raw = `uw_${randomBytes(32).toString("hex")}`
  const prefix = raw.slice(0, 10)
  const hash = hashApiKey(raw)
  return { raw, prefix, hash }
}

export async function validateApiKey(
  key: string,
): Promise<{ accountId: string; keyId: string; tier: Tier } | null> {
  const hash = hashApiKey(key)
  const result = await db
    .select({
      id: apiKeys.id,
      accountId: apiKeys.accountId,
      isActive: apiKeys.isActive,
      tier: accounts.tier,
    })
    .from(apiKeys)
    .innerJoin(accounts, eq(apiKeys.accountId, accounts.id))
    .where(
      and(eq(apiKeys.keyHash, hash), eq(apiKeys.isActive, true), eq(accounts.isActive, true)),
    )
    .limit(1)

  if (result.length === 0) return null

  // Update last used
  await db
    .update(apiKeys)
    .set({ lastUsedAt: new Date().toISOString() })
    .where(eq(apiKeys.id, result[0].id))

  return {
    accountId: result[0].accountId,
    keyId: result[0].id,
    tier: result[0].tier as Tier,
  }
}

export async function createApiKeyForAccount(
  accountId: string,
  label?: string,
): Promise<{ rawKey: string; prefix: string }> {
  const { raw, prefix, hash } = generateApiKey()
  await db.insert(apiKeys).values({
    id: crypto.randomUUID(),
    accountId,
    keyPrefix: prefix,
    keyHash: hash,
    label: label ?? "default",
    createdAt: new Date().toISOString(),
  })
  return { rawKey: raw, prefix }
}
