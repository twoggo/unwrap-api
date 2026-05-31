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

// Root — HTML landing page (no auth)
app.get("/", (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Unwrap API</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0A0A0F; color: #E2E8F0; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
.container { max-width: 800px; padding: 40px; text-align: center; }
h1 { font-size: 3rem; font-weight: 700; background: linear-gradient(135deg, #6366F1, #818CF8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 12px; }
p { color: #94A3B8; font-size: 1.1rem; margin-bottom: 32px; line-height: 1.6; }
.endpoints { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; text-align: left; margin-bottom: 32px; }
.card { background: #1A1A2E; border: 1px solid #2D2D44; border-radius: 12px; padding: 16px; }
.card .method { display: inline-block; font-size: 0.7rem; font-weight: 700; padding: 2px 8px; border-radius: 4px; margin-bottom: 6px; }
.method.post { background: #065F46; color: #6EE7B7; }
.method.get { background: #1E3A5F; color: #93C5FD; }
.card code { display: block; font-size: 0.85rem; color: #A5B4FC; margin: 4px 0; }
.card small { font-size: 0.8rem; color: #64748B; }
.cta { display: inline-block; background: #6366F1; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 1rem; transition: background 0.2s; }
.cta:hover { background: #4F46E5; }
.demo-key { margin-top: 24px; background: #1A1A2E; border: 1px solid #2D2D44; border-radius: 12px; padding: 16px; }
.demo-key code { display: block; font-size: 0.8rem; color: #A5B4FC; word-break: break-all; margin-top: 8px; background: #0A0A0F; padding: 8px; border-radius: 6px; }
footer { margin-top: 32px; color: #475569; font-size: 0.85rem; }
</style>
</head>
<body>
<div class="container">
  <h1>Unwrap API</h1>
  <p>One API for image conversion, website screenshots, and real-time data.<br>No SDK required. Just HTTP.</p>

  <div class="endpoints">
    <div class="card">
      <span class="method post">POST</span>
      <code>/v1/convert/image-to-webp</code>
      <small>Convert images to WebP format via sharp</small>
    </div>
    <div class="card">
      <span class="method post">POST</span>
      <code>/v1/screenshot</code>
      <small>Capture website screenshots via Playwright</small>
    </div>
    <div class="card">
      <span class="method get">GET</span>
      <code>/v1/fuel/prices</code>
      <small>Realistic local fuel prices by lat/lng</small>
    </div>
    <div class="card">
      <span class="method post">POST</span>
      <code>/v1/convert/pdf-to-docx</code>
      <small>Convert PDF to editable DOCX</small>
    </div>
  </div>

  <div class="demo-key">
    <strong>Try it now</strong>
    <code style="margin-top:8px;font-size:0.8rem">curl -X POST https://${c.req.header("host")}/v1/convert/image-to-webp \<br>  -H "x-api-key: CHECK_SERVER_LOGS_FOR_KEY" \<br>  -H "content-type: application/json" \<br>  -d '{"url":"https://i.imgur.com/3YI5yqo.jpeg","quality":80}'</code>
    <small style="display:block;margin-top:8px;color:#64748B">Grab your API key from the server logs or run the seed script.</small>
  </div>

  <a class="cta" href="https://docs.unwrap.dev" target="_blank">Read the Docs</a>

  <footer>
    <code>curl -H "x-api-key: YOUR_KEY" https://api.unwrap.dev/v1/account/usage</code>
  </footer>
</div>
</body>
</html>`)
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
