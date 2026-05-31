import type { Context, Next } from "hono"

export async function errorMiddleware(c: Context, next: Next) {
  try {
    await next()
  } catch (err) {
    console.error("Unhandled error:", err)
    c.status(500)
    return c.json({
      error: "internal_server_error",
      message: "An unexpected error occurred. Please try again or contact support.",
    })
  }
}
