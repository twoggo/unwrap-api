# Unwrap API — Complete Startup Business Plan

---

## 1. Business Model

### Tiered Pricing

| Tier | Price | Credits/Mo | Rate Limit | Max File Size | Overage/1K | Support |
|------|-------|------------|------------|--------------|------------|---------|
| **Free** | $0 | 500 | 5 req/s | 5 MB | $2.00 | Community |
| **Starter** | $19 | 10,000 | 50 req/s | 25 MB | $1.00 | Email |
| **Pro** | $99 | 100,000 | 200 req/s | 100 MB | $0.50 | Priority |
| **Enterprise** | Custom | Custom | 1,000 req/s | 500 MB | $0.25 | SLA + Phone |

### Per-Tier Feature Breakdown

- **Free**: 1 API key, basic endpoints, community support, no SLA
- **Starter**: 3 API keys, all endpoints, email support, 99.9% SLA
- **Pro**: 10 API keys, team access (invite members), priority support, 99.95% SLA, usage analytics dashboard
- **Enterprise**: Unlimited keys, SSO/SAML, dedicated SLAs, custom endpoints, on-premise option, annual billing discount

### Overage Pricing
- Charged per 1,000 additional credits per billing cycle
- Auto-recharge can be toggled on/off in dashboard
- Capped at 2x plan credit limit unless explicitly approved

### Payment Processor: **Stripe**
- Stripe is the clear choice over Paddle for a developer-focused API product:
  - **Native billing portal** for subscription management (self-serve)
  - **Best-in-class API** for metered billing and usage records
  - **Stripe Tax** automates sales tax collection worldwide
  - Cheaper than Paddle: 2.9% + $0.30 vs Paddle's 5% + $0.50
  - Developer audience expects Stripe integration
  - Paddle's advantage (frictionless global tax compliance) matters more for B2C SaaS

### Endpoint Credit Cost Rationale
- `/convert/pdf-to-docx`: 5 credits (CPU-intensive, large file processing)
- `/convert/image-to-webp`: 2 credits (moderate compute)
- `/screenshot`: 3 credits (headless browser overhead)
- `/fuel/prices`: 2 credits (external data fetch + parsing)
- Account endpoints: 0 credits (free operational calls)

---

## 2. Technical Architecture

### Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Language** | TypeScript (Node.js 22) | Type safety, massive ecosystem, solo dev leverage |
| **Framework** | Hono | Fastest Node.js web framework, edge-ready, Zod integration |
| **Runtime** | Node.js (via @hono/node-server) | Proven, simple deployment |
| **Database** | Turso (libSQL) | Edge-distributed SQLite, free tier, no ops |
| **Cache/Rate Limits** | Redis (Upstash) | Serverless Redis, 100MB free tier |
| **ORM** | Drizzle | Type-safe, lightweight, no magic |
| **Validation** | Zod + @hono/zod-openapi | Runtime validation + OpenAPI spec generation |
| **Hosting** | Railway (Hobby → Pro) | Simple deploy, $5 → $20/mo, auto-scaling |
| **CDN** | Cloudflare | Cache screenshots/conversions, DDoS protection |
| **Object Storage** | R2 (Cloudflare) | S3-compatible, no egress fees |
| **Billing** | Stripe + webhooks | Metered billing, customer portal |
| **Docs** | Mintlify | Best-in-class API docs, free for public |
| **Monitoring** | Sentry (free) + Grafana ($0) | Error tracking + usage dashboards |
| **Logging** | Pino + Logtail | Structured JSON logging, live tail |
| **CI** | GitHub Actions | Free for public repos, 2000 min/mo |
| **Domain** | unwrap.dev + api.unwrap.dev | Professional, short, catchy |

### API Structure

**REST over GraphQL** — Why: REST is simpler for solo ops, cacheable at CDN edge, easier to version, and GraphQL's advantages (over-fetching prevention) matter more for complex UIs, not API services.

**Versioning Strategy**: `/v1/`, `/v2/` path-based versioning. Maintain each version for 12 months minimum after deprecation notice.

**Authentication**: API key in `X-API-Key` header (Bearer token alternative avoided for simplicity). Keys are `uw_{64-char-hex}` and stored as SHA-256 hash. Raw key shown once at creation.

### Endpoint Structure

