import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";

export const getBookingsByEventType = query({
  args: { eventTypeId: v.id("eventTypes") },
  handler: async (ctx, { eventTypeId }) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      return [];
    }

    const eventType = await ctx.db.get(eventTypeId);
    if (!eventType || eventType.userId !== user._id.toString()) {
      return [];
    }

    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_eventTypeId", (q) => q.eq("eventTypeId", eventTypeId))
      .collect();

    return bookings;
  },
});

export const createBooking = mutation({
  args: {
    eventTypeId: v.id("eventTypes"),
    inviteeEmail: v.string(),
    inviteePhone: v.optional(v.string()),
    bookedTime: v.string(),
  },
  handler: async (ctx, { eventTypeId, inviteeEmail, inviteePhone, bookedTime }) => {
    const eventType = await ctx.db.get(eventTypeId);
    if (!eventType) {
      throw new Error("Event type not found");
    }

    const bookingId = await ctx.db.insert("bookings", {
      eventTypeId,
      inviteeEmail,
      inviteePhone,
      bookedTime,
      createdAt: Date.now(),
    });

    // Schedule SMS reminders if enabled
    if (eventType.smsReminderEnabled && inviteePhone) {
      const bookedDate = new Date(bookedTime);
      for (const minutesBeforeBooking of eventType.smsReminderTimings) {
        const reminderDate = new Date(
          bookedDate.getTime() - minutesBeforeBooking * 60 * 1000
        );

        await ctx.db.insert("smsReminders", {
          bookingId,
          eventTypeId,
          reminderTime: reminderDate.toISOString(),
          status: "pending",
          message: `Reminder: You have an appointment at ${bookedDate.toLocaleTimeString()}. Reply to confirm or visit the link to reschedule.`,
        });
      }
    }

    return bookingId;
  },
});

export const getBookingById = query({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, { bookingId }) => {
    return await ctx.db.get(bookingId);
  },
});
