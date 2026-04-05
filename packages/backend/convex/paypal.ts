import { v } from "convex/values";

import { internal } from "./_generated/api";
import {
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { authComponent } from "./auth";

const PAYPAL_SANDBOX_API = "https://api-m.sandbox.paypal.com";
const PAYPAL_LIVE_API = "https://api-m.paypal.com";

function paypalBaseUrl(environment: "sandbox" | "live"): string {
  return environment === "live" ? PAYPAL_LIVE_API : PAYPAL_SANDBOX_API;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** Get the PayPal integration for the authenticated user, or null if none. */
export const getPaypalIntegration = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      return null;
    }

    const integration = await ctx.db
      .query("paypalIntegrations")
      .withIndex("by_userId", (q) => q.eq("userId", user._id.toString()))
      .first();

    if (!integration) {
      return null;
    }

    // Never expose clientSecret to the client
    return {
      _id: integration._id,
      clientId: integration.clientId,
      environment: integration.environment,
      connectedAt: integration.connectedAt,
    };
  },
});

/** Internal: get the full PayPal integration record (includes secret). */
export const getPaypalIntegrationByUserId = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("paypalIntegrations")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
  },
});

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/** Save (create or update) a host's PayPal integration credentials. */
export const savePaypalIntegration = mutation({
  args: {
    clientId: v.string(),
    clientSecret: v.string(),
    environment: v.union(v.literal("sandbox"), v.literal("live")),
  },
  handler: async (ctx, { clientId, clientSecret, environment }) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const userId = user._id.toString();

    const existing = await ctx.db
      .query("paypalIntegrations")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        clientId,
        clientSecret,
        environment,
        connectedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("paypalIntegrations", {
        userId,
        clientId,
        clientSecret,
        environment,
        connectedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

/** Remove a host's PayPal integration. */
export const disconnectPaypal = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const integration = await ctx.db
      .query("paypalIntegrations")
      .withIndex("by_userId", (q) => q.eq("userId", user._id.toString()))
      .first();

    if (integration) {
      await ctx.db.delete(integration._id);
    }

    return { success: true };
  },
});

/** Internal: store PayPal order ID on a booking. */
export const attachPaypalOrder = internalMutation({
  args: {
    bookingId: v.id("bookings"),
    paypalOrderId: v.string(),
  },
  handler: async (ctx, { bookingId, paypalOrderId }) => {
    await ctx.db.patch(bookingId, {
      paymentOrderId: paypalOrderId,
      paymentMethod: "paypal",
    });
  },
});

// ---------------------------------------------------------------------------
// Actions — hit the PayPal REST API
// ---------------------------------------------------------------------------

/**
 * Exchange client credentials for a PayPal access token.
 * Returns the token string.
 */
export const getPaypalAccessToken = internalAction({
  args: { userId: v.string() },
  handler: async (ctx, { userId }): Promise<string> => {
    const integration = await ctx.runQuery(
      internal.paypal.getPaypalIntegrationByUserId,
      { userId }
    );

    if (!integration) {
      throw new Error("PayPal integration not configured for this host");
    }

    const base = paypalBaseUrl(integration.environment);
    const credentials = btoa(`${integration.clientId}:${integration.clientSecret}`);

    const response = await fetch(`${base}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`PayPal token request failed: ${text}`);
    }

    const data = (await response.json()) as { access_token: string };
    return data.access_token;
  },
});

/**
 * Create a PayPal order for a booking.
 * Returns the order ID and approval URL.
 */
export const createPaypalOrder = internalAction({
  args: {
    bookingId: v.id("bookings"),
    userId: v.string(),
    amount: v.number(), // in cents
    currency: v.string(),
    returnUrl: v.string(),
    cancelUrl: v.string(),
  },
  handler: async (
    ctx,
    { bookingId, userId, amount, currency, returnUrl, cancelUrl }
  ): Promise<{ orderId: string; approveUrl: string }> => {
    const integration = await ctx.runQuery(
      internal.paypal.getPaypalIntegrationByUserId,
      { userId }
    );

    if (!integration) {
      throw new Error("PayPal integration not configured");
    }

    const accessToken = await ctx.runAction(
      internal.paypal.getPaypalAccessToken,
      { userId }
    );

    const base = paypalBaseUrl(integration.environment);
    const amountValue = (amount / 100).toFixed(2);

    const response = await fetch(`${base}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": bookingId,
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: bookingId,
            amount: {
              currency_code: currency,
              value: amountValue,
            },
          },
        ],
        payment_source: {
          paypal: {
            experience_context: {
              return_url: returnUrl,
              cancel_url: cancelUrl,
              user_action: "PAY_NOW",
            },
          },
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`PayPal order creation failed: ${text}`);
    }

    const order = (await response.json()) as {
      id: string;
      links: Array<{ rel: string; href: string }>;
    };

    const approveLink = order.links.find((l) => l.rel === "payer-action");
    if (!approveLink) {
      throw new Error("PayPal did not return an approval URL");
    }

    // Attach order ID to the booking
    await ctx.runMutation(internal.paypal.attachPaypalOrder, {
      bookingId,
      paypalOrderId: order.id,
    });

    return { orderId: order.id, approveUrl: approveLink.href };
  },
});