```
POST   /v1/convert/pdf-to-docx      # PDF → DOCX
POST   /v1/convert/image-to-webp    # Image → WebP
POST   /v1/screenshot               # Website screenshot
GET    /v1/fuel/prices              # Local fuel prices
GET    /v1/account/usage            # Current usage
POST   /v1/account/keys             # Create API key
GET    /v1/account/profile          # Account info
POST   /webhook/stripe              # Stripe events
GET    /health                      # Health check
```

### Rate Limiting & Quota Enforcement

**Two-layer system**:
1. **Sliding window per second** (hono-rate-limiter + Upstash Redis): Rejects at 429 if requests/second exceeds plan limit. Uses Redis for distributed accuracy.
2. **Monthly credit bucket** (SQLite check-and-deduct): Each endpoint costs N credits. Deducted before processing. Returns 402 if insufficient.

Implementation flow:
```
Request → API Key validation → Rate limit check → Credit check & deduct → Process → Log usage
```

### Scaling Strategy

**Phase 1 (MVP — solo founder)**: Single Railway container + Turso + Upstash Redis. Handles thousands of daily requests.

**Phase 2 (10K+ requests/day)**: Add R2 for file storage, Cloudflare CDN for caching. Scale vertically (Railway Pro, 2GB RAM).

**Phase 3 (100K+ requests/day)**: Horizontal scaling — multiple Railway containers behind Cloudflare Load Balancer. Turso replicas for read scaling. Queue heavy workloads (PDF conversion) via BullMQ + Redis.

**Auto-scaling rules** (containerized on Railway):
- CPU > 70% for 5 min → add instance (max 4)
- Memory > 80% for 5 min → add instance
- Scale down when < 30% for 10 min

### Database Schema

**Tables** (SQLite/Turso):
- `accounts` — id, email, stripe_customer_id, tier, monthly_credits, credits_used, timestamps
- `api_keys` — id, account_id, key_prefix, key_hash, label, is_active, last_used_at
- `usage_logs` — id, account_id, api_key_id, endpoint, status, credits_used, response_time, ip, timestamp
- `invoices` — id, account_id, stripe_invoice_id, amount, status, period
- `rate_limit_logs` — id, account_id, endpoint, blocked_at, reason

### Caching Strategy
- **R2**: Store conversion results for 24h (keyed by input hash)
- **CDN**: Cloudflare cache with 1h TTL for screenshots
- **Application**: Simple in-memory cache for fuel price data (5-min TTL to avoid scraping too frequently)
- **Redis**: Rate limiter counters only (ephemeral, no persistence needed)

---

## 3. Developer Documentation

### Platform: Mintlify

**Why Mintlify**: Purpose-built for API docs, supports code examples in multiple languages natively, OpenAPI import, beautiful search, free for public docs, and looks enterprise-grade out of the box.

### Required Documentation Sections

1. **Introduction** — What is Unwrap, tagline, supported endpoints, quick comparison table
2. **Quickstart** — Sign up → Get API key → First curl request in < 2 minutes
3. **Authentication** — How API keys work, security best practices, error codes
4. **API Reference** — Every endpoint with request/response schema, examples in curl/node.js/Python
5. **Errors** — All error codes, HTTP status mapping, retry strategies
6. **Rate Limits & Usage** — Credit system, rate limits per tier, overage, response headers
7. **Billing** — Plans, pricing, overage, invoicing, cancellation
8. **SDKs** — Node.js TypeScript client, Python client, pure curl reference
9. **Best Practices** — Error handling, retry logic, key rotation, monitoring
10. **Changelog** — Version history, breaking changes, deprecation notices

### Sample Quickstart (Node.js)

```typescript
import { UnwrapClient } from "unwrap-sdk"

const unwrap = new UnwrapClient({
  apiKey: process.env.UNWRAP_API_KEY,
})

// Convert image to WebP
const { convertedUrl } = await unwrap.convert.imageToWebp({
  url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
  quality: 85,
})

console.log(`Compressed image: ${convertedUrl}`)

// Capture website screenshot
const { screenshotUrl } = await unwrap.screenshot.capture({
  url: "https://example.com",
  fullPage: true,
  format: "webp",
})

console.log(`Screenshot: ${screenshotUrl}`)

// Check remaining credits
const { remaining } = await unwrap.account.usage()
console.log(`${remaining} credits remaining this month`)
```

### Enterprise-Grade Docs Look & Feel

