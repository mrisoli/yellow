import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";

/** Create a new booking. */
export const createBooking = mutation({
  args: {
    email: v.string(),
    date: v.string(), // ISO date string (YYYY-MM-DD)
    time: v.string(), // Time slot (HH:mm)
    source: v.optional(v.string()),
  },
  handler: async (ctx, { email, date, time, source }) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Check if this is a new attendee by looking for previous bookings with this email
    const existingBooking = await ctx.db
      .query("bookings")
      .withIndex("by_userId_email", (q) =>
        q.eq("userId", user._id.toString()).eq("email", email)
      )
      .first();

    const isNewAttendee = !existingBooking;

    const bookingId = await ctx.db.insert("bookings", {
      userId: user._id.toString(),
      email,
      date,
      time,
      status: "confirmed",
      source: source || undefined,
      isNewAttendee,
      createdAt: Date.now(),
    });

    return bookingId;
  },
});

/** Update a booking's status. */
export const updateBookingStatus = mutation({
  args: {
    bookingId: v.id("bookings"),
    status: v.union(
      v.literal("confirmed"),
      v.literal("cancelled"),
      v.literal("no-show"),
      v.literal("rescheduled")
    ),
  },
  handler: async (ctx, { bookingId, status }) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const booking = await ctx.db.get(bookingId);
    if (!booking || booking.userId !== user._id.toString()) {
      throw new Error("Booking not found or not authorized");
    }

    const updates: {
      status: "confirmed" | "cancelled" | "no-show" | "rescheduled";
      cancelledAt?: number;
    } = { status };

    if (status === "cancelled") {
      updates.cancelledAt = Date.now();
    }

    await ctx.db.patch(bookingId, updates);
  },
});

/** Get all bookings for the authenticated user. */
export const getUserBookings = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      return [];
    }

    return await ctx.db
      .query("bookings")
      .withIndex("by_userId", (q) => q.eq("userId", user._id.toString()))
      .collect();
  },
});

/** Get total bookings count over all time. */
export const getTotalBookingsCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      return 0;
    }

    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_userId", (q) => q.eq("userId", user._id.toString()))
      .collect();

    return bookings.filter((b) => b.status === "confirmed").length;
  },
});

/** Get bookings by date range. */
export const getBookingsByDateRange = query({
  args: {
    startDate: v.string(), // ISO date string
    endDate: v.string(), // ISO date string
  },
  handler: async (ctx, { startDate, endDate }) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      return [];
    }

    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_userId", (q) => q.eq("userId", user._id.toString()))
      .collect();

    return bookings.filter((b) => {
      const bookingDate = b.date;
      return (
        bookingDate >= startDate &&
        bookingDate <= endDate &&
        b.status === "confirmed"
      );
    });
  },
});

/** Get booking statistics for the dashboard. */
export const getBookingStatistics = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      return {
        totalBookings: 0,
        confirmedBookings: 0,
        cancelledBookings: 0,
        noShowBookings: 0,
        rescheduleRequests: 0,
        newAttendees: 0,
        returningAttendees: 0,
        cancellationRate: 0,
        noShowRate: 0,
      };
    }

    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_userId", (q) => q.eq("userId", user._id.toString()))
      .collect();

    const confirmedBookings = bookings.filter((b) => b.status === "confirmed");
    const cancelledBookings = bookings.filter((b) => b.status === "cancelled");
    const noShowBookings = bookings.filter((b) => b.status === "no-show");
    const rescheduleRequests = bookings.filter(
      (b) => b.status === "rescheduled"
    );
    const newAttendees = bookings.filter((b) => b.isNewAttendee).length;
    const returningAttendees = bookings.filter((b) => !b.isNewAttendee).length;

    const totalBookings = bookings.length;
    const cancellationRate =
      totalBookings > 0
        ? Math.round((cancelledBookings.length / totalBookings) * 100)
        : 0;
    const noShowRate =
      confirmedBookings.length > 0
        ? Math.round((noShowBookings.length / confirmedBookings.length) * 100)
        : 0;

    return {
      totalBookings,
      confirmedBookings: confirmedBookings.length,
      cancelledBookings: cancelledBookings.length,
      noShowBookings: noShowBookings.length,
      rescheduleRequests: rescheduleRequests.length,
      newAttendees,
      returningAttendees,
      cancellationRate,
      noShowRate,
    };
  },
});

/** Get popular time slots. */
export const getPopularTimeSlots = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      return [];
    }

    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_userId", (q) => q.eq("userId", user._id.toString()))
      .collect();

    const confirmedBookings = bookings.filter((b) => b.status === "confirmed");

    // Count bookings per time slot
    const timeSlotMap = new Map<string, number>();
    for (const booking of confirmedBookings) {
      const count = timeSlotMap.get(booking.time) ?? 0;
      timeSlotMap.set(booking.time, count + 1);
    }

    // Sort by count descending
    return Array.from(timeSlotMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([time, count]) => ({ time, count }));
  },
});

/** Get popular days of the week. */
export const getPopularDays = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      return [];
    }

    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_userId", (q) => q.eq("userId", user._id.toString()))
      .collect();

    const confirmedBookings = bookings.filter((b) => b.status === "confirmed");

    // Map days of week names
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const dayMap = new Map<string, number>();

    for (const booking of confirmedBookings) {
      const date = new Date(`${booking.date}T00:00:00Z`);
      const dayOfWeek = date.getUTCDay();
      const dayName = dayNames[dayOfWeek];
      const count = dayMap.get(dayName) ?? 0;
      dayMap.set(dayName, count + 1);
    }

    // Return in order of week
    return dayNames
      .map((day) => ({
        day,
        count: dayMap.get(day) ?? 0,
      }))
      .filter((d) => d.count > 0);
  },
});

/** Get bookings trend over time (grouped by date). */
export const getBookingsTrend = query({
  args: {
    days: v.number(), // Number of days to include
  },
  handler: async (ctx, { days }) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      return [];
    }

    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_userId", (q) => q.eq("userId", user._id.toString()))
      .collect();

    const confirmedBookings = bookings.filter((b) => b.status === "confirmed");

    // Count bookings per date
    const dateMap = new Map<string, number>();
    for (const booking of confirmedBookings) {
      const count = dateMap.get(booking.date) ?? 0;
      dateMap.set(booking.date, count + 1);
    }

    // Sort by date and return
    return Array.from(dateMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-days)
      .map(([date, count]) => ({ date, count }));
  },
});

/** Get attendee statistics. */
export const getAttendeeStatistics = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      return {
        totalAttendees: 0,
        newAttendees: 0,
        returningAttendees: 0,
        repeatBookingRate: 0,
        uniqueEmails: [],
      };
    }

    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_userId", (q) => q.eq("userId", user._id.toString()))
      .collect();

    const confirmedBookings = bookings.filter((b) => b.status === "confirmed");

    // Count unique emails
    const emailSet = new Set<string>();
    for (const booking of confirmedBookings) {
      emailSet.add(booking.email);
    }

    const newAttendees = confirmedBookings.filter(
      (b) => b.isNewAttendee
    ).length;
    const returningAttendees = confirmedBookings.filter(
      (b) => !b.isNewAttendee
    ).length;

    const totalAttendees = emailSet.size;
    const repeatBookingRate =
      totalAttendees > 0
        ? Math.round((returningAttendees / confirmedBookings.length) * 100)
        : 0;

    return {
      totalAttendees,
      newAttendees,
      returningAttendees,
      repeatBookingRate,
      uniqueEmails: Array.from(emailSet).sort(),
    };
  },
});
