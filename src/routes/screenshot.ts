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

screenshot.post("/", usageMiddleware(3), async (c) => {
  const body = await c.req.json()
  const parsed = screenshotSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: "validation_error", details: parsed.error.flatten() }, 400)
  }

  let browser;
  try {
    const { chromium } = await import("playwright")
    browser = await chromium.launch({ headless: true })
    const context = await browser.newContext({
      viewport: { width: parsed.data.width, height: parsed.data.height },
    })
    const page = await context.newPage()

    await page.goto(parsed.data.url, {
      waitUntil: "networkidle",
      timeout: 30000,
    })

    if (parsed.data.delay > 0) {
      await page.waitForTimeout(parsed.data.delay)
    }

    const screenshotBuffer = await page.screenshot({
      type: parsed.data.format === "jpeg" ? "jpeg" : "png",
      fullPage: parsed.data.fullPage,
    })

    await browser.close()

    const mimeType =
      parsed.data.format === "jpeg" ? "image/jpeg" :
      parsed.data.format === "webp" ? "image/webp" :
      "image/png"

    const base64 = screenshotBuffer.toString("base64")
    const dataUri = `data:${mimeType};base64,${base64}`

    return c.json({
      success: true,
      screenshotDataUri: dataUri,
      width: parsed.data.width,
      height: parsed.data.height,
      format: parsed.data.format,
      fullPage: parsed.data.fullPage,
      sizeBytes: screenshotBuffer.length,
      creditsUsed: 3,
    })
  } catch (err) {
    if (browser) await browser.close().catch(() => {})
    console.error("Screenshot failed:", err)
    return c.json({ error: "screenshot_failed", message: "Could not capture screenshot" }, 500)
  }
})

export { screenshot }
