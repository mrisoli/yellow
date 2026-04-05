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

  groupMeetings: defineTable({
    organizerUserId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    attendees: v.array(
      v.object({
        name: v.string(),
        email: v.string(),
      })
    ),
    durationMinutes: v.number(),
    status: v.union(
      v.literal("draft"),
      v.literal("poll_active"),
      v.literal("confirmed"),
      v.literal("cancelled"),
      v.literal("completed")
    ),
    confirmedDate: v.optional(v.string()),
    confirmedTime: v.optional(v.string()),
    confirmedStartsAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_organizer", ["organizerUserId"])
    .index("by_status", ["status"])
    .index("by_createdAt", ["createdAt"]),

  meetingPolls: defineTable({
    groupMeetingId: v.id("groupMeetings"),
    organizerUserId: v.string(),
    title: v.string(),
    attendees: v.array(
      v.object({
        name: v.string(),
        email: v.string(),
      })
    ),
    durationMinutes: v.number(),
    pollOptions: v.array(
      v.object({
        date: v.string(),
        time: v.string(),
        startTime: v.number(), // timestamp
      })
    ),
    responses: v.array(
      v.object({
        attendeeEmail: v.string(),
        selectedOptionIndices: v.array(v.number()),
        respondedAt: v.number(),
      })
    ),
    createdAt: v.number(),
    expiresAt: v.number(),
    status: v.union(v.literal("active"), v.literal("closed")),
  })
    .index("by_groupMeeting", ["groupMeetingId"])
    .index("by_organizer", ["organizerUserId"])
    .index("by_status", ["status"])
    .index("by_expiresAt", ["expiresAt"]),

  bookings: defineTable({
    organizerUserId: v.string(),
    attendeeName: v.string(),
    attendeeEmail: v.string(),
    attendeePhone: v.optional(v.string()),
    date: v.string(),
    time: v.string(),
    durationMinutes: v.number(),
    status: v.union(
      v.literal("confirmed"),
      v.literal("cancelled"),
      v.literal("completed")
    ),
    confirmationSent: v.boolean(),
    reminderSent: v.boolean(),
    followUpSent: v.boolean(),
    meetingStartsAt: v.number(),
    groupMeetingId: v.optional(v.id("groupMeetings")),
  })
    .index("by_organizer", ["organizerUserId"])
    .index("by_meetingStartsAt", ["meetingStartsAt"])
    .index("by_groupMeeting", ["groupMeetingId"]),

  notificationSettings: defineTable({
    userId: v.string(),
    emailConfirmationEnabled: v.boolean(),
    reminderEnabled: v.boolean(),
    reminderHoursBefore: v.number(),
    smsReminderEnabled: v.boolean(),
    followUpEnabled: v.boolean(),
    followUpHoursAfter: v.number(),
    confirmationSubject: v.optional(v.string()),
    confirmationBody: v.optional(v.string()),
    reminderSubject: v.optional(v.string()),
    reminderBody: v.optional(v.string()),
    followUpSubject: v.optional(v.string()),
    followUpBody: v.optional(v.string()),
    smsReminderTemplate: v.optional(v.string()),
  }).index("by_userId", ["userId"]),

  salesforceIntegrations: defineTable({
    userId: v.string(),
    orgId: v.string(),
    instanceUrl: v.string(),
    accessToken: v.string(),
    refreshToken: v.string(),
    connectedAt: v.number(),
    fieldMappings: v.optional(
      v.object({
        attendeeName: v.optional(v.string()),
        attendeeEmail: v.optional(v.string()),
        attendeePhone: v.optional(v.string()),
        meetingType: v.optional(v.string()),
        meetingDate: v.optional(v.string()),
        meetingTime: v.optional(v.string()),
      })
    ),
  }).index("by_userId", ["userId"]),
});
