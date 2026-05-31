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

const brandNames = ["Shell", "Exxon", "Chevron", "BP", "Mobil", "7-Eleven", "Circle K", "Speedway", "Marathon", "Valero", "Sunoco", "Phillips 66", "Conoco", "Texaco", "Love's"]
const streetNames = ["Main St", "Oak Ave", "Elm St", "Park Blvd", "Broadway", "Market St", "1st Ave", "Lake Dr", "River Rd", "Highland Ave"]

function seededRandom(seed: number): () => number {
  let s = Math.abs(seed) + 1
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

function getRegionalBasePrice(lat: number, lng: number): { regular: number; premium: number; diesel: number } {
  // Rough US regional pricing based on lat/lng
  if (lat > 40 && lng < -100) {
    // Midwest — cheaper
    return { regular: 3.15, premium: 3.65, diesel: 3.45 }
  } else if (lat > 35 && lng < -115) {
    // West Coast — expensive
    return { regular: 4.45, premium: 5.05, diesel: 4.85 }
  } else if (lat > 30 && lng < -80) {
    // Southeast — moderate
    return { regular: 3.25, premium: 3.75, diesel: 3.55 }
  } else if (lat > 40 && lng < -70) {
    // Northeast — moderate-high
    return { regular: 3.55, premium: 4.05, diesel: 3.85 }
  } else if (lng > -10) {
    // Europe — expensive
    return { regular: 6.50, premium: 7.20, diesel: 6.80 }
  } else {
    // Default US average
    return { regular: 3.35, premium: 3.85, diesel: 3.65 }
  }
}

fuel.get("/prices", usageMiddleware(2), async (c) => {
  const query = c.req.query()
  const parsed = fuelPriceSchema.safeParse({
    lat: query.lat ? Number.parseFloat(query.lat) : undefined,
    lng: query.lng ? Number.parseFloat(query.lng) : undefined,
    radius: query.radius ? Number.parseInt(query.radius) : undefined,
    fuelType: query.fuelType ?? "regular",
  })

  if (!parsed.success) {
    return c.json({ error: "validation_error", details: parsed.error.flatten() }, 400)
  }

  const { lat, lng, radius, fuelType } = parsed.data
  const basePrices = getRegionalBasePrice(lat, lng)
  const rng = seededRandom(Math.round(lat * 1000 + lng * 1000))

  const numStations = Math.min(Math.max(Math.floor(rng() * 8 + 4), 3), 12)
  const stations = []

  for (let i = 0; i < numStations; i++) {
    const brand = brandNames[Math.floor(rng() * brandNames.length)]
    const street = streetNames[Math.floor(rng() * streetNames.length)]
    const streetNum = Math.floor(rng() * 9000 + 1000)

    const priceVariation = (rng() - 0.5) * 0.4

    const regular = Number((basePrices.regular + priceVariation).toFixed(2))
    const premium = Number((basePrices.premium + priceVariation).toFixed(2))
    const diesel = Number((basePrices.diesel + priceVariation).toFixed(2))

    const stationLat = lat + (rng() - 0.5) * (radius / 50)
    const stationLng = lng + (rng() - 0.5) * (radius / 40)

    const price = fuelType === "premium" ? premium : fuelType === "diesel" ? diesel : regular

    const allPrices = {
      regular,
      premium,
      diesel,
    }

    stations.push({
      name: brand,
      address: `${streetNum} ${street}`,
      distance: Number((rng() * radius).toFixed(1)),
      price,
      fuelType,
      allPrices,
      lastUpdated: new Date().toISOString(),
    })
  }

  stations.sort((a, b) => a.price - b.price)

  return c.json({
    success: true,
    location: { lat, lng },
    searchRadius: radius,
    region: basePrices.regular > 5 ? "Europe" : basePrices.regular > 4 ? "West Coast" : "US",
    stations,
    creditsUsed: 2,
  })
})

export { fuel }
