import type Stripe from "stripe";
import { httpAction } from "./_generated/server";
import { stripe } from "./stripe";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export const stripeWebhookHandler = httpAction(async (ctx, request) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let event: Stripe.Event;

  try {
    const body = await request.text();

    if (!webhookSecret) {
      return new Response("Webhook secret not configured", { status: 500 });
    }

    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return new Response("Missing stripe-signature header", { status: 400 });
    }

    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return new Response(`Webhook error: ${errorMessage}`, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const bookingId = paymentIntent.metadata?.bookingId as string;

    if (bookingId) {
      const booking = await ctx.db
        .query("bookings")
        .withIndex("by_stripePaymentIntentId", (q) =>
          q.eq("stripePaymentIntentId", paymentIntent.id)
        )
        .first();

      if (booking) {
        await ctx.db.patch(booking._id, {
          paymentStatus: "completed",
          updatedAt: Date.now(),
        });

        await ctx.db.insert("paymentConfirmations", {
          bookingId: booking._id,
          stripePaymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: "succeeded",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    }
  } else if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    const booking = await ctx.db
      .query("bookings")
      .withIndex("by_stripePaymentIntentId", (q) =>
        q.eq("stripePaymentIntentId", paymentIntent.id)
      )
      .first();

    if (booking) {
      await ctx.db.patch(booking._id, {
        paymentStatus: "failed",
        updatedAt: Date.now(),
      });

      await ctx.db.insert("paymentConfirmations", {
        bookingId: booking._id,
        stripePaymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: "failed",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
