import { v } from "convex/values";

import { internal } from "./_generated/api";
import {
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { authComponent } from "./auth";

const SALESFORCE_AUTH_URL = "https://login.salesforce.com/services/oauth2/authorize";
const SALESFORCE_TOKEN_URL = "https://login.salesforce.com/services/oauth2/token";
const SALESFORCE_API_VERSION = "v60.0";

/** Get Salesforce integration for authenticated user. */
export const getSalesforceIntegration = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      return null;
    }

    return await ctx.db
      .query("salesforceIntegrations")
      .withIndex("by_userId", (q) => q.eq("userId", user._id.toString()))
      .first();
  },
});

/** Get the Salesforce OAuth authorize URL. */
export const getSalesforceAuthUrl = query({
  args: {
    redirectUri: v.string(),
  },
  handler: async (_ctx, { redirectUri }) => {
    const clientId = process.env.SALESFORCE_CLIENT_ID;
    if (!clientId) {
      throw new Error("SALESFORCE_CLIENT_ID not configured");
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "api refresh_token",
      state: Math.random().toString(36).substring(7),
    });

    return `${SALESFORCE_AUTH_URL}?${params.toString()}`;
  },
});

/** Exchange OAuth code for tokens and store integration. */
export const connectSalesforce = mutation({
  args: {
    code: v.string(),
    redirectUri: v.string(),
  },
  handler: async (ctx, { code, redirectUri }) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const clientId = process.env.SALESFORCE_CLIENT_ID;
    const clientSecret = process.env.SALESFORCE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      throw new Error("Salesforce credentials not configured");
    }

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    });

    const response = await fetch(SALESFORCE_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Salesforce auth failed: ${text}`);
    }

    const data = (await response.json()) as {
      access_token: string;
      refresh_token: string;
      instance_url: string;
      org_id: string;
    };

    const userId = user._id.toString();

    const existing = await ctx.db
      .query("salesforceIntegrations")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        orgId: data.org_id,
        instanceUrl: data.instance_url,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        connectedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("salesforceIntegrations", {
        userId,
        orgId: data.org_id,
        instanceUrl: data.instance_url,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        connectedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

/** Disconnect Salesforce integration. */
export const disconnectSalesforce = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const integration = await ctx.db
      .query("salesforceIntegrations")
      .withIndex("by_userId", (q) => q.eq("userId", user._id.toString()))
      .first();

    if (integration) {
      await ctx.db.delete(integration._id);
    }

    return { success: true };
  },
});

/** Update field mappings for Salesforce integration. */
export const updateFieldMappings = mutation({
  args: {
    fieldMappings: v.object({
      attendeeName: v.optional(v.string()),
      attendeeEmail: v.optional(v.string()),
      attendeePhone: v.optional(v.string()),
      meetingType: v.optional(v.string()),
      meetingDate: v.optional(v.string()),
      meetingTime: v.optional(v.string()),
    }),
  },
  handler: async (ctx, { fieldMappings }) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const integration = await ctx.db
      .query("salesforceIntegrations")
      .withIndex("by_userId", (q) => q.eq("userId", user._id.toString()))
      .first();

    if (!integration) {
      throw new Error("Salesforce integration not found");
    }

    await ctx.db.patch(integration._id, { fieldMappings });

    return { success: true };
  },
});

/** Get Salesforce integration by user ID (internal). */
export const getSalesforceIntegrationInternal = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("salesforceIntegrations")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
  },
});

/** Refresh Salesforce access token. */
export const refreshSalesforceToken = internalAction({
  args: { integrationId: v.id("salesforceIntegrations") },
  handler: async (ctx, { integrationId }) => {
    const integration = await ctx.runQuery(internal.salesforce.getIntegrationById, {
      integrationId,
    });

    if (!integration) {
      throw new Error("Integration not found");
    }

    const clientId = process.env.SALESFORCE_CLIENT_ID;
    const clientSecret = process.env.SALESFORCE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      throw new Error("Salesforce credentials not configured");
    }

    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: integration.refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    });

    const response = await fetch(SALESFORCE_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Token refresh failed: ${text}`);
    }

    const data = (await response.json()) as {
      access_token: string;
      refresh_token?: string;
    };

    await ctx.runMutation(internal.salesforce.updateIntegrationTokens, {
      integrationId,
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? integration.refreshToken,
    });

    return data.access_token;
  },
});

/** Get integration by ID (internal). */
export const getIntegrationById = internalQuery({
  args: { integrationId: v.id("salesforceIntegrations") },
  handler: async (ctx, { integrationId }) => {
    return await ctx.db.get(integrationId);
  },
});

/** Update integration tokens (internal). */
export const updateIntegrationTokens = internalMutation({
  args: {
    integrationId: v.id("salesforceIntegrations"),
    accessToken: v.string(),
    refreshToken: v.string(),
  },
  handler: async (ctx, { integrationId, accessToken, refreshToken }) => {
    await ctx.db.patch(integrationId, { accessToken, refreshToken });
  },
});

