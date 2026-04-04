import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Stores OAuth credentials for connected external calendars
  calendarConnections: defineTable({
    userId: v.string(),
    provider: v.union(v.literal("google"), v.literal("outlook")),
    accountEmail: v.string(),
    accessToken: v.string(),
    refreshToken: v.string(),
    expiresAt: v.number(), // Unix timestamp in ms
  })
    .index("by_userId", ["userId"])
    .index("by_userId_provider", ["userId", "provider"]),

  // Temporary state entries used to link OAuth callbacks back to a user session
  calendarAuthStates: defineTable({
    userId: v.string(),
    provider: v.union(v.literal("google"), v.literal("outlook")),
    state: v.string(), // random opaque string sent as OAuth `state` param
    expiresAt: v.number(), // Unix timestamp in ms — entries older than this are stale
  })
    .index("by_state", ["state"])
    .index("by_userId", ["userId"]),

  // Cached busy blocks fetched from connected calendars
  busyBlocks: defineTable({
    userId: v.string(),
    provider: v.union(v.literal("google"), v.literal("outlook")),
    startTime: v.number(), // Unix timestamp in ms
    endTime: v.number(), // Unix timestamp in ms
    summary: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_time", ["userId", "startTime"]),
});
