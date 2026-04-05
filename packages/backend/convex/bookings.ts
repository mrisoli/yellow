import { v } from "convex/values";

import { internal } from "./_generated/api";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { authComponent } from "./auth";

function parseMeetingStartsAt(date: string, time: string): number {
  const parts = date.split("-").map(Number);
  const timeParts = time.split(":").map(Number);
  return new Date(
    parts[0] ?? 0,
    (parts[1] ?? 1) - 1,
    parts[2] ?? 1,
    timeParts[0] ?? 0,
    timeParts[1] ?? 0
  ).getTime();
}

/**
 * Internal: create a booking record.
 * Used by the HTTP endpoints (no auth required — organizer ID comes from widget).
 */
export const createBookingInternal = internalMutation({
  args: {
    organizerUserId: v.string(),
    attendeeEmail: v.string(),
    attendeeName: v.optional(v.string()),
    date: v.string(),
    time: v.string(),
    durationMinutes: v.optional(v.number()),
    // Payment — omit entirely for free bookings
    paymentRequired: v.optional(v.boolean()),
    paymentAmount: v.optional(v.number()),
    paymentCurrency: v.optional(v.string()),
    paymentMethod: v.optional(
      v.union(v.literal("paypal"), v.literal("stripe"))
    ),
  },
  handler: async (ctx, args) => {
    const meetingStartsAt = parseMeetingStartsAt(args.date, args.time);
    const requiresPayment = args.paymentRequired === true && (args.paymentAmount ?? 0) > 0;

    return await ctx.db.insert("bookings", {
      organizerUserId: args.organizerUserId,
      attendeeEmail: args.attendeeEmail,
      attendeeName: args.attendeeName,
      date: args.date,
      time: args.time,
      durationMinutes: args.durationMinutes ?? 30,
      status: requiresPayment ? "pending_payment" : "confirmed",
      meetingStartsAt,
      paymentRequired: requiresPayment ? true : undefined,
      paymentAmount: requiresPayment ? args.paymentAmount : undefined,
      paymentCurrency: requiresPayment ? (args.paymentCurrency ?? "USD") : undefined,
      paymentMethod: requiresPayment ? args.paymentMethod : undefined,
      paymentStatus: requiresPayment ? "pending" : undefined,
    });
  },
});

/** Internal: attach a payment order ID to a booking. */
export const setPaymentOrderId = internalMutation({
  args: {
    bookingId: v.id("bookings"),
    paymentOrderId: v.string(),
  },
  handler: async (ctx, { bookingId, paymentOrderId }) => {
    await ctx.db.patch(bookingId, { paymentOrderId });
  },
});

/** Internal: confirm a booking after successful payment capture. */
export const confirmBookingPayment = internalMutation({
  args: {
    bookingId: v.id("bookings"),
    paymentOrderId: v.string(),
  },
  handler: async (ctx, { bookingId, paymentOrderId }) => {
    const booking = await ctx.db.get(bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    await ctx.db.patch(bookingId, {
      status: "confirmed",
      paymentStatus: "completed",
      paymentOrderId,
    });
  },
});

/** Internal: mark a booking payment as failed and release the time slot. */
export const failBookingPayment = internalMutation({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, { bookingId }) => {
    await ctx.db.patch(bookingId, {
      status: "cancelled",
      paymentStatus: "failed",
    });
  },
});

/** Internal: look up a booking by its PayPal/Stripe order ID. */
export const getBookingByPaymentOrderId = internalQuery({
  args: { paymentOrderId: v.string() },
  handler: async (ctx, { paymentOrderId }) => {
    return await ctx.db
      .query("bookings")
      .withIndex("by_paymentOrderId", (q) =>
        q.eq("paymentOrderId", paymentOrderId)
      )
      .first();
  },
});

/** Internal: get a booking by its Convex ID. */
export const getBookingById = internalQuery({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, { bookingId }) => {
    return await ctx.db.get(bookingId);
  },
});

/** List all bookings for the authenticated organizer. */
export const getBookingsByOrganizer = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      return [];
    }

    return await ctx.db
      .query("bookings")
      .withIndex("by_organizer", (q) =>
        q.eq("organizerUserId", user._id.toString())
      )
      .order("desc")
      .collect();
  },
});

/** Update a booking's status (authenticated organizer only). */
export const updateBookingStatus = mutation({
  args: {
    bookingId: v.id("bookings"),
    status: v.union(
      v.literal("confirmed"),
      v.literal("cancelled"),
      v.literal("completed")
    ),
  },
  handler: async (ctx, { bookingId, status }) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const booking = await ctx.db.get(bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }
    if (booking.organizerUserId !== user._id.toString()) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(bookingId, { status });
  },
});

/** Schedule cleanup of stale pending-payment bookings (called by cron). */
export const cancelStalePendingPaymentBookings = internalMutation({
  args: { olderThanMs: v.number() },
  handler: async (ctx, { olderThanMs }) => {
    const stale = await ctx.db
      .query("bookings")
      .filter((q) =>
        q.and(
          q.eq(q.field("status"), "pending_payment"),
          q.lt(q.field("meetingStartsAt"), olderThanMs)
        )
      )
      .collect();

    for (const booking of stale) {
      await ctx.db.patch(booking._id, {
        status: "cancelled",
        paymentStatus: "failed",
      });
    }

    return stale.length;
  },
});
