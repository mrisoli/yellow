import { httpRouter } from "convex/server";

import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";
import { authComponent, createAuth } from "./auth";

const http = httpRouter();

authComponent.registerRoutes(http, createAuth, { cors: true });

/** POST /bookings — receive a booking from the booking widget. */
http.route({
  path: "/bookings",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (
      typeof body !== "object" ||
      body === null ||
      typeof (body as Record<string, unknown>).organizerUserId !== "string" ||
      typeof (body as Record<string, unknown>).attendeeName !== "string" ||
      typeof (body as Record<string, unknown>).attendeeEmail !== "string" ||
      typeof (body as Record<string, unknown>).date !== "string" ||
      typeof (body as Record<string, unknown>).time !== "string"
    ) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const data = body as {
      organizerUserId: string;
      attendeeName: string;
      attendeeEmail: string;
      attendeePhone?: string;
      date: string;
      time: string;
      durationMinutes?: number;
    };

    const bookingId = await ctx.runMutation(
      internal.bookings.createBookingInternal,
      {
        organizerUserId: data.organizerUserId,
        attendeeName: data.attendeeName,
        attendeeEmail: data.attendeeEmail,
        attendeePhone: data.attendeePhone,
        date: data.date,
        time: data.time,
        durationMinutes: data.durationMinutes,
      }
    );

    return new Response(JSON.stringify({ bookingId }), {
      status: 201,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }),
});

/** OPTIONS /bookings — preflight CORS. */
http.route({
  path: "/bookings",
  method: "OPTIONS",
  handler: httpAction((_ctx, _request) => {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }),
});

export default http;
