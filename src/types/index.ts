import type { z } from "zod"

export type Tier = "free" | "starter" | "pro" | "enterprise"

export interface PlanConfig {
  tier: Tier
  name: string
  price: number // cents
  monthlyCredits: number
  rateLimit: {
    requestsPerSecond: number
    burstSize: number
  }
  maxFileSizeMb: number
  concurrentRequests: number
  overageCostPer1k: number // cents
  supportsTeam: boolean
  prioritySupport: boolean
  sla: string | null
}

export const PLANS: Record<Tier, PlanConfig> = {
  free: {
    tier: "free",
    name: "Free",
    price: 0,
    monthlyCredits: 500,
    rateLimit: { requestsPerSecond: 5, burstSize: 10 },
    maxFileSizeMb: 5,
    concurrentRequests: 2,
    overageCostPer1k: 200, // $2.00 per 1k
    supportsTeam: false,
    prioritySupport: false,
    sla: null,
  },
  starter: {
    tier: "starter",
    name: "Starter",
    price: 1900, // $19
    monthlyCredits: 10_000,
    rateLimit: { requestsPerSecond: 50, burstSize: 100 },
    maxFileSizeMb: 25,
    concurrentRequests: 10,
    overageCostPer1k: 100, // $1.00 per 1k
    supportsTeam: false,
    prioritySupport: false,
    sla: "99.9%",
  },
  pro: {
    tier: "pro",
    name: "Pro",
    price: 9900, // $99
    monthlyCredits: 100_000,
    rateLimit: { requestsPerSecond: 200, burstSize: 500 },
    maxFileSizeMb: 100,
    concurrentRequests: 50,
    overageCostPer1k: 50, // $0.50 per 1k
    supportsTeam: true,
    prioritySupport: true,
    sla: "99.95%",
  },
  enterprise: {
    tier: "enterprise",
    name: "Enterprise",
    price: 0, // custom
    monthlyCredits: 0, // custom
    rateLimit: { requestsPerSecond: 1000, burstSize: 2000 },
    maxFileSizeMb: 500,
    concurrentRequests: 200,
    overageCostPer1k: 25, // $0.25 per 1k
    supportsTeam: true,
    prioritySupport: true,
    sla: "99.99%",
  },
}

export interface ApiKeyData {
  id: string
  key: string
  accountId: string
  tier: Tier
  isActive: boolean
  createdAt: string
}

export interface UsageRecord {
  id: string
  accountId: string
  apiKeyId: string
  endpoint: string
  status: number
  creditCost: number
  timestamp: string
}

export type EndpointCategory =
  | "convert"
  | "scrape"
  | "screenshot"
  | "fuel"
  | "account"

export interface EndpointDef {
  method: "GET" | "POST"
  path: string
  category: EndpointCategory
  description: string
  creditCost: number
  maxFileSizeMb?: number
}
