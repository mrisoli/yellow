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
  bookings: defineTable({
    userId: v.string(), // Host who owns the booking
    email: v.string(), // Attendee email
    date: v.string(), // ISO date string (YYYY-MM-DD)
    time: v.string(), // Time slot (HH:mm)
    status: v.union(
      v.literal("confirmed"),
      v.literal("cancelled"),
      v.literal("no-show"),
      v.literal("rescheduled")
    ), // Booking status
    source: v.optional(v.string()), // Which link/source was used for booking
    isNewAttendee: v.boolean(), // Whether this is a new or returning attendee
    createdAt: v.number(), // Timestamp when booking was created
    cancelledAt: v.optional(v.number()), // Timestamp when cancelled (if applicable)
  })
    .index("by_userId", ["userId"])
    .index("by_userId_date", ["userId", "date"])
    .index("by_userId_email", ["userId", "email"]),
});
