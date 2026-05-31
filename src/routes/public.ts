import { Hono } from "hono"
import { db } from "../db/index.js"
import { accounts } from "../db/schema.js"
import { eq } from "drizzle-orm"
import { createApiKeyForAccount } from "../services/auth.js"

const publicApi = new Hono()

publicApi.post("/signup", async (c) => {
  const { name, email } = await c.req.json().catch(() => ({}))

  if (!name || !email) {
    return c.json({ error: "validation_error", message: "Name and email are required" }, 400)
  }

  // Check if email already exists
  const existing = await db.select({ id: accounts.id }).from(accounts).where(eq(accounts.email, email)).limit(1)
  if (existing.length > 0) {
    return c.json({ error: "email_taken", message: "An account with this email already exists. Use your existing API key to sign in." }, 409)
  }

  const now = new Date().toISOString()
  const accountId = crypto.randomUUID()

  await db.insert(accounts).values({
    id: accountId,
    email,
    name,
    tier: "free",
    monthlyCredits: 500,
    creditsUsed: 0,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  })

  const { rawKey } = await createApiKeyForAccount(accountId, "default")

  return c.json({
    success: true,
    accountId,
    key: rawKey,
    message: "Account created. Save your API key — it won't be shown again.",
  })
})

export { publicApi }
