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
});
