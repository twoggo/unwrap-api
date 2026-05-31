import { Hono } from "hono"
import { authMiddleware } from "../middleware/auth.js"
import { getCurrentUsage } from "../services/usage.js"
import { createApiKeyForAccount } from "../services/auth.js"
import { db } from "../db/index.js"
import { accounts } from "../db/schema.js"
import { eq } from "drizzle-orm"
import { PLANS } from "../types/index.js"
import type { Variables } from "../types/env.js"

const account = new Hono<{ Variables: Variables }>()
account.use("*", authMiddleware)

// GET /v1/account/usage
account.get("/usage", async (c) => {
  const accountId = c.get("accountId") as string
  const tier = c.get("tier") as string
  const plan = PLANS[tier as keyof typeof PLANS]

  const usage = await getCurrentUsage(accountId)

  return c.json({
    tier,
    planLimit: plan.monthlyCredits,
    ...usage,
    remaining: plan.monthlyCredits - usage.totalCreditsUsed,
  })
})

// POST /v1/account/keys
account.post("/keys", async (c) => {
  const accountId = c.get("accountId") as string
  const { label } = await c.req.json().catch(() => ({ label: undefined }))

  const { rawKey, prefix } = await createApiKeyForAccount(accountId, label)

  return c.json({
    success: true,
    key: rawKey,
    prefix,
    message: "Save this key — you won't see it again.",
  })
})

// GET /v1/account/profile
account.get("/profile", async (c) => {
  const accountId = c.get("accountId") as string

  const result = await db
    .select({
      id: accounts.id,
      email: accounts.email,
      name: accounts.name,
      tier: accounts.tier,
      monthlyCredits: accounts.monthlyCredits,
      creditsUsed: accounts.creditsUsed,
      createdAt: accounts.createdAt,
    })
    .from(accounts)
    .where(eq(accounts.id, accountId))
    .limit(1)

  if (result.length === 0) {
    return c.json({ error: "not_found" }, 404)
  }

  return c.json(result[0])
})

export { account }
