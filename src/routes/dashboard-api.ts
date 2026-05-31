import { Hono } from "hono"
import { z } from "zod"
import { db } from "../db/index.js"
import { accounts } from "../db/schema.js"
import { apiKeys, usageLogs } from "../db/schema.js"
import { eq, and, gte, lt, sql } from "drizzle-orm"
import { createApiKeyForAccount, validateApiKey } from "../services/auth.js"
import { getCurrentUsage } from "../services/usage.js"
import { PLANS } from "../types/index.js"
import type { Variables } from "../types/env.js"

const dashboardApi = new Hono<{ Variables: Variables }>()

// All dashboard API endpoints require API key auth
dashboardApi.use("*", async (c, next) => {
  const key = c.req.header("x-api-key")
  if (!key) return c.json({ error: "unauthorized" }, 401)
  const auth = await validateApiKey(key)
  if (!auth) return c.json({ error: "invalid_key" }, 401)
  c.set("accountId", auth.accountId)
  c.set("tier", auth.tier)
  await next()
})

dashboardApi.get("/usage", async (c) => {
  const accountId = c.get("accountId") as string
  const tier = c.get("tier") as string
  const plan = PLANS[tier as keyof typeof PLANS]
  const usage = await getCurrentUsage(accountId)
  return c.json({
    tier,
    planName: plan.name,
    planLimit: plan.monthlyCredits,
    price: plan.price,
    ...usage,
    remaining: plan.monthlyCredits - usage.totalCreditsUsed,
  })
})

dashboardApi.get("/keys", async (c) => {
  const accountId = c.get("accountId") as string
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString()

  const keys = await db
    .select({
      id: apiKeys.id,
      keyPrefix: apiKeys.keyPrefix,
      label: apiKeys.label,
      isActive: apiKeys.isActive,
      lastUsedAt: apiKeys.lastUsedAt,
      createdAt: apiKeys.createdAt,
      creditsUsed: sql<number>`COALESCE(SUM(${usageLogs.creditsUsed}), 0)`,
      requestCount: sql<number>`COUNT(${usageLogs.id})`,
    })
    .from(apiKeys)
    .leftJoin(
      usageLogs,
      and(
        eq(usageLogs.apiKeyId, apiKeys.id),
        gte(usageLogs.timestamp, startOfMonth),
        lt(usageLogs.timestamp, startOfNextMonth),
      ),
    )
    .where(eq(apiKeys.accountId, accountId))
    .groupBy(apiKeys.id)
    .orderBy(apiKeys.createdAt)
  return c.json({ keys })
})

dashboardApi.post("/keys", async (c) => {
  const accountId = c.get("accountId") as string
  const { label } = await c.req.json().catch(() => ({ label: undefined }))
  const { rawKey, prefix } = await createApiKeyForAccount(accountId, label)
  return c.json({ success: true, key: rawKey, prefix, message: "Save this key — you won't see it again." })
})

dashboardApi.post("/keys/:id/revoke", async (c) => {
  const accountId = c.get("accountId") as string
  const keyId = c.req.param("id")
  await db
    .update(apiKeys)
    .set({ isActive: false })
    .where(and(eq(apiKeys.id, keyId), eq(apiKeys.accountId, accountId)))
  return c.json({ success: true })
})

dashboardApi.get("/profile", async (c) => {
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
  if (result.length === 0) return c.json({ error: "not_found" }, 404)
  return c.json(result[0])
})

dashboardApi.get("/plans", async (c) => {
  return c.json({
    plans: Object.entries(PLANS).map(([key, plan]) => ({
      tier: key,
      name: plan.name,
      price: plan.price,
      monthlyCredits: plan.monthlyCredits,
      rateLimit: plan.rateLimit.requestsPerSecond,
      maxFileSizeMb: plan.maxFileSizeMb,
      concurrentRequests: plan.concurrentRequests,
      overageCostPer1k: plan.overageCostPer1k,
    })),
  })
})

export { dashboardApi }
