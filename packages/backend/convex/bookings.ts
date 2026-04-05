import { v } from "convex/values";

import { internal } from "./_generated/api";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { authComponent } from "./auth";

const bookingArgs = {
  organizerUserId: v.string(),
  attendeeName: v.string(),
  attendeeEmail: v.string(),
  attendeePhone: v.optional(v.string()),
  date: v.string(),
  time: v.string(),
  durationMinutes: v.optional(v.number()),
};

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
 * Internal mutation used by the HTTP booking endpoint (no auth required).
 * The organizer user ID is provided by the booking widget.
 */
export const createBookingInternal = internalMutation({
  args: bookingArgs,
  handler: async (ctx, args) => {
    const meetingStartsAt = parseMeetingStartsAt(args.date, args.time);

    const bookingId = await ctx.db.insert("bookings", {
      organizerUserId: args.organizerUserId,
      attendeeName: args.attendeeName,
      attendeeEmail: args.attendeeEmail,
      attendeePhone: args.attendeePhone,
      date: args.date,
      time: args.time,
      durationMinutes: args.durationMinutes ?? 30,
      status: "confirmed",
      confirmationSent: false,
      reminderSent: false,
      followUpSent: false,
      meetingStartsAt,
    });

    await ctx.scheduler.runAfter(
      0,
      internal.notifications.processConfirmation,
      { bookingId }
    );

    return bookingId;
  },
});

/** Create a new booking from the authenticated organizer's dashboard. */
export const createBooking = mutation({
  args: bookingArgs,
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const meetingStartsAt = parseMeetingStartsAt(args.date, args.time);

    const bookingId = await ctx.db.insert("bookings", {
      organizerUserId: args.organizerUserId,
      attendeeName: args.attendeeName,
      attendeeEmail: args.attendeeEmail,
      attendeePhone: args.attendeePhone,
      date: args.date,
      time: args.time,
      durationMinutes: args.durationMinutes ?? 30,
      status: "confirmed",
      confirmationSent: false,
      reminderSent: false,
      followUpSent: false,
      meetingStartsAt,
    });

    await ctx.scheduler.runAfter(
      0,
      internal.notifications.processConfirmation,
      { bookingId }
    );

    return bookingId;
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

/** Update a booking's status. Triggers follow-up notification when completed. */
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

    if (status === "completed") {
      await ctx.scheduler.runAfter(0, internal.notifications.processFollowUp, {
        bookingId,
      });
    }
  },
});

/** Internal: mark a booking's confirmation as sent. */
export const markConfirmationSent = internalMutation({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, { bookingId }) => {
    await ctx.db.patch(bookingId, { confirmationSent: true });
  },
});

/** Internal: mark a booking's reminder as sent. */
export const markReminderSent = internalMutation({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, { bookingId }) => {
    await ctx.db.patch(bookingId, { reminderSent: true });
  },
});

/** Internal: mark a booking's follow-up as sent. */
export const markFollowUpSent = internalMutation({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, { bookingId }) => {
    await ctx.db.patch(bookingId, { followUpSent: true });
  },
});

/**
 * Internal: get bookings needing a reminder within a given time window.
 * Used by the cron job.
 */
export const getBookingsNeedingReminder = internalQuery({
  args: {
    nowMs: v.number(),
    windowEndMs: v.number(),
  },
  handler: async (ctx, { nowMs, windowEndMs }) => {
    return await ctx.db
      .query("bookings")
      .withIndex("by_meetingStartsAt", (q) =>
        q.gt("meetingStartsAt", nowMs).lt("meetingStartsAt", windowEndMs)
      )
      .filter((q) =>
        q.and(
          q.eq(q.field("reminderSent"), false),
          q.eq(q.field("status"), "confirmed")
        )
      )
      .collect();
  },
});
