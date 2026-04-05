import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";

/** Validates that a slug is URL-safe: 2–30 lowercase alphanumeric chars or hyphens,
 *  no consecutive hyphens, no leading or trailing hyphen. */
const SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
const SLUG_MIN = 2;
const SLUG_MAX = 30;

function validateSlug(slug: string): string | null {
  if (slug.length < SLUG_MIN || slug.length > SLUG_MAX) {
    return `Slug must be between ${SLUG_MIN} and ${SLUG_MAX} characters`;
  }
  if (!SLUG_REGEX.test(slug)) {
    return "Slug may only contain lowercase letters, numbers, and hyphens, and cannot start or end with a hyphen";
  }
  if (slug.includes("--")) {
    return "Slug cannot contain consecutive hyphens";
  }
  return null;
}

/** Reserved slugs that cannot be chosen by users. */
const RESERVED_SLUGS = new Set([
  "login",
  "signup",
  "settings",
  "dashboard",
  "api",
  "admin",
  "support",
  "help",
  "about",
  "pricing",
  "terms",
  "privacy",
]);

/** Get the authenticated user's profile (slug + meta). Returns null if no profile set. */
export const getUserProfile = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      return null;
    }

    return await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", user._id.toString()))
      .first();
  },
});

/**
 * Public query used by the booking page to look up a host by their slug.
 * Also resolves previousSlugs so old links continue to work.
 * Returns { userId, slug, isRedirect } or null if not found.
 */
export const getPublicUserBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const normalised = slug.toLowerCase();

    // Primary lookup: current slug
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_slug", (q) => q.eq("slug", normalised))
      .first();

    if (profile) {
      return { userId: profile.userId, slug: profile.slug, isRedirect: false };
    }

    // Fallback: previous slug (grace-period redirect)
    const previousProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_previousSlug", (q) => q.eq("previousSlug", normalised))
      .first();

    if (previousProfile) {
      return {
        userId: previousProfile.userId,
        slug: previousProfile.slug,
        isRedirect: true,
      };
    }

    return null;
  },
});

/** Set or update the authenticated user's booking URL slug. */
export const setUserSlug = mutation({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const normalised = slug.toLowerCase().trim();

    // Validate format
    const validationError = validateSlug(normalised);
    if (validationError) {
      throw new Error(validationError);
    }

    // Check reserved slugs
    if (RESERVED_SLUGS.has(normalised)) {
      throw new Error("This slug is reserved and cannot be used");
    }

    // Check uniqueness (exclude current user's own profile)
    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_slug", (q) => q.eq("slug", normalised))
      .first();

    if (existing && existing.userId !== user._id.toString()) {
      throw new Error(
        "This slug is already taken — please choose a different one"
      );
    }

    // Get current profile
    const currentProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", user._id.toString()))
      .first();

    if (currentProfile) {
      // No-op if slug hasn't changed
      if (currentProfile.slug === normalised) {
        return;
      }

      await ctx.db.patch(currentProfile._id, {
        slug: normalised,
        previousSlug: currentProfile.slug,
        slugChangedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("userProfiles", {
        userId: user._id.toString(),
        slug: normalised,
        slugChangedAt: Date.now(),
      });
    }
  },
});
