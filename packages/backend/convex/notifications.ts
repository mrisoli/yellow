import { v } from "convex/values";

import { internal } from "./_generated/api";
import {
  internalAction,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { authComponent } from "./auth";

const DEFAULT_SETTINGS = {
  emailConfirmationEnabled: true,
  reminderEnabled: true,
  reminderHoursBefore: 24,
  smsReminderEnabled: false,
  followUpEnabled: false,
  followUpHoursAfter: 1,
} as const;

/** Get notification settings for the authenticated organizer. */
export const getNotificationSettings = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      return null;
    }

    const settings = await ctx.db
      .query("notificationSettings")
      .withIndex("by_userId", (q) => q.eq("userId", user._id.toString()))
      .first();

    return settings ?? { ...DEFAULT_SETTINGS };
  },
});

/** Save notification settings for the authenticated organizer. */
export const setNotificationSettings = mutation({
  args: {
    emailConfirmationEnabled: v.boolean(),
    reminderEnabled: v.boolean(),
    reminderHoursBefore: v.number(),
    smsReminderEnabled: v.boolean(),
    followUpEnabled: v.boolean(),
    followUpHoursAfter: v.number(),
    confirmationSubject: v.optional(v.string()),
    confirmationBody: v.optional(v.string()),
    reminderSubject: v.optional(v.string()),
    reminderBody: v.optional(v.string()),
    followUpSubject: v.optional(v.string()),
    followUpBody: v.optional(v.string()),
    smsReminderTemplate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const userId = user._id.toString();
    const existing = await ctx.db
      .query("notificationSettings")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, args);
    } else {
      await ctx.db.insert("notificationSettings", { userId, ...args });
    }
  },
});

/** Internal: fetch booking + organizer notification settings in one query. */
export const getBookingWithSettings = internalQuery({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, { bookingId }) => {
    const booking = await ctx.db.get(bookingId);
    if (!booking) {
      return null;
    }

    const settings = await ctx.db
      .query("notificationSettings")
      .withIndex("by_userId", (q) => q.eq("userId", booking.organizerUserId))
      .first();

    return {
      ...booking,
      settings: settings ?? { ...DEFAULT_SETTINGS },
    };
  },
});

/** Internal: send a confirmation email when a booking is created. */
export const processConfirmation = internalAction({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, { bookingId }) => {
    const data = await ctx.runQuery(
      internal.notifications.getBookingWithSettings,
      { bookingId }
    );
    if (!data) {
      return;
    }
    if (!data.settings.emailConfirmationEnabled) {
      return;
    }

    const subject =
      data.settings.confirmationSubject ??
      `Booking Confirmed: ${data.date} at ${data.time}`;
    const body =
      data.settings.confirmationBody ??
      buildConfirmationBody(data.attendeeName, data.date, data.time);

    await ctx.runAction(internal.notifications.sendEmail, {
      to: data.attendeeEmail,
      subject,
      body,
    });

    await ctx.runMutation(internal.bookings.markConfirmationSent, {
      bookingId,
    });
  },
});

/** Internal: send a reminder email/SMS for an upcoming booking. */
export const processReminder = internalAction({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, { bookingId }) => {
    const data = await ctx.runQuery(
      internal.notifications.getBookingWithSettings,
      { bookingId }
    );
    if (!data) {
      return;
    }

    if (data.settings.reminderEnabled) {
      const subject =
        data.settings.reminderSubject ??
        `Reminder: Your booking is tomorrow at ${data.time}`;
      const body =
        data.settings.reminderBody ??
        buildReminderBody(
          data.attendeeName,
          data.date,
          data.time,
          data.settings.reminderHoursBefore
        );

      await ctx.runAction(internal.notifications.sendEmail, {
        to: data.attendeeEmail,
        subject,
        body,
      });
    }

    if (data.settings.smsReminderEnabled && data.attendeePhone) {
      const message =
        data.settings.smsReminderTemplate ??
        `Reminder: You have a booking on ${data.date} at ${data.time}. Reply STOP to opt out.`;

      await ctx.runAction(internal.notifications.sendSms, {
        to: data.attendeePhone,
        message,
      });
    }

    await ctx.runMutation(internal.bookings.markReminderSent, { bookingId });
  },
});

/** Internal: send a follow-up email after a meeting completes. */
export const processFollowUp = internalAction({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, { bookingId }) => {
    const data = await ctx.runQuery(
      internal.notifications.getBookingWithSettings,
      { bookingId }
    );
    if (!data) {
      return;
    }
    if (!data.settings.followUpEnabled) {
      return;
    }

    const delayMs = data.settings.followUpHoursAfter * 60 * 60 * 1000;

    await ctx.scheduler.runAfter(
      delayMs,
      internal.notifications.sendFollowUpEmail,
      { bookingId }
    );
  },
});

/** Internal: send the follow-up email (called after delay). */
export const sendFollowUpEmail = internalAction({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, { bookingId }) => {
    const data = await ctx.runQuery(
      internal.notifications.getBookingWithSettings,
      { bookingId }
    );
    if (!data) {
      return;
    }
    if (data.followUpSent) {
      return;
    }

    const subject = data.settings.followUpSubject ?? "Thank you for your time!";
    const body =
      data.settings.followUpBody ??
      buildFollowUpBody(data.attendeeName, data.date);

    await ctx.runAction(internal.notifications.sendEmail, {
      to: data.attendeeEmail,
      subject,
      body,
    });

    await ctx.runMutation(internal.bookings.markFollowUpSent, { bookingId });
  },
});

/** Internal: send an email via Resend. */
export const sendEmail = internalAction({
  args: {
    to: v.string(),
    subject: v.string(),
    body: v.string(),
  },
  handler: async (_ctx, { to, subject, body }) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      // eslint-disable-next-line no-console
      console.warn("RESEND_API_KEY not set — skipping email send");
      return;
    }

    const fromAddress = process.env.EMAIL_FROM ?? "notifications@example.com";

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to,
        subject,
        text: body,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Resend API error ${response.status}: ${text}`);
    }
  },
});

/** Internal: send an SMS via Twilio. */
export const sendSms = internalAction({
  args: {
    to: v.string(),
    message: v.string(),
  },
  handler: async (_ctx, { to, message }) => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_FROM_NUMBER;

    if (!(accountSid && authToken && fromNumber)) {
      // eslint-disable-next-line no-console
      console.warn("Twilio credentials not set — skipping SMS send");
      return;
    }

    const credentials = btoa(`${accountSid}:${authToken}`);
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

    const body = new URLSearchParams({
      From: fromNumber,
      To: to,
      Body: message,
    });

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Twilio API error ${response.status}: ${text}`);
    }
  },
});

function buildConfirmationBody(
  name: string,
  date: string,
  time: string
): string {
  return `Hi ${name},

Your booking has been confirmed.

Date: ${date}
Time: ${time}

We look forward to seeing you! If you need to reschedule, please contact us.

Best regards`;
}

function buildReminderBody(
  name: string,
  date: string,
  time: string,
  hoursBefore: number
): string {
  return `Hi ${name},

This is a friendly reminder that you have a booking in ${hoursBefore} hours.

Date: ${date}
Time: ${time}

See you soon!`;
}

function buildFollowUpBody(name: string, date: string): string {
  return `Hi ${name},

Thank you for joining us on ${date}. We hope the meeting was productive!

We would love to hear your feedback.

Best regards`;
}
