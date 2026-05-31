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
  const host = c.req.header("host") ?? "api.unwrap.dev"
  return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Unwrap API — One API for everything</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#08080F;color:#E2E8F0;overflow-x:hidden}
nav{position:fixed;top:0;left:0;right:0;z-index:100;padding:16px 32px;display:flex;justify-content:space-between;align-items:center;background:rgba(8,8,15,.8);backdrop-filter:blur(12px);border-bottom:1px solid rgba(99,102,241,.1)}
nav .logo{font-size:1.2rem;font-weight:700;background:linear-gradient(135deg,#6366F1,#A78BFA);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
nav a{color:#94A3B8;text-decoration:none;font-size:.9rem;padding:8px 20px;border-radius:6px;border:1px solid #2D2D44;transition:.2s}
nav a:hover{border-color:#6366F1;color:#E2E8F0}
.hero{min-height:90vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:120px 24px 80px;text-align:center;position:relative}
.hero::before{content:'';position:absolute;top:20%;left:50%;transform:translateX(-50%);width:600px;height:600px;background:radial-gradient(circle,rgba(99,102,241,.08) 0%,transparent 70%);pointer-events:none}
.hero-badge{display:inline-block;padding:6px 16px;border-radius:20px;font-size:.8rem;font-weight:600;background:rgba(99,102,241,.1);border:1px solid rgba(99,102,241,.2);color:#818CF8;margin-bottom:24px;animation:fadeDown .6s ease-out}
.hero h1{font-size:clamp(2.5rem,6vw,4.2rem);font-weight:800;line-height:1.1;margin-bottom:20px;background:linear-gradient(135deg,#E2E8F0 0%,#818CF8 50%,#A78BFA 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:fadeDown .8s ease-out}
.hero p{font-size:clamp(1rem,2vw,1.25rem);color:#64748B;max-width:600px;line-height:1.7;margin-bottom:40px;animation:fadeDown 1s ease-out}
.hero-cta{display:flex;gap:12px;flex-wrap:wrap;justify-content:center;animation:fadeDown 1.2s ease-out}
.btn{display:inline-block;padding:14px 32px;border-radius:10px;font-weight:600;font-size:1rem;text-decoration:none;transition:all .2s;cursor:pointer}
.btn-primary{background:#6366F1;color:#fff}
.btn-primary:hover{background:#4F46E5;transform:translateY(-2px);box-shadow:0 8px 24px rgba(99,102,241,.3)}
.btn-secondary{background:transparent;color:#94A3B8;border:1px solid #2D2D44}
.btn-secondary:hover{border-color:#6366F1;color:#E2E8F0;transform:translateY(-2px)}
.trusted{text-align:center;padding:0 24px 60px;animation:fadeUp 1s ease-out}
.trusted p{font-size:.8rem;color:#475569;text-transform:uppercase;letter-spacing:2px;margin-bottom:20px}
.trusted-logos{display:flex;gap:40px;justify-content:center;flex-wrap:wrap;opacity:.4;font-size:.85rem;color:#64748B}
.trusted-logos span{font-weight:600}
.features{padding:80px 24px;max-width:1100px;margin:0 auto}
.features h2{text-align:center;font-size:2rem;font-weight:700;margin-bottom:12px}
.features .sub{text-align:center;color:#64748B;margin-bottom:56px}
.feature-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:20px}
.feature-card{background:#10101F;border:1px solid #1A1A2E;border-radius:16px;padding:32px;transition:all .3s;opacity:0;transform:translateY(20px);animation:fadeUp .6s ease-out forwards}
.feature-card:nth-child(1){animation-delay:.1s}
.feature-card:nth-child(2){animation-delay:.2s}
.feature-card:nth-child(3){animation-delay:.3s}
.feature-card:nth-child(4){animation-delay:.4s}
.feature-card:nth-child(5){animation-delay:.5s}
.feature-card:nth-child(6){animation-delay:.6s}
.feature-card:hover{border-color:#2D2D44;transform:translateY(-4px);box-shadow:0 12px 40px rgba(99,102,241,.06)}
.feature-icon{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.3rem;margin-bottom:16px}
.feature-card h3{font-size:1.1rem;font-weight:600;margin-bottom:8px}
.feature-card p{font-size:.9rem;color:#64748B;line-height:1.6}
.how-it-works{padding:80px 24px;background:#0C0C18;text-align:center}
.how-it-works h2{font-size:2rem;font-weight:700;margin-bottom:48px}
.steps{display:flex;gap:16px;justify-content:center;flex-wrap:wrap;max-width:900px;margin:0 auto}
.step{flex:1;min-width:220px;max-width:280px;padding:32px 20px;position:relative}
.step-num{width:36px;height:36px;border-radius:50%;background:#6366F1;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.9rem;margin:0 auto 16px}
.step h3{font-size:1rem;font-weight:600;margin-bottom:8px}
.step p{font-size:.85rem;color:#64748B;line-height:1.5}
.arrow{font-size:1.5rem;color:#2D2D44;display:flex;align-items:center;padding-top:30px}
.code-demo{max-width:650px;margin:40px auto 0;background:#0A0A0F;border:1px solid #1A1A2E;border-radius:12px;text-align:left;overflow:hidden}
.code-demo .header{display:flex;gap:8px;padding:14px 20px;border-bottom:1px solid #1A1A2E}
.code-demo .dot{width:10px;height:10px;border-radius:50%;background:#2D2D44}
.code-demo pre{padding:20px;overflow-x:auto;font-size:.8rem;color:#A5B4FC;line-height:1.7}
.code-demo .comment{color:#475569}
.cta-section{padding:100px 24px;text-align:center}
.cta-section h2{font-size:2.2rem;font-weight:700;margin-bottom:16px}
.cta-section p{color:#64748B;margin-bottom:32px;font-size:1.05rem}
.footer{text-align:center;padding:40px 24px;border-top:1px solid #1A1A2E;color:#475569;font-size:.85rem}
.footer a{color:#6366F1;text-decoration:none}
@keyframes fadeDown{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@media(max-width:640px){.feature-grid{grid-template-columns:1fr}.steps{flex-direction:column;align-items:center}}
</style>
</head>
<body>

<nav>
  <span class="logo">/// Unwrap</span>
  <a href="https://unwrap-api.mintlify.app">Read the Docs &rarr;</a>
</nav>

<section class="hero">
  <div class="hero-badge">&#9679; Live &mdash; v1.0.0</div>
  <h1>One API. Zero complexity.<br>Everything else, we handle.</h1>
  <p>A single HTTP endpoint to convert images, capture screenshots, scrape real-time data, and more. No separate SDKs. No multiple vendor accounts. One key, one bill, done.</p>
  <div class="hero-cta">
    <a class="btn btn-primary" href="https://unwrap-api.mintlify.app">Read the Docs</a>
    <a class="btn btn-secondary" href="#features">See what it does</a>
  </div>
</section>

<section class="trusted">
  <p>Built for production</p>
  <div class="trusted-logos">
    <span>Node.js</span>
    <span>TypeScript</span>
    <span>Python</span>
    <span>Playwright</span>
    <span>sharp</span>
    <span>Stripe</span>
  </div>
</section>

<section class="features" id="features">
  <h2>What you get</h2>
  <p class="sub">Everything you need to build, in one API.</p>
  <div class="feature-grid">
    <div class="feature-card">
      <div class="feature-icon" style="background:#065F46;color:#6EE7B7">&#9889;</div>
      <h3>Image conversion</h3>
      <p>Convert any image to WebP with configurable quality and resize. Powered by sharp &mdash; the fastest image processing library.</p>
    </div>
    <div class="feature-card">
      <div class="feature-icon" style="background:#1E3A5F;color:#93C5FD">&#128247;</div>
      <h3>Website screenshots</h3>
      <p>Capture pixel-perfect screenshots at any viewport. Full-page support, multiple formats, custom delays. Powered by Playwright.</p>
    </div>
    <div class="feature-card">
      <div class="feature-icon" style="background:#5B2E5F;color:#D8B4FE">&#9971;</div>
      <h3>Fuel price data</h3>
      <p>Real-time local fuel prices by coordinates. Region-aware pricing with accurate geographic baselines for US and Europe.</p>
    </div>
    <div class="feature-card">
      <div class="feature-icon" style="background:#3B2E5F;color:#A5B4FC">&#128196;</div>
      <h3>PDF conversion</h3>
      <p>Convert PDFs to editable DOCX. Handles scanned documents with OCR support. Large file support up to 500MB on enterprise plans.</p>
    </div>
    <div class="feature-card">
      <div class="feature-icon" style="background:#1E3F3F;color:#6EE7B7">&#128274;</div>
      <h3>API key auth</h3>
      <p>Secure SHA-256 hashed keys with tier-based rate limiting. Rotate keys from the dashboard. Separate dev and prod keys.</p>
    </div>
    <div class="feature-card">
      <div class="feature-icon" style="background:#2D1F3F;color:#D8B4FE">&#128200;</div>
      <h3>Usage metering</h3>
      <p>Transparent credit-based billing. Every response includes remaining credits. Overage controls and Stripe-powered auto-recharge.</p>
    </div>
  </div>
</section>

<section class="how-it-works">
  <h2>How it works</h2>
  <div class="steps">
    <div class="step">
      <div class="step-num">1</div>
      <h3>Get your key</h3>
      <p>Sign up, generate an API key in seconds. No credit card required to start.</p>
    </div>
    <div class="arrow">&rarr;</div>
    <div class="step">
      <div class="step-num">2</div>
      <h3>Make a request</h3>
      <p>Send a POST with your params. One endpoint per feature, all JSON in and out.</p>
    </div>
    <div class="arrow">&rarr;</div>
    <div class="step">
      <div class="step-num">3</div>
      <h3>Get the result</h3>
      <p>Receive processed output as JSON with base64 data URIs or download URLs.</p>
    </div>
  </div>

  <div class="code-demo">
    <div class="header"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>
    <pre><span class="comment"># Convert an image to WebP &mdash; 2 credits</span>
curl -X POST https://${host}/v1/convert/image-to-webp \\
  -H "x-api-key: uw_your_key_here" \\
  -H "content-type: application/json" \\
  -d '{"url":"https://i.imgur.com/3YI5yqo.jpeg","quality":80}'

{ "success": true, "format": "webp", "convertedDataUri": "data:image/webp;base64,...",
  "reductionPercent": 82.9, "creditsUsed": 2 }</pre>
  </div>
</section>

<section class="cta-section">
  <h2>Ready to build?</h2>
  <p>One API key unlocks every endpoint. Free tier includes 500 credits.</p>
  <a class="btn btn-primary" href="https://unwrap-api.mintlify.app" style="font-size:1.1rem;padding:16px 40px">Read the Docs &rarr;</a>
</section>

<footer class="footer">
  <a href="https://unwrap-api.mintlify.app">Docs</a> &middot;
  <a href="https://github.com/twoggo/unwrap-api">GitHub</a> &middot;
  <span>Unwrap API v1.0.0</span>
</footer>

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
      message: `Route ${c.req.method} ${c.req.path} not found. See docs at https://unwrap-api.mintlify.app`,
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
