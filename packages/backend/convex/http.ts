import { httpRouter } from "convex/server";

import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";
import { authComponent, createAuth } from "./auth";

const http = httpRouter();

authComponent.registerRoutes(http, createAuth, { cors: true });

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function corsResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

// ---------------------------------------------------------------------------
// POST /bookings — receive a booking from the booking widget
// ---------------------------------------------------------------------------

http.route({
  path: "/bookings",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return corsResponse({ error: "Invalid JSON" }, 400);
    }

    const b = body as Record<string, unknown>;
    if (
      typeof b.organizerUserId !== "string" ||
      typeof b.attendeeEmail !== "string" ||
      typeof b.date !== "string" ||
      typeof b.time !== "string"
    ) {
      return corsResponse({ error: "Missing required fields: organizerUserId, attendeeEmail, date, time" }, 400);
    }

    const bookingId = await ctx.runMutation(
      internal.bookings.createBookingInternal,
      {
        organizerUserId: b.organizerUserId,
        attendeeEmail: b.attendeeEmail,
        attendeeName: typeof b.attendeeName === "string" ? b.attendeeName : undefined,
        date: b.date,
        time: b.time,
        durationMinutes: typeof b.durationMinutes === "number" ? b.durationMinutes : undefined,
      }
    );

    return corsResponse({ bookingId }, 201);
  }),
});

http.route({
  path: "/bookings",
  method: "OPTIONS",
  handler: httpAction((_ctx, _request) => {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }),
});

// ---------------------------------------------------------------------------
// POST /paypal/orders — create a PayPal order and pending booking
// ---------------------------------------------------------------------------

http.route({
  path: "/paypal/orders",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return corsResponse({ error: "Invalid JSON" }, 400);
    }

    const b = body as Record<string, unknown>;
    if (
      typeof b.organizerUserId !== "string" ||
      typeof b.attendeeEmail !== "string" ||
      typeof b.date !== "string" ||
      typeof b.time !== "string" ||
      typeof b.paymentAmount !== "number" ||
      typeof b.returnUrl !== "string" ||
      typeof b.cancelUrl !== "string"
    ) {
      return corsResponse(
        {
          error:
            "Missing required fields: organizerUserId, attendeeEmail, date, time, paymentAmount, returnUrl, cancelUrl",
        },
        400
      );
    }

    const paymentCurrency = typeof b.paymentCurrency === "string" ? b.paymentCurrency : "USD";

    // Create a pending-payment booking
    const bookingId = await ctx.runMutation(
      internal.bookings.createBookingInternal,
      {
        organizerUserId: b.organizerUserId,
        attendeeEmail: b.attendeeEmail,
        attendeeName: typeof b.attendeeName === "string" ? b.attendeeName : undefined,
        date: b.date,
        time: b.time,
        durationMinutes: typeof b.durationMinutes === "number" ? b.durationMinutes : undefined,
        paymentRequired: true,
        paymentAmount: b.paymentAmount,
        paymentCurrency,
        paymentMethod: "paypal",
      }
    );

    // Create a PayPal order for the booking
    try {
      const result = await ctx.runAction(internal.paypal.createPaypalOrder, {
        bookingId,
        userId: b.organizerUserId,
        amount: b.paymentAmount,
        currency: paymentCurrency,
        returnUrl: b.returnUrl,
        cancelUrl: b.cancelUrl,
      });

      return corsResponse(
        { bookingId, orderId: result.orderId, approveUrl: result.approveUrl },
        201
      );
    } catch (error) {
      // Clean up the pending booking if PayPal order creation fails
      await ctx.runMutation(internal.bookings.failBookingPayment, {
        bookingId,
      });

      const message = error instanceof Error ? error.message : "PayPal order creation failed";
      return corsResponse({ error: message }, 500);
    }
  }),
});

http.route({
  path: "/paypal/orders",
  method: "OPTIONS",
  handler: httpAction((_ctx, _request) => {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }),
});

// ---------------------------------------------------------------------------
// POST /paypal/capture — capture an approved PayPal order
// ---------------------------------------------------------------------------

http.route({
  path: "/paypal/capture",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return corsResponse({ error: "Invalid JSON" }, 400);
    }

    const b = body as Record<string, unknown>;
    if (typeof b.orderId !== "string" || typeof b.organizerUserId !== "string") {
      return corsResponse({ error: "Missing required fields: orderId, organizerUserId" }, 400);
    }

    try {
      const result = await ctx.runAction(internal.paypal.capturePaypalOrder, {
        orderId: b.orderId,
        userId: b.organizerUserId,
      });

      return corsResponse({ status: result.status }, 200);
    } catch (error) {
      const message = error instanceof Error ? error.message : "PayPal capture failed";
      return corsResponse({ error: message }, 500);
    }
  }),
});

http.route({
  path: "/paypal/capture",
  method: "OPTIONS",
  handler: httpAction((_ctx, _request) => {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }),
});

// ---------------------------------------------------------------------------
// POST /paypal/webhook — receive PayPal webhook events
// ---------------------------------------------------------------------------

http.route({
  path: "/paypal/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const event = body as Record<string, unknown>;
    const eventType = typeof event.event_type === "string" ? event.event_type : "";
    const resource = (event.resource ?? {}) as Record<string, unknown>;
    const resourceId = typeof resource.id === "string" ? resource.id : "";

    // For payment capture events, the order ID may be in supplementary data
    const supplementaryData = (resource.supplementary_data ?? {}) as Record<string, unknown>;
    const relatedIds = (supplementaryData.related_ids ?? {}) as Record<string, unknown>;
    const orderId = typeof relatedIds.order_id === "string" ? relatedIds.order_id : resourceId;

    // Process asynchronously — return 200 immediately so PayPal doesn't retry
    await ctx.runAction(internal.paypal.processPaypalWebhook, {
      eventType,
      resourceId,
      orderId,
    });

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;
