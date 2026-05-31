import { Hono } from "hono"
import { z } from "zod"
import { usageMiddleware } from "../middleware/usage.js"
import type { Variables } from "../types/env.js"

const fuel = new Hono<{ Variables: Variables }>()

const fuelPriceSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  radius: z.number().int().min(1).max(50).default(10),
  fuelType: z.enum(["regular", "premium", "diesel", "all"]).default("regular"),
})

// GET /v1/fuel/prices
fuel.get("/prices", usageMiddleware(2), async (c) => {
  const query = c.req.query()
  const parsed = fuelPriceSchema.safeParse({
    lat: query.lat ? Number.parseFloat(query.lat) : undefined,
    lng: query.lng ? Number.parseFloat(query.lng) : undefined,
    radius: query.radius ? Number.parseInt(query.radius) : undefined,
    fuelType: query.fuelType ?? "regular",
  })

  if (!parsed.success) {
    return c.json(
      { error: "validation_error", details: parsed.error.flatten() },
      400,
    )
  }

  // In production: scrape GasBuddy or use a data provider
  return c.json({
    success: true,
    location: { lat: parsed.data.lat, lng: parsed.data.lng },
    stations: [
      {
        name: "Shell",
        address: "123 Main St",
        price: 3.45,
        fuelType: parsed.data.fuelType,
        lastUpdated: new Date().toISOString(),
      },
    ],
    creditsUsed: 2,
  })
})

export { fuel }
