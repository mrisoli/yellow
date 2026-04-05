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
    organizerUserId: v.string(),
    attendeeEmail: v.string(),
    attendeeName: v.optional(v.string()),
    date: v.string(),
    time: v.string(),
    durationMinutes: v.number(),
    status: v.union(
      v.literal("confirmed"),
      v.literal("cancelled"),
      v.literal("completed"),
      v.literal("pending_payment")
    ),
    meetingStartsAt: v.number(),
    // Payment fields
    paymentRequired: v.optional(v.boolean()),
    paymentAmount: v.optional(v.number()), // in cents (e.g. 5000 = $50.00)
    paymentCurrency: v.optional(v.string()), // ISO 4217 code, e.g. "USD"
    paymentMethod: v.optional(
      v.union(v.literal("paypal"), v.literal("stripe"))
    ),
    paymentStatus: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("completed"),
        v.literal("failed")
      )
    ),
    paymentOrderId: v.optional(v.string()), // PayPal order ID or Stripe payment intent ID
  })
    .index("by_organizer", ["organizerUserId"])
    .index("by_meetingStartsAt", ["meetingStartsAt"])
    .index("by_paymentOrderId", ["paymentOrderId"]),

  paypalIntegrations: defineTable({
    userId: v.string(),
    clientId: v.string(),
    clientSecret: v.string(),
    environment: v.union(v.literal("sandbox"), v.literal("live")),
    connectedAt: v.number(),
  }).index("by_userId", ["userId"]),
});
