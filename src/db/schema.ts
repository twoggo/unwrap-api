import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core"

export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  stripeCustomerId: text("stripe_customer_id").unique(),
  tier: text("tier", { enum: ["free", "starter", "pro", "enterprise"] })
    .notNull()
    .default("free"),
  monthlyCredits: integer("monthly_credits").notNull().default(500),
  creditsUsed: integer("credits_used").notNull().default(0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
})

export const apiKeys = sqliteTable("api_keys", {
  id: text("id").primaryKey(),
  accountId: text("account_id")
    .notNull()
    .references(() => accounts.id),
  keyPrefix: text("key_prefix").notNull(), // first 8 chars for identification
  keyHash: text("key_hash").notNull(),
  rawKey: text("raw_key"), // stored for display only, not used for auth
  label: text("label").notNull().default("default"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  lastUsedAt: text("last_used_at"),
  createdAt: text("created_at").notNull(),
})

export const usageLogs = sqliteTable("usage_logs", {
  id: text("id").primaryKey(),
  accountId: text("account_id")
    .notNull()
    .references(() => accounts.id),
  apiKeyId: text("api_key_id")
    .notNull()
    .references(() => apiKeys.id),
  endpoint: text("endpoint").notNull(),
  status: integer("status").notNull(),
  creditsUsed: integer("credits_used").notNull(),
  responseTimeMs: integer("response_time_ms"),
  ip: text("ip"),
  timestamp: text("timestamp").notNull(),
})

export const invoices = sqliteTable("invoices", {
  id: text("id").primaryKey(),
  accountId: text("account_id")
    .notNull()
    .references(() => accounts.id),
  stripeInvoiceId: text("stripe_invoice_id").unique(),
  amount: integer("amount").notNull(), // cents
  currency: text("currency").notNull().default("usd"),
  status: text("status", {
    enum: ["open", "paid", "uncollectible", "void"],
  }).notNull(),
  periodStart: text("period_start").notNull(),
  periodEnd: text("period_end").notNull(),
  createdAt: text("created_at").notNull(),
})

export const rateLimitLogs = sqliteTable("rate_limit_logs", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  endpoint: text("endpoint").notNull(),
  blockedAt: text("blocked_at").notNull(),
  reason: text("reason").notNull(),
})
