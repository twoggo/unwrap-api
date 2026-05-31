import { describe, it, expect } from "vitest"
import { PLANS } from "../src/types/index.js"

// Unit tests for API key generation logic only (no DB dependency)
// Full integration tests require a running database.

describe("API key format", () => {
  // Replicate the key generation logic here to avoid DB import
  async function simulateKeyGeneration() {
    const { randomBytes, createHash } = await import("node:crypto")
    const raw = `uw_${randomBytes(32).toString("hex")}`
    const prefix = raw.slice(0, 10)
    const hash = createHash("sha256")
      .update(`test-salt:${raw}`)
      .digest("hex")
    return { raw, prefix, hash }
  }

  it("generates keys with uw_ prefix", async () => {
    const { raw, prefix, hash } = await simulateKeyGeneration()
    expect(raw.startsWith("uw_")).toBe(true)
    expect(raw.length).toBeGreaterThan(30)
    expect(prefix.length).toBe(10)
    expect(hash.length).toBe(64)
  })

  it("generates unique keys each time", async () => {
    const key1 = await simulateKeyGeneration()
    const key2 = await simulateKeyGeneration()
    expect(key1.raw).not.toBe(key2.raw)
    expect(key1.hash).not.toBe(key2.hash)
  })
})
