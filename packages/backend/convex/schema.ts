import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  availabilitySchedules: defineTable({
    userId: v.string(),
    schedule: v.array(
      v.object({
        dayOfWeek: v.number(), // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        enabled: v.boolean(),
        timeRanges: v.array(
          v.object({
            startTime: v.string(), // "HH:mm" 24-hour format
            endTime: v.string(), // "HH:mm" 24-hour format
          })
        ),
      })
    ),
  }).index("by_userId", ["userId"]),

  eventTypes: defineTable({
    userId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    duration: v.number(), // in minutes
    smsReminderEnabled: v.boolean(),
    smsReminderTimings: v.array(v.number()), // minutes before the booking
  })
    .index("by_userId", ["userId"])
    .index("by_userId_name", ["userId", "name"]),

  bookings: defineTable({
    eventTypeId: v.id("eventTypes"),
    inviteeEmail: v.string(),
    inviteePhone: v.optional(v.string()),
    bookedTime: v.string(), // ISO 8601 datetime
    createdAt: v.number(), // timestamp
  })
    .index("by_eventTypeId", ["eventTypeId"])
    .index("by_bookedTime", ["bookedTime"]),

  smsReminders: defineTable({
    bookingId: v.id("bookings"),
    eventTypeId: v.id("eventTypes"),
    reminderTime: v.string(), // ISO 8601 datetime
    status: v.union(v.literal("pending"), v.literal("sent"), v.literal("failed")),
    message: v.string(),
    error: v.optional(v.string()),
    sentAt: v.optional(v.number()), // timestamp
  })
    .index("by_bookingId", ["bookingId"])
    .index("by_status_reminderTime", ["status", "reminderTime"]),
});
