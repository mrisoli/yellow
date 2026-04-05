import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";

export const getStripeAccount = query({
  args: {},
  handler: async (ctx) => {
    const authUser = await authComponent.safeGetAuthUser(ctx);
    if (!authUser) {
      return null;
    }

    const stripeAccount = await ctx.db
      .query("stripeAccounts")
      .withIndex("by_userId", (q) => q.eq("userId", authUser._id))
      .first();

    return stripeAccount;
  },
});

export const createStripeAccount = mutation({
  args: {
    stripeAccountId: v.string(),
    stripePublishableKey: v.string(),
  },
  handler: async (ctx, args) => {
    const authUser = await authComponent.safeGetAuthUser(ctx);
    if (!authUser) {
      throw new Error("Not authenticated");
    }

    const existingAccount = await ctx.db
      .query("stripeAccounts")
      .withIndex("by_userId", (q) => q.eq("userId", authUser._id))
      .first();

    const now = Date.now();

    if (existingAccount) {
      await ctx.db.patch(existingAccount._id, {
        stripeAccountId: args.stripeAccountId,
        stripePublishableKey: args.stripePublishableKey,
        isConnected: true,
        updatedAt: now,
      });
      return existingAccount._id;
    }

    const stripeAccountId = await ctx.db.insert("stripeAccounts", {
      userId: authUser._id,
      stripeAccountId: args.stripeAccountId,
      stripePublishableKey: args.stripePublishableKey,
      isConnected: true,
      createdAt: now,
      updatedAt: now,
    });

    return stripeAccountId;
  },
});

export const disconnectStripeAccount = mutation({
  args: {},
  handler: async (ctx) => {
    const authUser = await authComponent.safeGetAuthUser(ctx);
    if (!authUser) {
      throw new Error("Not authenticated");
    }

    const stripeAccount = await ctx.db
      .query("stripeAccounts")
      .withIndex("by_userId", (q) => q.eq("userId", authUser._id))
      .first();

    if (!stripeAccount) {
      throw new Error("Stripe account not found");
    }

    await ctx.db.patch(stripeAccount._id, {
      isConnected: false,
      updatedAt: Date.now(),
    });

    return stripeAccount._id;
  },
});
