import { v } from "convex/values";

import { internal } from "./_generated/api";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { authComponent } from "./auth";

/**
 * Create a new group meeting in draft status.
 * The organizer can add attendees and later create a poll.
 */
export const createGroupMeeting = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    attendees: v.array(
      v.object({
        name: v.string(),
        email: v.string(),
      })
    ),
    durationMinutes: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const groupMeetingId = await ctx.db.insert("groupMeetings", {
      organizerUserId: user._id.toString(),
      title: args.title,
      description: args.description,
      attendees: args.attendees,
      durationMinutes: args.durationMinutes,
      status: "draft",
      createdAt: Date.now(),
    });

    return groupMeetingId;
  },
});

/**
 * Get a group meeting by ID with authorization check.
 */
export const getGroupMeeting = query({
  args: {
    groupMeetingId: v.id("groupMeetings"),
  },
  handler: async (ctx, { groupMeetingId }) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    const meeting = await ctx.db.get(groupMeetingId);

    if (!meeting) {
      return null;
    }

    // Allow organizer or attendees to view
    if (user && user._id.toString() === meeting.organizerUserId) {
      return meeting;
    }

    // Allow attendees to view (for poll participation)
    if (
      meeting.attendees.some(
        (attendee: { name: string; email: string }) => attendee.email === user?.email
      )
    ) {
      return meeting;
    }

    // Unauthenticated users cannot view
    return null;
  },
});

/**
 * Get all group meetings for the authenticated organizer.
 */
export const getGroupMeetingsByOrganizer = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      return [];
    }

    return await ctx.db
      .query("groupMeetings")
      .withIndex("by_organizer", (q) =>
        q.eq("organizerUserId", user._id.toString())
      )
      .order("desc")
      .collect();
  },
});

/**
 * Update a group meeting (e.g., change attendees or title before poll starts).
 */
export const updateGroupMeeting = mutation({
  args: {
    groupMeetingId: v.id("groupMeetings"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    attendees: v.optional(
      v.array(
        v.object({
          name: v.string(),
          email: v.string(),
        })
      )
    ),
    durationMinutes: v.optional(v.number()),
  },
  handler: async (ctx, { groupMeetingId, ...updates }) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const meeting = await ctx.db.get(groupMeetingId);
    if (!meeting) {
      throw new Error("Group meeting not found");
    }

    if (meeting.organizerUserId !== user._id.toString()) {
      throw new Error("Not authorized");
    }

    // Only allow updates if meeting is still in draft
    if (meeting.status !== "draft") {
      throw new Error("Cannot update meeting after poll has started");
    }

    await ctx.db.patch(groupMeetingId, updates);
  },
});

/**
 * Create a meeting poll for a group meeting.
 * This transitions the meeting from draft to poll_active.
 */
export const createMeetingPoll = mutation({
  args: {
    groupMeetingId: v.id("groupMeetings"),
    pollOptions: v.array(
      v.object({
        date: v.string(),
        time: v.string(),
      })
    ),
    expirationDays: v.optional(v.number()), // defaults to 3 days
  },
  handler: async (ctx, { groupMeetingId, pollOptions, expirationDays = 3 }) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const meeting = await ctx.db.get(groupMeetingId);
    if (!meeting) {
      throw new Error("Group meeting not found");
    }

    if (meeting.organizerUserId !== user._id.toString()) {
      throw new Error("Not authorized");
    }

    if (meeting.status !== "draft") {
      throw new Error("Poll already exists for this meeting");
    }

    // Convert poll options to include timestamps
    const optionsWithTimestamps = pollOptions.map((option) => {
      const parts = option.date.split("-").map(Number);
      const timeParts = option.time.split(":").map(Number);
      const startTime = new Date(
        parts[0] ?? 0,
        (parts[1] ?? 1) - 1,
        parts[2] ?? 1,
        timeParts[0] ?? 0,
        timeParts[1] ?? 0
      ).getTime();

      return {
        date: option.date,
        time: option.time,
        startTime,
      };
    });

    const expiresAt = Date.now() + expirationDays * 24 * 60 * 60 * 1000;

    const pollId = await ctx.db.insert("meetingPolls", {
      groupMeetingId,
      organizerUserId: user._id.toString(),
      title: meeting.title,
      attendees: meeting.attendees,
      durationMinutes: meeting.durationMinutes,
      pollOptions: optionsWithTimestamps,
      responses: [],
      createdAt: Date.now(),
      expiresAt,
      status: "active",
    });

    // Update group meeting status to poll_active
    await ctx.db.patch(groupMeetingId, { status: "poll_active" });

    return pollId;
  },
});

