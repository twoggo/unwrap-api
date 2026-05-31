import { Hono } from "hono"
import Stripe from "stripe"
import { db } from "../db/index.js"
import { accounts } from "../db/schema.js"
import { eq } from "drizzle-orm"
import type { Tier } from "../types/index.js"

const webhook = new Hono()

function getTierFromPrice(priceId: string): Tier | null {
  const mapping: Record<string, Tier> = {
    // These IDs come from your Stripe dashboard
    // price_starter: "starter",
    // price_pro: "pro",
  }
  return mapping[priceId] ?? null
}

webhook.post("/stripe", async (c) => {
  const sig = c.req.header("stripe-signature")
  if (!sig) {
    return c.json({ error: "missing_signature" }, 400)
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  const body = await c.req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    )
  } catch {
    return c.json({ error: "invalid_signature" }, 400)
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session
      const email = session.customer_details?.email
      const customerId = session.customer as string
      const priceId = session.line_items?.data[0]?.price?.id

      if (email && priceId) {
        const tier = getTierFromPrice(priceId) ?? "starter"
        await db
          .update(accounts)
          .set({
            stripeCustomerId: customerId,
            tier,
            monthlyCredits:
              tier === "starter" ? 10_000 : tier === "pro" ? 100_000 : 500,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(accounts.email, email))
      }
      break
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      await db
        .update(accounts)
        .set({
          tier: "free",
          monthlyCredits: 500,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(accounts.stripeCustomerId, customerId))
      break
    }
  }

  return c.json({ received: true })
})

export { webhook }
