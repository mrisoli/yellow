/**
 * Calendar sync module — Google Calendar and Outlook integration.
 *
 * OAuth flow:
 *  1. Frontend calls `getCalendarAuthUrl` to obtain a provider auth URL.
 *  2. User is redirected to the provider consent screen.
 *  3. Provider redirects to `/api/calendar/callback?code=…&state=…` (HTTP handler in http.ts).
 *  4. The callback handler calls `exchangeCalendarCode` to store tokens.
 *  5. Frontend polls `listCalendarConnections` to confirm the connection appeared.
 *
 * Environment variables (set via the Convex dashboard):
 *  - GOOGLE_CLIENT_ID
 *  - GOOGLE_CLIENT_SECRET
 *  - MICROSOFT_CLIENT_ID
 *  - MICROSOFT_CLIENT_SECRET
 *  - SITE_URL  (already used by auth — e.g. https://app.example.com)
 */

import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import type { ActionCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { authComponent } from "./auth";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_FREEBUSY_URL =
  "https://www.googleapis.com/calendar/v3/freeBusy";

const MICROSOFT_AUTH_URL =
  "https://login.microsoftonline.com/common/oauth2/v2.0/authorize";
const MICROSOFT_TOKEN_URL =
  "https://login.microsoftonline.com/common/oauth2/v2.0/token";
const MICROSOFT_CALENDAR_URL =
  "https://graph.microsoft.com/v1.0/me/calendarView";

const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
].join(" ");

const MICROSOFT_SCOPES = "Calendars.Read User.Read offline_access";

// Auth state entries expire after 10 minutes
const AUTH_STATE_TTL_MS = 10 * 60 * 1000;

// Exported so other modules (e.g. booking widget) can read it
export const BUSY_CACHE_TTL_MS = 15 * 60 * 1000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function siteCallbackUrl(): string {
  const siteUrl = process.env.SITE_URL ?? "http://localhost:5173";
  return `${siteUrl}/api/calendar/callback`;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** List all connected calendars for the authenticated user. */
export const listCalendarConnections = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) return [];

    const connections = await ctx.db
      .query("calendarConnections")
      .withIndex("by_userId", (q) => q.eq("userId", user._id.toString()))
      .collect();

    return connections.map(({ _id, provider, accountEmail, expiresAt }) => ({
      id: _id,
      provider,
      accountEmail,
      expiresAt,
    }));
  },
});

/** Get busy blocks for a user within a time window (used by booking widget). */
export const getBusyTimes = query({
  args: {
    userId: v.string(),
    startTime: v.number(),
    endTime: v.number(),
  },
  handler: async (ctx, { userId, startTime, endTime }) => {
    const blocks = await ctx.db
      .query("busyBlocks")
      .withIndex("by_userId_time", (q) => q.eq("userId", userId))
      .filter((q) =>
        q.and(
          q.lt(q.field("startTime"), endTime),
          q.gt(q.field("endTime"), startTime)
        )
      )
      .collect();

    return blocks.map(({ startTime: s, endTime: e, provider, summary }) => ({
      startTime: s,
      endTime: e,
      provider,
      summary,
    }));
  },
});

// ---------------------------------------------------------------------------
// Internal queries
// ---------------------------------------------------------------------------

export const getAuthState = internalQuery({
  args: { state: v.string() },
  handler: async (ctx, { state }) => {
    return await ctx.db
      .query("calendarAuthStates")
      .withIndex("by_state", (q) => q.eq("state", state))
      .first();
  },
});

export const getCalendarConnectionById = internalQuery({
  args: { id: v.id("calendarConnections") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const getAllCalendarConnections = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("calendarConnections")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
  },
});

// ---------------------------------------------------------------------------
// Internal mutations
// ---------------------------------------------------------------------------

export const deleteAuthState = internalMutation({
  args: { id: v.id("calendarAuthStates") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});

export const storeAuthState = internalMutation({
  args: {
    userId: v.string(),
    provider: v.union(v.literal("google"), v.literal("outlook")),
    state: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("calendarAuthStates", args);
  },
});

export const saveCalendarConnection = internalMutation({
  args: {
    userId: v.string(),
    provider: v.union(v.literal("google"), v.literal("outlook")),
    accountEmail: v.string(),
    accessToken: v.string(),
    refreshToken: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("calendarConnections")
      .withIndex("by_userId_provider", (q) =>
        q.eq("userId", args.userId).eq("provider", args.provider)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        accountEmail: args.accountEmail,
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        expiresAt: args.expiresAt,
      });
    } else {
      await ctx.db.insert("calendarConnections", args);
    }
  },
});

export const updateCalendarToken = internalMutation({
  args: {
    id: v.id("calendarConnections"),
    accessToken: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, { id, accessToken, expiresAt }) => {
    await ctx.db.patch(id, { accessToken, expiresAt });
  },
});