/**
 * Get a meeting poll with response aggregation.
 */
export const getMeetingPoll = query({
  args: {
    pollId: v.id("meetingPolls"),
  },
  handler: async (ctx, { pollId }) => {
    const poll = await ctx.db.get(pollId);
    if (!poll) {
      return null;
    }

    // Aggregate responses to count votes per option
    const voteCount = Array(poll.pollOptions.length).fill(0);
    for (const response of poll.responses) {
      for (const optionIndex of response.selectedOptionIndices) {
        voteCount[optionIndex] += 1;
      }
    }

    return {
      ...poll,
      voteCount,
      respondentCount: new Set(
        poll.responses.map((r: { attendeeEmail: string }) => r.attendeeEmail)
      ).size,
    };
  },
});

/**
 * Get all polls for a group meeting.
 */
export const getPollsByGroupMeeting = query({
  args: {
    groupMeetingId: v.id("groupMeetings"),
  },
  handler: async (ctx, { groupMeetingId }) => {
    return await ctx.db
      .query("meetingPolls")
      .withIndex("by_groupMeeting", (q) =>
        q.eq("groupMeetingId", groupMeetingId)
      )
      .collect();
  },
});

/**
 * Submit poll responses for an attendee.
 */
export const submitPollResponse = mutation({
  args: {
    pollId: v.id("meetingPolls"),
    attendeeEmail: v.string(),
    selectedOptionIndices: v.array(v.number()),
  },
  handler: async (ctx, { pollId, attendeeEmail, selectedOptionIndices }) => {
    const poll = await ctx.db.get(pollId);
    if (!poll) {
      throw new Error("Poll not found");
    }

    if (poll.status !== "active") {
      throw new Error("Poll is not active");
    }

    if (Date.now() > poll.expiresAt) {
      throw new Error("Poll has expired");
    }

    // Validate that attendee is in the poll
    const isAttendee = poll.attendees.some(
      (attendee: { name: string; email: string }) =>
        attendee.email === attendeeEmail
    );
    if (!isAttendee) {
      throw new Error("Attendee not invited to this poll");
    }

    // Validate option indices
    if (
      selectedOptionIndices.some(
        (idx: number) => idx < 0 || idx >= poll.pollOptions.length
      )
    ) {
      throw new Error("Invalid option index");
    }

    // Remove existing response if present
    const responses = poll.responses.filter(
      (r: { attendeeEmail: string }) => r.attendeeEmail !== attendeeEmail
    );

    // Add new response
    responses.push({
      attendeeEmail,
      selectedOptionIndices,
      respondedAt: Date.now(),
    });

    await ctx.db.patch(pollId, { responses });
  },
});

/**
 * Close the poll and determine the best time slot.
 * Returns the index of the most popular option.
 */
export const closePoll = mutation({
  args: {
    pollId: v.id("meetingPolls"),
  },
  handler: async (ctx, { pollId }) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const poll = await ctx.db.get(pollId);
    if (!poll) {
      throw new Error("Poll not found");
    }

    if (poll.organizerUserId !== user._id.toString()) {
      throw new Error("Not authorized");
    }

    // Calculate vote counts
    const voteCount = Array(poll.pollOptions.length).fill(0);
    for (const response of poll.responses) {
      for (const optionIndex of response.selectedOptionIndices) {
        voteCount[optionIndex] += 1;
      }
    }

    // Find option with most votes
    const bestOptionIndex = voteCount.indexOf(Math.max(...voteCount));
    const bestOption = poll.pollOptions[bestOptionIndex];

    if (!bestOption) {
      throw new Error("No valid poll options");
    }

    // Close the poll
    await ctx.db.patch(pollId, { status: "closed" });

    return {
      bestOptionIndex,
      bestOption,
    };
  },
});

