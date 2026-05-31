import type { Context } from "hono"
import type { Tier } from "../types/index.js"
import { PLANS } from "../types/index.js"

export function createRateLimitChecker(tier: Tier) {
  const plan = PLANS[tier]
  const requestCounts = new Map<string, { count: number; resetAt: number }>()

  return (c: Context): boolean => {
    const key = c.get("accountId") ?? "anonymous"
    const now = Date.now()
    const entry = requestCounts.get(key)

    if (!entry || now > entry.resetAt) {
      requestCounts.set(key, { count: 1, resetAt: now + 1000 })
      return true
    }

    entry.count++
    if (entry.count > plan.rateLimit.requestsPerSecond) {
      return false
    }

    return true
  }
}
