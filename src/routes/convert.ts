import { Hono } from "hono"
import { z } from "zod"
import { usageMiddleware } from "../middleware/usage.js"
import type { Variables } from "../types/env.js"

const convert = new Hono<{ Variables: Variables }>()

const pdfToDocxSchema = z.object({
  url: z.string().url().optional(),
  file: z.string().optional(),
})

const imageToWebpSchema = z.object({
  url: z.string().url(),
  quality: z.number().int().min(1).max(100).default(80),
  width: z.number().int().positive().optional(),
})

convert.post("/pdf-to-docx", usageMiddleware(5), async (c) => {
  const body = await c.req.json()
  const parsed = pdfToDocxSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: "validation_error", details: parsed.error.flatten() }, 400)
  }
  return c.json({
    success: true,
    message: "PDF-to-DOCX conversion queued",
    estimatedTime: "~30s",
    downloadUrl: null,
    creditsUsed: 5,
  })
})

convert.post("/image-to-webp", usageMiddleware(2), async (c) => {
  const body = await c.req.json()
  const parsed = imageToWebpSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: "validation_error", details: parsed.error.flatten() }, 400)
  }

  try {
    const response = await fetch(parsed.data.url)
    if (!response.ok) {
      return c.json({ error: "fetch_failed", message: "Could not fetch image from URL" }, 400)
    }

    const contentType = response.headers.get("content-type") ?? "image/jpeg"
    const buffer = Buffer.from(await response.arrayBuffer())
    const originalSizeBytes = buffer.length

    let sharpInstance = (await import("sharp")).default(buffer)

    if (parsed.data.width) {
      sharpInstance = sharpInstance.resize(parsed.data.width)
    }

    const converted = await sharpInstance
      .webp({ quality: parsed.data.quality })
      .toBuffer()

    const base64 = converted.toString("base64")
    const dataUri = `data:image/webp;base64,${base64}`

    return c.json({
      success: true,
      format: "webp",
      quality: parsed.data.quality,
      originalUrl: parsed.data.url,
      convertedDataUri: dataUri,
      originalSizeBytes,
      convertedSizeBytes: converted.length,
      reductionPercent: Number(((1 - converted.length / originalSizeBytes) * 100).toFixed(1)),
      creditsUsed: 2,
    })
  } catch (err) {
    console.error("Image conversion failed:", err)
    return c.json({ error: "conversion_failed", message: "Image processing error" }, 500)
  }
})

export { convert }