/**
 * Convert a poll result into a confirmed group booking.
 * Creates individual bookings for each attendee.
 */
export const convertPollToBooking = mutation({
  args: {
    pollId: v.id("meetingPolls"),
    selectedOptionIndex: v.number(),
  },
  handler: async (ctx, { pollId, selectedOptionIndex }) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const poll = await ctx.db.get(pollId);
    if (!poll) {
      throw new Error("Poll not found");
    }

    if (poll.organizerUserId !== user._id.toString()) {
      throw new Error("Not authorized");
    }

    if (selectedOptionIndex < 0 || selectedOptionIndex >= poll.pollOptions.length) {
      throw new Error("Invalid option index");
    }

    const selectedOption = poll.pollOptions[selectedOptionIndex];

    // Parse meeting start time
    const parts = selectedOption.date.split("-").map(Number);
    const timeParts = selectedOption.time.split(":").map(Number);
    const meetingStartsAt = new Date(
      parts[0] ?? 0,
      (parts[1] ?? 1) - 1,
      parts[2] ?? 1,
      timeParts[0] ?? 0,
      timeParts[1] ?? 0
    ).getTime();

    const groupMeeting = await ctx.db.get(poll.groupMeetingId);
    if (!groupMeeting) {
      throw new Error("Group meeting not found");
    }

    // Create a booking for each attendee
    const bookingIds = [];
    for (const attendee of poll.attendees) {
      const bookingId = await ctx.db.insert("bookings", {
        organizerUserId: poll.organizerUserId,
        attendeeName: attendee.name,
        attendeeEmail: attendee.email,
        date: selectedOption.date,
        time: selectedOption.time,
        durationMinutes: poll.durationMinutes,
        status: "confirmed",
        confirmationSent: false,
        reminderSent: false,
        followUpSent: false,
        meetingStartsAt,
        groupMeetingId: poll.groupMeetingId,
      });

      bookingIds.push(bookingId);

      // Trigger notification
      await ctx.scheduler.runAfter(
        0,
        internal.notifications.processConfirmation,
        { bookingId }
      );
    }

    // Update group meeting with confirmed time
    await ctx.db.patch(poll.groupMeetingId, {
      status: "confirmed",
      confirmedDate: selectedOption.date,
      confirmedTime: selectedOption.time,
      confirmedStartsAt: meetingStartsAt,
    });

    return bookingIds;
  },
});

/**
 * Cancel a group meeting and all associated bookings.
 */
export const cancelGroupMeeting = mutation({
  args: {
    groupMeetingId: v.id("groupMeetings"),
  },
  handler: async (ctx, { groupMeetingId }) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const meeting = await ctx.db.get(groupMeetingId);
    if (!meeting) {
      throw new Error("Group meeting not found");
    }

    if (meeting.organizerUserId !== user._id.toString()) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(groupMeetingId, { status: "cancelled" });

    // Cancel all associated bookings
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_groupMeeting", (q) =>
        q.eq("groupMeetingId", groupMeetingId)
      )
      .collect();

    for (const booking of bookings) {
      await ctx.db.patch(booking._id, { status: "cancelled" });
    }
  },
});

/**
 * Internal: Get polls that are expiring soon.
 * Used by cron jobs to close expired polls.
 */
export const getExpiringPolls = internalQuery({
  args: {
    nowMs: v.number(),
    windowEndMs: v.number(),
  },
  handler: async (ctx, { nowMs, windowEndMs }) => {
    return await ctx.db
      .query("meetingPolls")
      .withIndex("by_expiresAt", (q) =>
        q.gt("expiresAt", nowMs).lt("expiresAt", windowEndMs)
      )
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();
  },
});

/**
 * Internal: Auto-close expired polls.
 */
export const autoCloseExpiredPoll = internalMutation({
  args: {
    pollId: v.id("meetingPolls"),
  },
  handler: async (ctx, { pollId }) => {
    const poll = await ctx.db.get(pollId);
    if (!poll || poll.status !== "active") {
      return;
    }

    if (Date.now() <= poll.expiresAt) {
      return; // Not expired yet
    }

    await ctx.db.patch(pollId, { status: "closed" });
  },
});
