import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";

export const getEventTypes = query({
  args: {},
  handler: async (ctx) => {
    const authUser = await authComponent.safeGetAuthUser(ctx);
    if (!authUser) {
      return [];
    }

    const eventTypes = await ctx.db
      .query("eventTypes")
      .withIndex("by_userId", (q) => q.eq("userId", authUser._id))
      .collect();

    return eventTypes;
  },
});

export const getEventType = query({
  args: {
    eventTypeId: v.id("eventTypes"),
  },
  handler: async (ctx, args) => {
    const eventType = await ctx.db.get(args.eventTypeId);
    return eventType;
  },
});

export const createEventType = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    durationMinutes: v.number(),
    isPaymentRequired: v.boolean(),
    paymentAmount: v.optional(v.number()),
    paymentCurrency: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const authUser = await authComponent.safeGetAuthUser(ctx);
    if (!authUser) {
      throw new Error("Not authenticated");
    }

    const now = Date.now();

    const eventTypeId = await ctx.db.insert("eventTypes", {
      userId: authUser._id,
      name: args.name,
      description: args.description,
      durationMinutes: args.durationMinutes,
      isPaymentRequired: args.isPaymentRequired,
      paymentAmount: args.paymentAmount,
      paymentCurrency: args.paymentCurrency ?? "usd",
      createdAt: now,
      updatedAt: now,
    });

    return eventTypeId;
  },
});

export const updateEventType = mutation({
  args: {
    eventTypeId: v.id("eventTypes"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    durationMinutes: v.optional(v.number()),
    isPaymentRequired: v.optional(v.boolean()),
    paymentAmount: v.optional(v.number()),
    paymentCurrency: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const authUser = await authComponent.safeGetAuthUser(ctx);
    if (!authUser) {
      throw new Error("Not authenticated");
    }

    const eventType = await ctx.db.get(args.eventTypeId);
    if (!eventType) {
      throw new Error("Event type not found");
    }

    if (eventType.userId !== authUser._id) {
      throw new Error("Unauthorized");
    }

    const updateData: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) {
      updateData.name = args.name;
    }
    if (args.description !== undefined) {
      updateData.description = args.description;
    }
    if (args.durationMinutes !== undefined) {
      updateData.durationMinutes = args.durationMinutes;
    }
    if (args.isPaymentRequired !== undefined) {
      updateData.isPaymentRequired = args.isPaymentRequired;
    }
    if (args.paymentAmount !== undefined) {
      updateData.paymentAmount = args.paymentAmount;
    }
    if (args.paymentCurrency !== undefined) {
      updateData.paymentCurrency = args.paymentCurrency;
    }

    await ctx.db.patch(eventType._id, updateData);
    return eventType._id;
  },
});

export const deleteEventType = mutation({
  args: {
    eventTypeId: v.id("eventTypes"),
  },
  handler: async (ctx, args) => {
    const authUser = await authComponent.safeGetAuthUser(ctx);
    if (!authUser) {
      throw new Error("Not authenticated");
    }

    const eventType = await ctx.db.get(args.eventTypeId);
    if (!eventType) {
      throw new Error("Event type not found");
    }

    if (eventType.userId !== authUser._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.eventTypeId);
    return args.eventTypeId;
  },
});
