import { httpRouter } from "convex/server";

import { authComponent, createAuth } from "./auth";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";

const http = httpRouter();

authComponent.registerRoutes(http, createAuth, { cors: true });

/**
 * OAuth callback for both Google Calendar and Outlook.
 *
 * Expected query params:
 *   - code  — authorization code from the provider
 *   - state — opaque string that maps back to a calendarAuthStates entry
 *   - error — present when the user denied consent
 *
 * On success: stores tokens via `calendar.exchangeCalendarCode` and redirects to /settings.
 * On error: redirects to /settings?calendarError=<reason>.
 */
http.route({
  path: "/api/calendar/callback",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const siteUrl = process.env.SITE_URL ?? "http://localhost:5173";
    const settingsUrl = `${siteUrl}/settings`;
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    if (error || !code || !state) {
      return Response.redirect(
        `${settingsUrl}?calendarError=access_denied`,
        302
      );
    }

    // Look up the auth state to identify the user and provider
    const authState = await ctx.runQuery(internal.calendar.getAuthState, {
      state,
    });

    if (!authState || authState.expiresAt < Date.now()) {
      return Response.redirect(
        `${settingsUrl}?calendarError=state_expired`,
        302
      );
    }

    const { userId, provider } = authState;

    // Clean up the auth state entry
    await ctx.runMutation(internal.calendar.deleteAuthState, {
      id: authState._id,
    });

    // Exchange code for tokens and store the connection
    try {
      await ctx.runAction(internal.calendar.exchangeCalendarCode, {
        provider,
        code,
        userId,
      });
    } catch {
      return Response.redirect(
        `${settingsUrl}?calendarError=token_exchange_failed`,
        302
      );
    }

    return Response.redirect(
      `${settingsUrl}?calendarConnected=${provider}`,
      302
    );
  }),
});

export default http;
