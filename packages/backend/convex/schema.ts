import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  availabilitySchedules: defineTable({
    userId: v.string(),
    schedule: v.array(
      v.object({
        dayOfWeek: v.number(),
        enabled: v.boolean(),
        timeRanges: v.array(
          v.object({
            startTime: v.string(),
            endTime: v.string(),
          })
        ),
      })
    ),
  }).index("by_userId", ["userId"]),

  bookings: defineTable({
    organizerUserId: v.string(),
    attendeeName: v.string(),
    attendeeEmail: v.string(),
    attendeePhone: v.optional(v.string()),
    date: v.string(),
    time: v.string(),
    durationMinutes: v.number(),
    status: v.union(
      v.literal("confirmed"),
      v.literal("cancelled"),
      v.literal("completed")
    ),
    confirmationSent: v.boolean(),
    reminderSent: v.boolean(),
    followUpSent: v.boolean(),
    meetingStartsAt: v.number(),
  })
    .index("by_organizer", ["organizerUserId"])
    .index("by_meetingStartsAt", ["meetingStartsAt"]),

  notificationSettings: defineTable({
    userId: v.string(),
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
  }).index("by_userId", ["userId"]),
});
