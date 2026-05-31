import type { Context, Next } from "hono"
import { validateApiKey } from "../services/auth.js"
import type { Variables } from "../types/env.js"

export async function authMiddleware(c: Context<{ Variables: Variables }>, next: Next) {
  const apiKey = c.req.header("x-api-key")

  if (!apiKey) {
    return c.json(
      {
        error: "unauthorized",
        message: "Missing X-API-Key header. Get your API key at https://unwrap.dev",
      },
      401,
    )
  }

  const result = await validateApiKey(apiKey)
  if (!result) {
    return c.json(
      {
        error: "invalid_key",
        message: "Invalid or deactivated API key.",
      },
      401,
    )
  }

  c.set("accountId", result.accountId)
  c.set("keyId", result.keyId)
  c.set("tier", result.tier)

  await next()
}
