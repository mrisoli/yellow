import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { api } from "@yellow/backend/convex/_generated/api";
import { BookingWidget } from "@yellow/booking-widget";
import { env } from "@yellow/env/web";
import { useQuery } from "convex/react";
import { useEffect } from "react";

export const Route = createFileRoute("/$slug")({
  component: BookingPage,
});

function BookingPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();

  const result = useQuery(api.userProfiles.getPublicUserBySlug, { slug });
  const availability = useQuery(
    api.availability.getPublicAvailabilitySchedule,
    result ? { userId: result.userId } : "skip"
  );

  // Redirect to the canonical slug URL if the user reached us via a previous slug
  useEffect(() => {
    if (result?.isRedirect) {
      navigate({ to: "/$slug", params: { slug: result.slug }, replace: true });
    }
  }, [result, navigate]);

  // Loading state
  if (result === undefined) {
    return (
      <div className="flex min-h-[calc(100vh-70px)] items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  // Not found
  if (result === null) {
    return (
      <div className="flex min-h-[calc(100vh-70px)] flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="font-bold text-3xl">Page not found</h1>
        <p className="text-muted-foreground">
          The booking page{" "}
          <strong className="font-mono">/{slug}</strong> doesn't exist.
        </p>
      </div>
    );
  }

  const submitUrl = `${env.VITE_CONVEX_SITE_URL}/bookings`;

  return (
    <div className="flex min-h-[calc(100vh-70px)] flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="font-bold text-2xl">Book a meeting</h1>
          <p className="text-muted-foreground text-sm">
            Select a date and time that works for you.
          </p>
        </div>
        <BookingWidget
          availability={availability ?? undefined}
          submitUrl={submitUrl}
        />
      </div>
    </div>
  );
}
