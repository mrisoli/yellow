import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  stripeAccounts: defineTable({
    userId: v.id("users"),
    stripeAccountId: v.string(),
    stripePublishableKey: v.string(),
    isConnected: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_stripeAccountId", ["stripeAccountId"]),

  eventTypes: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    durationMinutes: v.number(),
    isPaymentRequired: v.boolean(),
    paymentAmount: v.optional(v.number()),
    paymentCurrency: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_name", ["userId", "name"]),

  bookings: defineTable({
    userId: v.id("users"),
    eventTypeId: v.id("eventTypes"),
    guestEmail: v.string(),
    guestName: v.string(),
    scheduledStartTime: v.number(),
    scheduledEndTime: v.number(),
    paymentStatus: v.optional(
      v.union(v.literal("pending"), v.literal("completed"), v.literal("failed"))
    ),
    stripePaymentIntentId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_eventTypeId", ["eventTypeId"])
    .index("by_stripePaymentIntentId", ["stripePaymentIntentId"])
    .index("by_guestEmail", ["guestEmail"]),

  paymentConfirmations: defineTable({
    bookingId: v.id("bookings"),
    stripePaymentIntentId: v.string(),
    amount: v.number(),
    currency: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("succeeded"),
      v.literal("failed")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_bookingId", ["bookingId"])
    .index("by_stripePaymentIntentId", ["stripePaymentIntentId"]),
});
