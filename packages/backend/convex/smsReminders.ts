import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";

export const getPendingSmsReminders = query({
  args: { beforeTime: v.string() },
  handler: async (ctx, { beforeTime }) => {
    const reminders = await ctx.db
      .query("smsReminders")
      .withIndex("by_status_reminderTime", (q) =>
        q.eq("status", "pending").lte("reminderTime", beforeTime)
      )
      .collect();

    return reminders;
  },
});

export const getSmsRemindersByBooking = query({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, { bookingId }) => {
    const reminders = await ctx.db
      .query("smsReminders")
      .withIndex("by_bookingId", (q) => q.eq("bookingId", bookingId))
      .collect();

    return reminders;
  },
});

export const updateSmsReminderStatus = mutation({
  args: {
    smsReminderId: v.id("smsReminders"),
    status: v.union(v.literal("sent"), v.literal("failed")),
    error: v.optional(v.string()),
  },
  handler: async (ctx, { smsReminderId, status, error }) => {
    const reminder = await ctx.db.get(smsReminderId);
    if (!reminder) {
      throw new Error("Reminder not found");
    }

    const patch: Record<string, unknown> = {
      status,
      sentAt: Date.now(),
    };

    if (error) {
      patch.error = error;
    }

    await ctx.db.patch(smsReminderId, patch);
  },
});

export const logSmsReminderFailure = mutation({
  args: {
    smsReminderId: v.id("smsReminders"),
    error: v.string(),
  },
  handler: async (ctx, { smsReminderId, error }) => {
    await updateSmsReminderStatus(ctx as any, {
      smsReminderId,
      status: "failed",
      error,
    });
  },
});

/**
 * Send pending SMS reminders.
 * This should be called periodically (e.g., every minute via scheduled action).
 */
export const sendPendingSmsReminders = mutation({
  args: {},
  handler: async (ctx) => {
    const now = new Date().toISOString();
    const reminders = await ctx.db
      .query("smsReminders")
      .withIndex("by_status_reminderTime", (q) =>
        q.eq("status", "pending").lte("reminderTime", now)
      )
      .take(10); // Process up to 10 at a time

    const sentReminders = [];

    for (const reminder of reminders) {
      try {
        const booking = await ctx.db.get(reminder.bookingId);
        if (!booking || !booking.inviteePhone) {
          await ctx.db.patch(reminder._id, {
            status: "failed",
            error: "Booking or phone number not found",
            sentAt: Date.now(),
          });
          continue;
        }

        // Check if Twilio credentials are available
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const fromNumber = process.env.TWILIO_PHONE_NUMBER;

        if (!accountSid || !authToken || !fromNumber) {
          await ctx.db.patch(reminder._id, {
            status: "failed",
            error: "SMS provider not configured",
            sentAt: Date.now(),
          });
          continue;
        }

        // Send SMS via Twilio
        const auth = Buffer.from(`${accountSid}:${authToken}`).toString(
          "base64"
        );
        const response = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
          {
            method: "POST",
            headers: {
              Authorization: `Basic ${auth}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              To: booking.inviteePhone,
              From: fromNumber,
              Body: reminder.message,
            }).toString(),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Twilio API error: ${errorText}`);
        }

        await ctx.db.patch(reminder._id, {
          status: "sent",
          sentAt: Date.now(),
        });

        sentReminders.push(reminder._id);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        await ctx.db.patch(reminder._id, {
          status: "failed",
          error: errorMessage,
          sentAt: Date.now(),
        });
      }
    }

    return {
      processed: reminders.length,
      sent: sentReminders.length,
      failed: reminders.length - sentReminders.length,
    };
  },
});