export const replaceBusyBlocks = internalMutation({
  args: {
    userId: v.string(),
    provider: v.union(v.literal("google"), v.literal("outlook")),
    blocks: v.array(
      v.object({
        startTime: v.number(),
        endTime: v.number(),
        summary: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, { userId, provider, blocks }) => {
    // Remove stale blocks for this provider
    const existing = await ctx.db
      .query("busyBlocks")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("provider"), provider))
      .collect();

    for (const block of existing) {
      await ctx.db.delete(block._id);
    }

    // Insert fresh blocks
    for (const block of blocks) {
      await ctx.db.insert("busyBlocks", { userId, provider, ...block });
    }
  },
});

// ---------------------------------------------------------------------------
// Public mutations
// ---------------------------------------------------------------------------

/** Disconnect a calendar provider and remove cached busy blocks. */
export const removeCalendarConnection = mutation({
  args: {
    provider: v.union(v.literal("google"), v.literal("outlook")),
  },
  handler: async (ctx, { provider }) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const connection = await ctx.db
      .query("calendarConnections")
      .withIndex("by_userId_provider", (q) =>
        q.eq("userId", user._id.toString()).eq("provider", provider)
      )
      .first();

    if (connection) {
      await ctx.db.delete(connection._id);
    }

    const blocks = await ctx.db
      .query("busyBlocks")
      .withIndex("by_userId", (q) => q.eq("userId", user._id.toString()))
      .filter((q) => q.eq(q.field("provider"), provider))
      .collect();

    for (const block of blocks) {
      await ctx.db.delete(block._id);
    }
  },
});

// ---------------------------------------------------------------------------
// Actions — OAuth URL generation
// ---------------------------------------------------------------------------

/** Generate the provider's OAuth authorization URL and create a state entry. */
export const getCalendarAuthUrl = action({
  args: {
    provider: v.union(v.literal("google"), v.literal("outlook")),
  },
  handler: async (ctx, { provider }): Promise<string> => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const state = crypto.randomUUID();

    await ctx.runMutation(internal.calendar.storeAuthState, {
      userId: user._id.toString(),
      provider,
      state,
      expiresAt: Date.now() + AUTH_STATE_TTL_MS,
    });

    const redirect = siteCallbackUrl();

    if (provider === "google") {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      if (!clientId) throw new Error("GOOGLE_CLIENT_ID not configured");

      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirect,
        response_type: "code",
        scope: GOOGLE_SCOPES,
        access_type: "offline",
        prompt: "consent",
        state,
      });
      return `${GOOGLE_AUTH_URL}?${params.toString()}`;
    }

    const clientId = process.env.MICROSOFT_CLIENT_ID;
    if (!clientId) throw new Error("MICROSOFT_CLIENT_ID not configured");

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirect,
      response_type: "code",
      scope: MICROSOFT_SCOPES,
      response_mode: "query",
      state,
    });
    return `${MICROSOFT_AUTH_URL}?${params.toString()}`;
  },
});

// ---------------------------------------------------------------------------
// Actions — OAuth token exchange (called from the HTTP callback handler)
// ---------------------------------------------------------------------------

/** Exchange an authorization code for tokens and store the calendar connection. */
export const exchangeCalendarCode = internalAction({
  args: {
    provider: v.union(v.literal("google"), v.literal("outlook")),
    code: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, { provider, code, userId }) => {
    const redirect = siteCallbackUrl();

    type TokenResponse = {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
    };

    let tokenData: TokenResponse;
    let accountEmail: string;

    if (provider === "google") {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      if (!clientId || !clientSecret)
        throw new Error("Google OAuth credentials not configured");

      const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirect,
          grant_type: "authorization_code",
        }),
      });
      tokenData = (await tokenRes.json()) as TokenResponse;

      const infoRes = await fetch(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
      );
      const infoData = (await infoRes.json()) as { email?: string };
      accountEmail = infoData.email ?? "";
    } else {
      const clientId = process.env.MICROSOFT_CLIENT_ID;
      const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
      if (!clientId || !clientSecret)
        throw new Error("Microsoft OAuth credentials not configured");

      const tokenRes = await fetch(MICROSOFT_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirect,
          grant_type: "authorization_code",
          scope: MICROSOFT_SCOPES,
        }),
      });
      tokenData = (await tokenRes.json()) as TokenResponse;

      const meRes = await fetch("https://graph.microsoft.com/v1.0/me", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const meData = (await meRes.json()) as {
        mail?: string;
        userPrincipalName?: string;
      };
      accountEmail = meData.mail ?? meData.userPrincipalName ?? "";
    }

    await ctx.runMutation(internal.calendar.saveCalendarConnection, {
      userId,
      provider,
      accountEmail,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token ?? "",
      expiresAt: Date.now() + tokenData.expires_in * 1000,
    });
  },
});

// ---------------------------------------------------------------------------
// Actions — Calendar sync
// ---------------------------------------------------------------------------

/**
 * Sync busy times from all connected calendars for the authenticated user.
 * Fetches events for the next 30 days and caches them in `busyBlocks`.
 */
