import { db } from "../db/index.js"
import { usageLogs, accounts } from "../db/schema.js"
import { eq, sql, and, gte, lt } from "drizzle-orm"
import type { Tier } from "../types/index.js"
import { PLANS } from "../types/index.js"

export async function checkAndDeductCredits(
  accountId: string,
  creditsNeeded: number,
): Promise<{ allowed: boolean; remaining: number }> {
  const account = await db
    .select({
      monthlyCredits: accounts.monthlyCredits,
      creditsUsed: accounts.creditsUsed,
    })
    .from(accounts)
    .where(eq(accounts.id, accountId))
    .limit(1)

  if (account.length === 0) return { allowed: false, remaining: 0 }

  const { monthlyCredits, creditsUsed } = account[0]
  const remaining = monthlyCredits - creditsUsed

  if (remaining < creditsNeeded) {
    return { allowed: false, remaining }
  }

  await db
    .update(accounts)
    .set({
      creditsUsed: creditsUsed + creditsNeeded,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(accounts.id, accountId))

  return { allowed: true, remaining: remaining - creditsNeeded }
}

interface UsageSummary {
  totalCreditsUsed: number
  totalRequests: number
  byEndpoint: Record<string, number>
}

export async function getCurrentUsage(accountId: string): Promise<UsageSummary> {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString()

  const logs = await db
    .select({
      endpoint: usageLogs.endpoint,
      creditsUsed: usageLogs.creditsUsed,
    })
    .from(usageLogs)
    .where(
      and(
        eq(usageLogs.accountId, accountId),
        gte(usageLogs.timestamp, startOfMonth),
        lt(usageLogs.timestamp, startOfNextMonth),
      ),
    )

  const summary: UsageSummary = {
    totalCreditsUsed: 0,
    totalRequests: logs.length,
    byEndpoint: {},
  }

  for (const log of logs) {
    summary.totalCreditsUsed += log.creditsUsed
    summary.byEndpoint[log.endpoint] =
      (summary.byEndpoint[log.endpoint] ?? 0) + log.creditsUsed
  }

  return summary
}

export async function logUsage(
  accountId: string,
  apiKeyId: string,
  endpoint: string,
  status: number,
  creditsUsed: number,
  ip?: string,
): Promise<void> {
  await db.insert(usageLogs).values({
    id: crypto.randomUUID(),
    accountId,
    apiKeyId,
    endpoint,
    status,
    creditsUsed,
    ip,
    timestamp: new Date().toISOString(),
  })
}

export async function getMonthlyResetFn() {
  // Reset credits_used for all accounts at UTC midnight on the 1st of each month
  await db
    .update(accounts)
    .set({ creditsUsed: 0, updatedAt: new Date().toISOString() })
}
