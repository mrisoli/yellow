import { cronJobs } from "convex/server";

import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";

/** Check for bookings that need reminder notifications and dispatch them. */
export const sendPendingReminders = internalAction({
  args: {},
  handler: async (ctx) => {
    const nowMs = Date.now();

    // Collect reminders for the next 25 hours (checked every 15 min,
    // with a 1-hour buffer to avoid missing bookings near the boundary).
    const lookAheadMs = 25 * 60 * 60 * 1000;
    const windowEndMs = nowMs + lookAheadMs;

    const bookings = await ctx.runQuery(
      internal.bookings.getBookingsNeedingReminder,
      { nowMs, windowEndMs }
    );

    for (const booking of bookings) {
      const settings = await ctx.runQuery(
        internal.notifications.getBookingWithSettings,
        { bookingId: booking._id }
      );
      if (!settings) {
        continue;
      }

      const reminderHours = settings.settings.reminderHoursBefore;
      const reminderWindowStart = nowMs;
      const reminderWindowEnd = nowMs + 15 * 60 * 1000; // next 15 min

      const targetSendTime =
        booking.meetingStartsAt - reminderHours * 60 * 60 * 1000;

      if (
        targetSendTime >= reminderWindowStart &&
        targetSendTime <= reminderWindowEnd
      ) {
        await ctx.runAction(internal.notifications.processReminder, {
          bookingId: booking._id,
        });
      }
    }
  },
});

const crons = cronJobs();

crons.interval(
  "send pending reminders",
  { minutes: 15 },
  internal.crons.sendPendingReminders
);

export default crons;