export const syncCalendarBusyTimes = action({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const userId = user._id.toString();
    const connections = await ctx.runQuery(
      internal.calendar.getAllCalendarConnections,
      { userId }
    );

    const now = Date.now();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const windowEnd = now + thirtyDaysMs;

    for (const connection of connections) {
      await ctx.runAction(internal.calendar.syncProviderBusyTimes, {
        connectionId: connection._id,
        userId,
        provider: connection.provider,
        windowStart: now,
        windowEnd,
      });
    }
  },
});

/** Internal action: sync busy times from one calendar connection. */
export const syncProviderBusyTimes = internalAction({
  args: {
    connectionId: v.id("calendarConnections"),
    userId: v.string(),
    provider: v.union(v.literal("google"), v.literal("outlook")),
    windowStart: v.number(),
    windowEnd: v.number(),
  },
  handler: async (ctx, { connectionId, userId, provider, windowStart, windowEnd }) => {
    const connection = await ctx.runQuery(
      internal.calendar.getCalendarConnectionById,
      { id: connectionId }
    );
    if (!connection) return;

    let { accessToken } = connection;

    // Refresh the token if it expires within the next 5 minutes
    if (connection.expiresAt - Date.now() < 5 * 60 * 1000) {
      accessToken = await refreshToken(
        ctx,
        connectionId,
        connection.refreshToken,
        provider
      );
    }

    const blocks =
      provider === "google"
        ? await fetchGoogleBusyTimes(accessToken, windowStart, windowEnd)
        : await fetchOutlookBusyTimes(accessToken, windowStart, windowEnd);

    await ctx.runMutation(internal.calendar.replaceBusyBlocks, {
      userId,
      provider,
      blocks,
    });
  },
});

// ---------------------------------------------------------------------------
// Token refresh helper
// ---------------------------------------------------------------------------

async function refreshToken(
  ctx: Pick<ActionCtx, "runMutation">,
  connectionId: Id<"calendarConnections">,
  currentRefreshToken: string,
  provider: "google" | "outlook"
): Promise<string> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: currentRefreshToken,
  });

  let tokenUrl: string;

  if (provider === "google") {
    body.append("client_id", process.env.GOOGLE_CLIENT_ID ?? "");
    body.append("client_secret", process.env.GOOGLE_CLIENT_SECRET ?? "");
    tokenUrl = GOOGLE_TOKEN_URL;
  } else {
    body.append("client_id", process.env.MICROSOFT_CLIENT_ID ?? "");
    body.append("client_secret", process.env.MICROSOFT_CLIENT_SECRET ?? "");
    body.append("scope", MICROSOFT_SCOPES);
    tokenUrl = MICROSOFT_TOKEN_URL;
  }

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };

  const newExpiresAt = Date.now() + data.expires_in * 1000;
  await ctx.runMutation(internal.calendar.updateCalendarToken, {
    id: connectionId,
    accessToken: data.access_token,
    expiresAt: newExpiresAt,
  });

  return data.access_token;
}

// ---------------------------------------------------------------------------
// External calendar API helpers
// ---------------------------------------------------------------------------

type BusyBlock = { startTime: number; endTime: number; summary?: string };

async function fetchGoogleBusyTimes(
  accessToken: string,
  windowStart: number,
  windowEnd: number
): Promise<BusyBlock[]> {
  const res = await fetch(GOOGLE_CALENDAR_FREEBUSY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      timeMin: new Date(windowStart).toISOString(),
      timeMax: new Date(windowEnd).toISOString(),
      items: [{ id: "primary" }],
    }),
  });
  const data = (await res.json()) as {
    calendars?: { primary?: { busy?: Array<{ start: string; end: string }> } };
  };

  return (data.calendars?.primary?.busy ?? []).map(({ start, end }) => ({
    startTime: new Date(start).getTime(),
    endTime: new Date(end).getTime(),
  }));
}

async function fetchOutlookBusyTimes(
  accessToken: string,
  windowStart: number,
  windowEnd: number
): Promise<BusyBlock[]> {
  const url = new URL(MICROSOFT_CALENDAR_URL);
  url.searchParams.set("startDateTime", new Date(windowStart).toISOString());
  url.searchParams.set("endDateTime", new Date(windowEnd).toISOString());
  url.searchParams.set("$select", "subject,start,end,showAs");

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Prefer: 'outlook.timezone="UTC"',
    },
  });
  const data = (await res.json()) as {
    value?: Array<{
      subject: string;
      start: { dateTime: string };
      end: { dateTime: string };
      showAs: string;
    }>;
  };

  return (data.value ?? [])
    .filter(({ showAs }) => showAs === "busy" || showAs === "oof")
    .map(({ subject, start, end }) => ({
      startTime: new Date(`${start.dateTime}Z`).getTime(),
      endTime: new Date(`${end.dateTime}Z`).getTime(),
      summary: subject,
    }));
}
