import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";

const DAY_SCHEDULE = v.object({
  dayOfWeek: v.number(),
  enabled: v.boolean(),
  timeRanges: v.array(
    v.object({
      startTime: v.string(),
      endTime: v.string(),
    })
  ),
});

export const DEFAULT_SCHEDULE = [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
  dayOfWeek,
  enabled: dayOfWeek >= 1 && dayOfWeek <= 5, // Monday–Friday enabled by default
  timeRanges: [{ startTime: "09:00", endTime: "17:00" }],
}));

/** Get the authenticated user's availability schedule. */
export const getAvailabilitySchedule = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      return null;
    }

    const record = await ctx.db
      .query("availabilitySchedules")
      .withIndex("by_userId", (q) => q.eq("userId", user._id.toString()))
      .first();

    return record?.schedule ?? DEFAULT_SCHEDULE;
  },
});

/** Create or replace the authenticated user's availability schedule. */
export const setAvailabilitySchedule = mutation({
  args: {
    schedule: v.array(DAY_SCHEDULE),
  },
  handler: async (ctx, { schedule }) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const existing = await ctx.db
      .query("availabilitySchedules")
      .withIndex("by_userId", (q) => q.eq("userId", user._id.toString()))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { schedule });
    } else {
      await ctx.db.insert("availabilitySchedules", {
        userId: user._id.toString(),
        schedule,
      });
    }
  },
});

/**
 * Public query used by the booking widget to fetch a host's availability.
 * Accepts a userId so it can be called without authentication.
 */
export const getPublicAvailabilitySchedule = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const record = await ctx.db
      .query("availabilitySchedules")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    return record?.schedule ?? DEFAULT_SCHEDULE;
  },
});
