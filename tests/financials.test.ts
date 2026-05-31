import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { PLANS } from "../src/types/index.js"

describe("financial projections", () => {
  const startMonth = 1
  const endMonth = 12
  const avgRevenuePerCustomer = 19 // $19/month average

  function simulateMonth(
    month: number,
    previousCustomers: number,
  ): { newCustomers: number; churnedCustomers: number; totalCustomers: number; mrr: number } {
    // 20% MoM new customer growth, 5% monthly churn
    const baseNewCustomers = 10 // month 1 base
    const newCustomers = Math.round(baseNewCustomers * Math.pow(1.2, month - 1))
    const churnedCustomers = Math.round(previousCustomers * 0.05)
    const totalCustomers = previousCustomers + newCustomers - churnedCustomers
    const mrr = totalCustomers * avgRevenuePerCustomer

    return { newCustomers, churnedCustomers, totalCustomers, mrr }
  }

  it("projects 12-month revenue growth", () => {
    let customers = 0
    const results: number[] = []

    for (let m = 1; m <= 12; m++) {
      const month = simulateMonth(m, customers)
      customers = month.totalCustomers
      results.push(month.mrr)

      console.log(
        `Month ${m}: +${month.newCustomers} new, -${month.churnedCustomers} churned, ` +
        `${month.totalCustomers} total, $${month.mrr} MRR`,
      )
    }

    // By month 12, should have significant growth
    expect(results[11]).toBeGreaterThan(results[0] * 5)
    expect(customers).toBeGreaterThan(50)
  })

  it("calculates cumulative revenue", () => {
    let customers = 0
    let cumulativeMrr = 0

    for (let m = 1; m <= 12; m++) {
      const month = simulateMonth(m, customers)
      customers = month.totalCustomers
      cumulativeMrr += month.mrr
    }

    console.log(`\n12-month cumulative revenue: $${cumulativeMrr}`)
    console.log(`Month 12 MRR: $${customers * avgRevenuePerCustomer}`)
    console.log(`Month 12 ARR: $${customers * avgRevenuePerCustomer * 12}`)

    expect(cumulativeMrr).toBeGreaterThan(0)
  })
})
