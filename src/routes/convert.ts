import { Hono } from "hono"
import { z } from "zod"
import { usageMiddleware } from "../middleware/usage.js"
import type { Variables } from "../types/env.js"

const convert = new Hono<{ Variables: Variables }>()

const pdfToDocxSchema = z.object({
  url: z.string().url().optional(),
  file: z.string().optional(), // base64 encoded
})

const imageToWebpSchema = z.object({
  url: z.string().url(),
  quality: z.number().int().min(1).max(100).default(80),
  width: z.number().int().positive().optional(),
})

// POST /v1/convert/pdf-to-docx
convert.post("/pdf-to-docx", usageMiddleware(5), async (c) => {
  const body = await c.req.json()
  const parsed = pdfToDocxSchema.safeParse(body)

  if (!parsed.success) {
    return c.json(
      { error: "validation_error", details: parsed.error.flatten() },
      400,
    )
  }

  // Mock conversion - in production, call LibreOffice or a cloud converter
  return c.json({
    success: true,
    message: "PDF-to-DOCX conversion queued",
    estimatedTime: "~30s",
    // In production: return a download URL or job ID
    downloadUrl: null,
    creditsUsed: 5,
  })
})

// POST /v1/convert/image-to-webp
convert.post("/image-to-webp", usageMiddleware(2), async (c) => {
  const body = await c.req.json()
  const parsed = imageToWebpSchema.safeParse(body)

  if (!parsed.success) {
    return c.json(
      { error: "validation_error", details: parsed.error.flatten() },
      400,
    )
  }

  // Mock conversion - in production, use sharp or a cloud image processor
  return c.json({
    success: true,
    format: "webp",
    quality: parsed.data.quality,
    originalUrl: parsed.data.url,
    convertedUrl: null, // In production: CDN URL to converted file
    creditsUsed: 2,
  })
})

export { convert }
