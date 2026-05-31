import { describe, it, expect } from "vitest"
import { PLANS } from "../src/types/index.js"

describe("PLANS", () => {
  it("has correct pricing for all tiers", () => {
    expect(PLANS.free.price).toBe(0)
    expect(PLANS.free.monthlyCredits).toBe(500)

    expect(PLANS.starter.price).toBe(1900) // $19
    expect(PLANS.starter.monthlyCredits).toBe(10_000)

    expect(PLANS.pro.price).toBe(9900) // $99
    expect(PLANS.pro.monthlyCredits).toBe(100_000)
  })

  it("has escalating rate limits", () => {
    expect(PLANS.free.rateLimit.requestsPerSecond).toBeLessThan(
      PLANS.starter.rateLimit.requestsPerSecond,
    )
    expect(PLANS.starter.rateLimit.requestsPerSecond).toBeLessThan(
      PLANS.pro.rateLimit.requestsPerSecond,
    )
    expect(PLANS.pro.rateLimit.requestsPerSecond).toBeLessThan(
      PLANS.enterprise.rateLimit.requestsPerSecond,
    )
  })

  it("has decreasing overage costs for higher tiers", () => {
    expect(PLANS.free.overageCostPer1k).toBeGreaterThan(
      PLANS.starter.overageCostPer1k,
    )
    expect(PLANS.starter.overageCostPer1k).toBeGreaterThan(
      PLANS.pro.overageCostPer1k,
    )
    expect(PLANS.pro.overageCostPer1k).toBeGreaterThan(
      PLANS.enterprise.overageCostPer1k,
    )
  })
})
