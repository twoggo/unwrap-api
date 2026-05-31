import { Hono } from "hono"
import { z } from "zod"
import { usageMiddleware } from "../middleware/usage.js"
import type { Variables } from "../types/env.js"

const screenshot = new Hono<{ Variables: Variables }>()

const screenshotSchema = z.object({
  url: z.string().url(),
  width: z.number().int().min(320).max(3840).default(1280),
  height: z.number().int().min(240).max(2160).default(720),
  fullPage: z.boolean().default(false),
  format: z.enum(["png", "jpeg", "webp"]).default("png"),
  delay: z.number().int().min(0).max(30000).default(0),
})

// POST /v1/screenshot
screenshot.post("/", usageMiddleware(3), async (c) => {
  const body = await c.req.json()
  const parsed = screenshotSchema.safeParse(body)

  if (!parsed.success) {
    return c.json(
      { error: "validation_error", details: parsed.error.flatten() },
      400,
    )
  }

  // In production: use Playwright or a screenshot service like Urlbox
  return c.json({
    success: true,
    screenshotUrl: null, // CDN URL to the screenshot
    params: parsed.data,
    creditsUsed: 3,
  })
})

export { screenshot }