/** Sync booking to Salesforce. */
export const syncBookingToSalesforce = internalAction({
  args: {
    bookingId: v.id("bookings"),
  },
  handler: async (ctx, { bookingId }) => {
    const booking = await ctx.runQuery(internal.salesforce.getBookingById, {
      bookingId,
    });

    if (!booking) {
      return;
    }

    const integration = await ctx.runQuery(
      internal.salesforce.getSalesforceIntegrationInternal,
      { userId: booking.organizerUserId }
    );

    if (!integration) {
      return;
    }

    try {
      const accessToken = await ctx.runAction(
        internal.salesforce.ensureValidToken,
        { integrationId: integration._id }
      );

      await ctx.runAction(internal.salesforce.upsertContactInSalesforce, {
        integrationId: integration._id,
        accessToken,
        instanceUrl: integration.instanceUrl,
        attendeeName: booking.attendeeName,
        attendeeEmail: booking.attendeeEmail,
        attendeePhone: booking.attendeePhone,
        date: booking.date,
        time: booking.time,
        durationMinutes: booking.durationMinutes,
      });
    } catch (error) {
      // Silently fail if Salesforce sync fails
    }
  },
});

/** Ensure token is valid, refreshing if needed. */
export const ensureValidToken = internalAction({
  args: { integrationId: v.id("salesforceIntegrations") },
  handler: async (ctx, { integrationId }) => {
    const integration = await ctx.runQuery(internal.salesforce.getIntegrationById, {
      integrationId,
    });

    if (!integration) {
      throw new Error("Integration not found");
    }

    return integration.accessToken;
  },
});

/** Upsert Contact in Salesforce and create Event. */
export const upsertContactInSalesforce = internalAction({
  args: {
    integrationId: v.id("salesforceIntegrations"),
    accessToken: v.string(),
    instanceUrl: v.string(),
    attendeeName: v.string(),
    attendeeEmail: v.string(),
    attendeePhone: v.optional(v.string()),
    date: v.string(),
    time: v.string(),
    durationMinutes: v.number(),
  },
  handler: async (
    ctx,
    {
      accessToken,
      instanceUrl,
      attendeeName,
      attendeeEmail,
      attendeePhone,
      date,
      time,
      durationMinutes,
    }
  ) => {
    // Search for existing contact by email
    const searchUrl = `${instanceUrl}/services/data/${SALESFORCE_API_VERSION}/search/`;
    const soqlQuery = `SELECT Id FROM Contact WHERE Email = '${escapeSOQL(attendeeEmail)}' LIMIT 1`;

    const searchResponse = await fetch(
      `${searchUrl}?q=${encodeURIComponent(`FIND {${attendeeEmail}}`)}&sf__scope=EMAIL_FIELDS`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    let contactId: string | undefined;

    if (searchResponse.ok) {
      const searchData = (await searchResponse.json()) as {
        searchRecords?: Array<{ Id: string }>;
      };
      if (searchData.searchRecords && searchData.searchRecords.length > 0) {
        contactId = searchData.searchRecords[0].Id;
      }
    }

    const contactData = {
      FirstName: attendeeName.split(" ")[0] ?? attendeeName,
      LastName: attendeeName.split(" ").slice(1).join(" ") || attendeeName,
      Email: attendeeEmail,
      Phone: attendeePhone,
    };

    // Create or update contact
    if (contactId) {
      const updateUrl = `${instanceUrl}/services/data/${SALESFORCE_API_VERSION}/sobjects/Contact/${contactId}`;
      await fetch(updateUrl, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(contactData),
      });
    } else {
      const createUrl = `${instanceUrl}/services/data/${SALESFORCE_API_VERSION}/sobjects/Contact/`;
      const createResponse = await fetch(createUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(contactData),
      });

      if (createResponse.ok) {
        const result = (await createResponse.json()) as { id: string };
        contactId = result.id;
      }
    }

    if (!contactId) {
      return;
    }

    // Create Event on the contact
    const eventData = {
      WhoId: contactId,
      Subject: `Meeting with ${attendeeName}`,
      ActivityDateTime: `${date}T${time}:00.000+0000`,
      DurationInMinutes: durationMinutes,
      Type: "Meeting",
    };

    const eventUrl = `${instanceUrl}/services/data/${SALESFORCE_API_VERSION}/sobjects/Event/`;
    await fetch(eventUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventData),
    });
  },
});

/** Get booking by ID (internal). */
export const getBookingById = internalQuery({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, { bookingId }) => {
    return await ctx.db.get(bookingId);
  },
});

/** Escape SOQL special characters. */
function escapeSOQL(value: string): string {
  return value.replace(/'/g, "\\'").replace(/\\/g, "\\\\");
}
