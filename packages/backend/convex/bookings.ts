import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { authComponent } from "./auth";
import { stripe } from "./stripe";

export const getBookings = query({
  args: {},
  handler: async (ctx) => {
    const authUser = await authComponent.safeGetAuthUser(ctx);
    if (!authUser) {
      return [];
    }

    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_userId", (q) => q.eq("userId", authUser._id))
      .collect();

    return bookings;
  },
});

export const getBooking = query({
  args: {
    bookingId: v.id("bookings"),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    return booking;
  },
});

export const createBooking = mutation({
  args: {
    eventTypeId: v.id("eventTypes"),
    guestEmail: v.string(),
    guestName: v.string(),
    scheduledStartTime: v.number(),
    scheduledEndTime: v.number(),
  },
  handler: async (ctx, args) => {
    const eventType = await ctx.db.get(args.eventTypeId);
    if (!eventType) {
      throw new Error("Event type not found");
    }

    const authUser = await authComponent.safeGetAuthUser(ctx);
    if (!authUser) {
      throw new Error("Not authenticated");
    }

    if (eventType.userId !== authUser._id) {
      throw new Error("Unauthorized");
    }

    const now = Date.now();

    let paymentStatus: "pending" | "completed" | "failed" | undefined;
    if (eventType.isPaymentRequired) {
      paymentStatus = "pending";
    }

    const bookingId = await ctx.db.insert("bookings", {
      userId: authUser._id,
      eventTypeId: args.eventTypeId,
      guestEmail: args.guestEmail,
      guestName: args.guestName,
      scheduledStartTime: args.scheduledStartTime,
      scheduledEndTime: args.scheduledEndTime,
      paymentStatus,
      createdAt: now,
      updatedAt: now,
    });

    return bookingId;
  },
});

export const createPaymentIntent = mutation({
  args: {
    bookingId: v.id("bookings"),
    amount: v.number(),
    currency: v.string(),
  },
  handler: async (ctx, args) => {
    const authUser = await authComponent.safeGetAuthUser(ctx);
    if (!authUser) {
      throw new Error("Not authenticated");
    }

    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    if (booking.userId !== authUser._id) {
      throw new Error("Unauthorized");
    }

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: args.amount,
        currency: args.currency,
        metadata: {
          bookingId: args.bookingId,
          userId: authUser._id,
        },
      });

      await ctx.db.patch(args.bookingId, {
        stripePaymentIntentId: paymentIntent.id,
        updatedAt: Date.now(),
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error) {
      throw new Error(
        `Failed to create payment intent: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },
});

export const updateBookingPaymentStatus = mutation({
  args: {
    bookingId: v.id("bookings"),
    paymentStatus: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed")
    ),
    stripePaymentIntentId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const authUser = await authComponent.safeGetAuthUser(ctx);
    if (!authUser) {
      throw new Error("Not authenticated");
    }

    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    if (booking.userId !== authUser._id) {
      throw new Error("Unauthorized");
    }

    const updateData: Record<string, unknown> = {
      paymentStatus: args.paymentStatus,
      updatedAt: Date.now(),
    };

    if (args.stripePaymentIntentId) {
      updateData.stripePaymentIntentId = args.stripePaymentIntentId;
    }

    await ctx.db.patch(args.bookingId, updateData);
    return args.bookingId;
  },
});

export const getBookingByStripePaymentIntent = query({
  args: {
    stripePaymentIntentId: v.string(),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db
      .query("bookings")
      .withIndex("by_stripePaymentIntentId", (q) =>
        q.eq("stripePaymentIntentId", args.stripePaymentIntentId)
      )
      .first();

    return booking;
  },
});
