import type { Context, Next } from "hono"
import { checkAndDeductCredits, logUsage } from "../services/usage.js"
import { PLANS } from "../types/index.js"
import type { Variables } from "../types/env.js"

export function usageMiddleware(creditCost: number = 1) {
  return async (c: Context<{ Variables: Variables }>, next: Next) => {
    const accountId = c.get("accountId") as string
    const tier = c.get("tier") as string

    if (!accountId) {
      return c.json({ error: "internal_error", message: "No account context" }, 500)
    }

    const { allowed, remaining } = await checkAndDeductCredits(accountId, creditCost)

    // Set remaining credits header regardless
    c.res.headers.set("X-Remaining-Credits", String(remaining))

    if (!allowed) {
      const plan = PLANS[tier as keyof typeof PLANS]
      return c.json(
        {
          error: "insufficient_credits",
          message: `You've used all ${plan.monthlyCredits.toLocaleString()} monthly credits. Upgrade your plan or wait for reset.`,
          tier,
          planLimit: plan.monthlyCredits,
        },
        402, // 402 Payment Required
      )
    }

    // Re-add credits if the request fails downstream
    const startTime = Date.now()
    try {
      await next()
    } finally {
      const keyId = c.get("keyId") as string
      const status = c.res.status
      const responseTimeMs = Date.now() - startTime
      const ip = c.req.header("x-forwarded-for") ?? c.req.header("cf-connecting-ip")

      await logUsage(accountId, keyId, c.req.path, status, creditCost, ip).catch(
        (err) => console.error("Failed to log usage:", err),
      )
    }
  }
}
