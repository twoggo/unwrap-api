import { serve } from "@hono/node-server"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { secureHeaders } from "hono/secure-headers"
import { errorMiddleware } from "./middleware/error.js"
import { convert } from "./routes/convert.js"
import { screenshot } from "./routes/screenshot.js"
import { fuel } from "./routes/fuel.js"
import { account } from "./routes/account.js"
import { webhook } from "./routes/webhook.js"
import type { Variables } from "./types/env.js"

const app = new Hono<{ Variables: Variables }>()

// Global middleware
app.use("*", cors())
app.use("*", secureHeaders())
app.use("*", errorMiddleware)

if (process.env.NODE_ENV !== "production") {
  app.use("*", logger())
}

// Root — API info (no auth)
app.get("/", (c) => {
  return c.json({
    service: "unwrap-api",
    version: "1.0.0",
    docs: "https://docs.unwrap.dev",
    health: "/health",
    endpoints: {
      convert: "/v1/convert/image-to-webp",
      screenshot: "/v1/screenshot",
      fuel: "/v1/fuel/prices",
      account: "/v1/account/usage",
    },
  })
})

// Health check (no auth)
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    service: "unwrap-api",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  })
})

// Public routes
app.route("/webhook", webhook)

// API v1 routes
const v1 = new Hono()

// Auth-protected routes
import { authMiddleware } from "./middleware/auth.js"
v1.use("*", authMiddleware)

v1.route("/convert", convert)
v1.route("/screenshot", screenshot)
v1.route("/fuel", fuel)
v1.route("/account", account)

app.route("/v1", v1)

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      error: "not_found",
      message: `Route ${c.req.method} ${c.req.path} not found. See docs at https://docs.unwrap.dev`,
    },
    404,
  )
})

const port = Number.parseInt(process.env.PORT ?? "3000")

console.log(`🚀 Unwrap API starting on port ${port}`)
console.log(`📖 Docs: http://localhost:${port}/health`)

serve({
  fetch: app.fetch,
  port,
})