/**
 * Capture an approved PayPal order and confirm the booking.
 * Returns the capture status.
 */
export const capturePaypalOrder = internalAction({
  args: {
    orderId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, { orderId, userId }): Promise<{ status: string }> => {
    const integration = await ctx.runQuery(
      internal.paypal.getPaypalIntegrationByUserId,
      { userId }
    );

    if (!integration) {
      throw new Error("PayPal integration not configured");
    }

    const accessToken = await ctx.runAction(
      internal.paypal.getPaypalAccessToken,
      { userId }
    );

    const base = paypalBaseUrl(integration.environment);

    const response = await fetch(
      `${base}/v2/checkout/orders/${orderId}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`PayPal capture failed: ${text}`);
    }

    const capture = (await response.json()) as {
      status: string;
      purchase_units: Array<{
        reference_id: string;
        payments: { captures: Array<{ status: string }> };
      }>;
    };

    const captureStatus = capture.status;
    const bookingId = capture.purchase_units[0]?.reference_id;

    if (captureStatus === "COMPLETED" && bookingId) {
      await ctx.runMutation(internal.bookings.confirmBookingPayment, {
        bookingId: bookingId as Parameters<typeof internal.bookings.confirmBookingPayment>[0]["bookingId"],
        paymentOrderId: orderId,
      });
    }

    return { status: captureStatus };
  },
});

/**
 * Verify a PayPal webhook event signature and process the event.
 * Called from the HTTP webhook endpoint.
 */
export const processPaypalWebhook = internalAction({
  args: {
    eventType: v.string(),
    resourceId: v.string(),
    orderId: v.optional(v.string()),
  },
  handler: async (ctx, { eventType, orderId }) => {
    if (eventType === "PAYMENT.CAPTURE.COMPLETED" && orderId) {
      const booking = await ctx.runQuery(
        internal.bookings.getBookingByPaymentOrderId,
        { paymentOrderId: orderId }
      );

      if (booking && booking.status === "pending_payment") {
        await ctx.runMutation(internal.bookings.confirmBookingPayment, {
          bookingId: booking._id,
          paymentOrderId: orderId,
        });
      }
    }

    if (eventType === "PAYMENT.CAPTURE.DENIED" && orderId) {
      const booking = await ctx.runQuery(
        internal.bookings.getBookingByPaymentOrderId,
        { paymentOrderId: orderId }
      );

      if (booking && booking.status === "pending_payment") {
        await ctx.runMutation(internal.bookings.failBookingPayment, {
          bookingId: booking._id,
        });
      }
    }
  },
});
