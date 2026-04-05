import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";

export const getEventTypes = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      return [];
    }

    const eventTypes = await ctx.db
      .query("eventTypes")
      .withIndex("by_userId", (q) => q.eq("userId", user._id.toString()))
      .collect();

    return eventTypes;
  },
});

export const getEventTypeById = query({
  args: { eventTypeId: v.id("eventTypes") },
  handler: async (ctx, { eventTypeId }) => {
    return await ctx.db.get(eventTypeId);
  },
});

export const createEventType = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    duration: v.number(),
    smsReminderEnabled: v.boolean(),
    smsReminderTimings: v.array(v.number()),
  },
  handler: async (
    ctx,
    { name, description, duration, smsReminderEnabled, smsReminderTimings }
  ) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const eventTypeId = await ctx.db.insert("eventTypes", {
      userId: user._id.toString(),
      name,
      description,
      duration,
      smsReminderEnabled,
      smsReminderTimings,
    });

    return eventTypeId;
  },
});

export const updateEventType = mutation({
  args: {
    eventTypeId: v.id("eventTypes"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    duration: v.optional(v.number()),
    smsReminderEnabled: v.optional(v.boolean()),
    smsReminderTimings: v.optional(v.array(v.number())),
  },
  handler: async (
    ctx,
    {
      eventTypeId,
      name,
      description,
      duration,
      smsReminderEnabled,
      smsReminderTimings,
    }
  ) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const eventType = await ctx.db.get(eventTypeId);
    if (!eventType || eventType.userId !== user._id.toString()) {
      throw new Error("Unauthorized");
    }

    const patch: Record<string, unknown> = {};
    if (name !== undefined) patch.name = name;
    if (description !== undefined) patch.description = description;
    if (duration !== undefined) patch.duration = duration;
    if (smsReminderEnabled !== undefined) patch.smsReminderEnabled = smsReminderEnabled;
    if (smsReminderTimings !== undefined) patch.smsReminderTimings = smsReminderTimings;

    await ctx.db.patch(eventTypeId, patch);
    return eventTypeId;
  },
});

export const deleteEventType = mutation({
  args: { eventTypeId: v.id("eventTypes") },
  handler: async (ctx, { eventTypeId }) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const eventType = await ctx.db.get(eventTypeId);
    if (!eventType || eventType.userId !== user._id.toString()) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(eventTypeId);
  },
});