- Custom domain: `docs.unwrap.dev`
- Dark theme (matches developer preference)
- Color: Indigo (#6366F1) — conveys trust, professionalism
- OpenAPI spec auto-generated from Zod schemas using `@hono/zod-openapi`
- Code examples in 3 languages per endpoint (curl, Node.js, Python) via `<CodeGroup>` tabs
- Search indexing by Algolia (included with Mintlify)
- "Try it" playground so devs can test endpoints without leaving docs
- Status badge showing API uptime (from Better Uptime or similar)
- Footer links to GitHub, Twitter, Changelog, Status page

---

## 4. Go-to-Market Strategy

### Ideal Customer Profile (ICP)

**Primary**: Solo developers and small engineering teams (1-10 people) building side projects, SaaS products, or internal tools who need one or more of: file conversion, data scraping, or automated screenshots.

**Niche segments**:
- **Real estate tech companies** — need screenshot APIs for property listings + document conversion for leases
- **E-commerce platforms** — bulk image conversion for product photos
- **Travel & fuel apps** — need local fuel price data for route-planning features
- **Legal tech startups** — PDF → DOCX conversion for document management
- **No-code/low-code builders** — integrating via API into Zapier/Make workflows

**Not a fit**: Large enterprises requiring on-premise, SOC 2, or dedicated compliance teams (that's Enterprise tier, 6-12 month sales cycle).

### 5 Acquisition Channels

#### 1. Product Hunt Launch
- **Tactic**: Launch as "Unwrap — The unified API for file conversion, screenshots, and data" with a demo video showing all 3 use cases in 60 seconds
- **Prep**: Gather 100+ upvotes before launch day via email list, Twitter/X, dev communities
- **Offer**: PH-launch special — "FREE Starter plan for 3 months" (coupon code)
- **Expected**: 5,000-10,000 visits, 200+ signups, 20-30 conversions to paid

#### 2. Developer Newsletters
- **Tactic**: Sponsor 2-3 newsletters per month targeting developers
- **Channels**: 
  - **Python Weekly** (50K subs) — $449/issue
  - **Node Weekly** (80K subs) — $500/issue
  - **HackerNews Newsletter** (70K subs) — $600/issue
- **Content**: "We built a unified API that replaces 4 separate services. Here's the architecture" — technical blog post orientation
- **Expected**: 100-200 signups per sponsorship, 5-10 conversions

#### 3. Reddit Communities
- **Tactic**: Value-first, non-promotional participation in:
  - r/webdev — "What do you use for file conversion in your web apps?"
  - r/SaaS — "Show and tell" posts
  - r/programming — Technical writeups on building the screenshot engine
- **Rule**: 90% helpful comments, 10% "by the way, we built a tool for this"
- **Expected**: 50-100 signups/month from organic Reddit

#### 4. SEO — Comparison & Tutorial Content
- **Tactic**: Target high-intent keywords in blog posts:
  - "PDF to DOCX API comparison [2026]"
  - "Best screenshot API for developers"
  - "How to build a fuel price tracker API"
  - "Image to WebP conversion API guide"
- **Keywords**: 1K-5K monthly searches, low competition (API-specific long tail)
- **Tools**: Ahrefs free tier for keyword research, write 4 blog posts/month
- **Expected**: 1,000 organic visits/month by month 6, 50 signups/month by month 9

#### 5. Open Source / Developer Tool Integrations
- **Tactic**: Build and release open-source wrappers:
  - GitHub Action for "Convert all PR images to WebP"
  - Zapier / Make integration (no-code API consumers)
  - VSCode extension (right-click convert)
- **Expected**: Viral growth potential, 100-500 stars on GitHub, passive signups

### Free Tier → Paid Conversion Strategy

**Conversion triggers**:
1. **Credit exhaustion** (500 free credits → used up in days of real use): Show upgrade modal with Starter plan
2. **Rate limit frustration** (5 req/s cap): Banner explaining "Upgrade to Starter for 50 req/s"
3. **Feature gate** (max 5MB file, single key): Inline prompts to upgrade
4. **Email drip campaign**: Day 3, 7, 14, 21 after signup
   - Day 3: "You've used X% of your free credits — here's how teams use Unwrap"
   - Day 7: Case study: "How Startup X uses Unwrap for their SaaS"
   - Day 14: Offer: "Upgrade now, get Starter at $9/month for first 3 months"
   - Day 21: "Your free credits are almost gone — here's what happens next"

**Conversion benchmarks**: Target 8-12% free → paid conversion (industry avg for API products is 5-15%)

### Launch Sequence

**Week 1 — Pre-launch**
- Day 1-2: Finalize API, deploy to production
- Day 3: Write 5 blog posts (SEO foundation)
- Day 4: Set up Mintlify docs, make them public
- Day 5: Build email waitlist landing page (unwrap.dev)
- Day 6-7: Post on HackerNews "Show HN: Unwrap API" and r/SaaS

**Month 1 — Launch**
- Week 2: Product Hunt launch (Tuesday is best day)
- Week 3: Sponsor first newsletter, publish technical blog posts
- Week 4: Launch GitHub Action, Zapier integration
- Ongoing: Engage Reddit/Twitter/X daily, respond to every signup personally

**Month 3 — Growth**
- 90 DAYS: Review churn data, refine pricing if needed
- Launch affiliate program (20% recurring commission)
- Apply to API marketplaces (RapidAPI, APILayer, etc.)
- Publish 4 more SEO blog posts
- Send customer survey: "What else should Unwrap do?"

---

## 5. Legal & Compliance

### Legal Entity: **LLC** (for solo founder, US-based)

**Why LLC over C-Corp**:
- Simple to form ($100-500 filing, no Delaware franchise tax if small)
- Pass-through taxation (no double taxation)
- Less paperwork and compliance overhead for a solo founder
- Can convert to C-Corp later when raising venture capital
- **If not US-based**: Form a US LLC anyway (Stripe Atlas or Firstbase.io, ~$500) or use your local equivalent

### Terms of Service — Essential Clauses

1. **API Usage License** — Non-exclusive, revocable, limited to API documentation
2. **Fair Use / Rate Limits** — Clearly define rate limits per tier, right to throttle abusive usage
3. **Data Processing** — Define that you process user-submitted content only as necessary to provide the service
4. **Service Level** — 99.9% uptime for paid plans, no SLA for free tier
5. **Limitation of Liability** — Cap liability to fees paid in last 12 months (standard)
6. **Indemnification** — Customer indemnifies Unwrap if they use the API for illegal purposes (web scraping regulated data)
7. **Termination** — Right to terminate for violation of Acceptable Use Policy
8. **Dispute Resolution** — Binding arbitration, no class actions

### Acceptable Use Policy (AUP) — Essential Clauses

1. **No illegal activity** — Don't use for scams, phishing, harassment
2. **No denial of service** — Don't attempt to overwhelm the API
3. **No bypassing rate limits** — Don't cycle through API keys to circumvent limits
4. **No reselling raw API access** — You must add value, not resell credits
5. **Scraping compliance** — Customers using fuel/scraping endpoints must comply with target websites' ToS
6. **Copyright compliance** — Storage of converted files must respect original copyright

### Data Privacy (GDPR, CCPA)

**Since the API processes user-submitted content** (uploaded files, URLs to scrape/capture):

1. **Data Processing Agreement (DPA)** — Offer DPA to EU customers (required by GDPR)
2. **Data retention** — Delete converted files after 24 hours (unless explicitly stored by customer)
3. **Data residency** — Store and process in US only (add EU region when scaling)
4. **No personal data** — API keys are pseudonymous, not personal data
5. **Logging** — Only log request metadata (endpoint, credits, status, timestamp, IP anonymized after 30 days)
6. **Subprocessors** — List all: Turso (DB), Upstash (Redis), Cloudflare (CDN), Stripe (billing)
7. **CCPA** — California residents can request data deletion (automated via dashboard)

### Scraping Legality

If the API scrapes public data sources (fuel prices, etc.):

1. **Scrape only publicly accessible data** (no authentication required)
2. **Respect robots.txt** (programmatically check before scraping)
3. **Rate limit scraping** to avoid overloading source servers
4. **Don't scrape copyrighted content** or personal data
5. **Legal precedent**: *hiQ Labs v. LinkedIn* (9th Circuit) established scraping publicly accessible data is legal in the US
6. **GDPR caution**: Scraping personal data of EU residents may violate GDPR even if publicly available
7. **Recommendation**: Add a note in ToS: "Customers using scraping endpoints are responsible for complying with applicable laws and the target website's terms of service"

---

## 6. Financial Projections

### 12-Month Revenue Model

**Assumptions**:
- Month 1: 10 paying customers, average $19/month
- New customer growth: 20% MoM
- Monthly churn: 5%
- Average revenue per customer: $19 (Starter plan — conservative, some will be Pro at $99)
- Free tier: 200 signups month 1, growing 15% MoM (not counted in revenue)

### Monthly Projection

| Month | Start Customers | New Customers | Churned (5%) | End Customers | MRR | Notes |
|-------|----------------|--------------|--------------|-------------|-----|-------|
| 1 | 0 | 10 | 0 | 10 | $190 | Launch month |
| 2 | 10 | 12 | 1 | 21 | $399 | |
| 3 | 21 | 14 | 1 | 34 | $646 | |
| 4 | 34 | 17 | 2 | 49 | $931 | |
| 5 | 49 | 20 | 2 | 67 | $1,273 | |
| 6 | 67 | 24 | 3 | 88 | $1,672 | Half-year mark |
| 7 | 88 | 29 | 4 | 113 | $2,147 | |
| 8 | 113 | 35 | 6 | 142 | $2,698 | |
| 9 | 142 | 42 | 7 | 177 | $3,363 | |
| 10 | 177 | 50 | 9 | 218 | $4,142 | |
| 11 | 218 | 60 | 11 | 267 | $5,073 | |
| 12 | 267 | 72 | 13 | 326 | $6,194 | Year-end |

**Year-end totals**:
- **Month 12 MRR**: $6,194
- **Month 12 ARR**: $74,328
- **12-month cumulative revenue**: $31,146

### Estimated Monthly Costs

| Category | Service | Free Tier Cost | Paid Tier Cost |
|----------|---------|---------------|----------------|
| **Hosting** | Railway | $0 (Hobby) | $20 (Pro) |
| **Database** | Turso | $0 (9GB) | $29 (Scalable) |
| **Cache** | Upstash Redis | $0 (100MB) | $0 (100MB) |
| **CDN/Storage** | Cloudflare R2 | $0 (10GB) | $0 (10GB) |
| **Billing** | Stripe | $0 (2.9% per tx) | ~$3-30/mo |
| **Docs** | Mintlify | $0 (public) | $0 |
| **Monitoring** | Sentry | $0 (5K errors) | $29 (Pro) |
| **Logging** | Better Stack | $0 (1GB/mo) | $0 |
| **Domain** | Namecheap | $12/yr | $12/yr |
| **Screenshot** | Urlbox/Playwright | $0 (self-host) | $0 |
| **Email** | Resend | $0 (100/day) | $0 |
| **Analytics** | Plausible | $0 (self-host) | $0 |
| **Total** | | **~$12/mo** | **~$60-100/mo** |

### Break-Even Analysis

- **Fixed costs**: ~$60/month (Railway Pro + Turso)
- **Variable costs**: ~2.9% of revenue (Stripe fees) + ~$0.50/1K compute-heavy requests
- **Break-even point**: 60 / $19 = ~4 customers (with $0 variable costs)
  - Realistically: Need ~$100/month to cover all costs → ~6 Starter customers
  - **Break-even achieved**: Month 2 (21 customers, $399 MRR)
  - **Solo founder salary break-even** ($5,000/mo): Month 10 (218 customers, $4,142 MRR → ~$4,000 after costs)

---

## 7. Operational Setup

### Tool Stack for Solo Founder

| Function | Tool | Cost | Purpose |
|----------|------|------|---------|
| **API Hosting** | Railway | $20/mo | Node.js container deployment |
| **Database** | Turso | $29/mo | Edge SQLite for usage, accounts |
| **Cache** | Upstash Redis | $0 | Rate limiting counters |
| **Object Storage** | Cloudflare R2 | $0 (10GB) | File conversion results |
| **CDN** | Cloudflare Free | $0 | Caching, DDoS protection |
| **DNS** | Cloudflare | $0 | Domain management |
| **Billing** | Stripe | 2.9% + $0.30 | Subscription management |
| **Docs** | Mintlify | $0 | Public documentation |
| **Monitoring** | Sentry | $29/mo | Error tracking, performance |
| **Uptime** | Better Uptime | $0 | Status page, 1-min checks |
| **Logging** | Better Stack | $0 | Log aggregation, live tail |
| **Email** | Resend | $0 | Transactional (signups, invoices) |
| **Email Marketing** | Loops | $0 (2K contacts) | Drip campaigns |
| **Analytics** | Plausible | $0 | Privacy-first site analytics |
| **CRM** | None / Notion | $0 | Track leads and conversations |
| **Support** | Zendesk / Canny | $0 | Email support + feature requests |
| **Graphic Design** | Canva | $0 | Logo, social media assets |
| **Communication** | Discord | $0 | Community support channel |

**Total monthly tool cost: ~$20-80/mo** (scales with usage)

### Solo Founder Daily Workflow

**Time budget**: 6 focused hours/day (sustainable solo schedule)

**50% — Build** (3h):
- Mon-Wed: Feature development (new endpoints, SDK improvements)
- Thu: Bug fixes, performance optimization, tech debt
- Fri: Infrastructure (deployments, monitoring, security updates)

**25% — Support** (1.5h):
- Morning: Respond to all customer emails and Discord messages (target: < 1h response time)
- Triage: Fix critical bugs immediately, log minor issues as GitHub issues
- Maintain a "known issues" page in docs

**15% — Market** (1h):
- Write 1 tweet/X post per day about building in public
- Respond to Reddit/HN comments mentioning relevant topics
- Publish 1 blog post per week (900-1500 words)
- Note customer insights for product direction

**10% — Learn & Admin** (30min):
- Read Stripe dashboard (new signups, failed payments, churn)
- Review analytics (Sentry errors, usage trends, cost trends)
- Read competitor updates, industry news
- 30min of skill development (new tech, business reading)

### First 10 Tasks to Launch MVP in 30 Days

| Day | Task | Dependencies |
|-----|------|-------------|
| **1** | Register domain (unwrap.dev), set up Cloudflare DNS + email forwarding | None |
| **2** | Incorporate LLC (Stripe Atlas or local equivalent), open business bank account | None |
| **3** | Set up Stripe account, create products/prices for all tiers | Bank account |
| **4** | Deploy API server skeleton (Hono + health check + auth) on Railway | Domain |
| **5** | Implement database schema (Turso), migration, and seed script | None |
| **6** | Build API key auth + rate limiting middleware | DB schema |
| **7** | Implement first 2 endpoints (image-to-webp, screenshot) | Auth |
| **8** | Implement remaining endpoints (pdf-to-docx, fuel, account) | Endpoints |
| **9** | Connect Stripe webhooks (subscription creation, cancellation) | Stripe setup |
| **10** | Build usage tracking + credit deduction system | DB schema |
| **11** | Set up Mintlify docs with all reference pages | API finished |
| **12** | Write quickstart guide + SDK examples (Node.js, Python, curl) | Docs |
| **13** | Build landing page (unwrap.dev) — signup flow, pricing table | Stripe |
| **14** | Set up monitoring (Sentry + Better Uptime + Plausible) | Deployment |
| **15** | Implement email automation (Resend + Loops → welcome, drip, upgrade prompts) | Landing page |
| **16** | Create GitHub Action for image conversion (open source) | SDK |
| **17** | Write and publish 3 blog posts (SEO for target keywords) | Content |
| **18** | Set up Discord server + support workflow (Canny for feature requests) | None |
| **19** | Load testing — ensure API handles 100 concurrent requests | API |
| **20** | Security audit (key hashing, input validation, rate limits, CORS) | Load test |
| **21** | Write Terms of Service + Privacy Policy + AUP | Legal templates |
| **22** | Final testing: full flow from signup → API call → usage dashboard | Everything |
| **23** | Pre-launch: Post on HackerNews "Show HN" and r/SaaS "Tell HN" | Everything |
| **24** | Pre-launch: Email waitlist, gather PH upvotes | Landing page |
| **25** | **Launch on Product Hunt** | Everything |
| **26** | Sponsor first newsletter (Node Weekly or Python Weekly) | Launch |
| **27** | Respond to all launch feedback, fix critical issues | Post-launch |
| **28** | Publish launch recap blog post ("How we built Unwrap in 30 days") | Post-launch |
| **29** | Review analytics: conversion rate, churn, popular endpoints | Data |
| **30** | Plan next sprint: what to build month 2 based on usage data | Data |

---

## Appendix: Key Metrics to Track

### Daily
- New signups (free)
- Paid conversions
- API requests (total, by endpoint)
- Errors (4xx, 5xx, rate limits hit)
- Revenue (MRR today)

### Weekly
- Churn rate (weekly cohort analysis)
- Cost per acquisition (by channel)
- Average credits used per customer
- Response times p50/p95/p99
- Support ticket volume + response time

### Monthly
- MRR, ARR, LTV
- Customer acquisition cost (CAC)
- LTV/CAC ratio (target > 3)
- Net revenue retention
- Top 5 customers by usage
- Server costs vs. revenue ratio

### The North Star Metric
**Credits consumed per day** — This correlates with both customer value received and revenue. Growing this means customers are integrating deeper.

---

*Document generated for the Unwrap API startup. v1.0 — May 2026.*
