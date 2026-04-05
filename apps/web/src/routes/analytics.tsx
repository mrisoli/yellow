import { createFileRoute } from "@tanstack/react-router";
import { api } from "@yellow/backend/convex/_generated/api";
import { Button } from "@yellow/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@yellow/ui/components/card";
import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
  useQuery,
} from "convex/react";
import { useState } from "react";

import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";
import UserMenu from "@/components/user-menu";

export const Route = createFileRoute("/analytics")({
  component: RouteComponent,
});

function RouteComponent() {
  const [showSignIn, setShowSignIn] = useState(false);
  const user = useQuery(api.auth.getCurrentUser);

  return (
    <>
      <Authenticated>
        <AuthenticatedAnalytics user={user} />
      </Authenticated>
      <Unauthenticated>
        {showSignIn ? (
          <SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
        ) : (
          <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
        )}
      </Unauthenticated>
      <AuthLoading>
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-foreground">Loading...</p>
          </div>
        </div>
      </AuthLoading>
    </>
  );
}

interface AuthenticatedAnalyticsProps {
  user:
    | {
        name?: string;
        email?: string;
      }
    | null
    | undefined;
}

function AuthenticatedAnalytics({ user }: AuthenticatedAnalyticsProps) {
  const firstName = user?.name?.split(" ")[0] || "User";
  const bookingStats = useQuery(api.bookings.getBookingStatistics);
  const popularTimeSlots = useQuery(api.bookings.getPopularTimeSlots);
  const popularDays = useQuery(api.bookings.getPopularDays);
  const bookingsTrend = useQuery(api.bookings.getBookingsTrend, { days: 30 });
  const attendeeStats = useQuery(api.bookings.getAttendeeStatistics);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-foreground/10 border-b bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
          <div>
            <h1 className="font-bold text-3xl text-foreground">
              Booking Analytics
            </h1>
            <p className="mt-1 text-muted-foreground text-sm">
              Track your booking trends, rates, and attendee insights
            </p>
          </div>
          <UserMenu />
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Key Metrics Section */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            title="Total Bookings"
            value={bookingStats?.confirmedBookings ?? 0}
            description="Confirmed bookings"
          />
          <MetricCard
            title="Cancellation Rate"
            value={`${bookingStats?.cancellationRate ?? 0}%`}
            description="Percentage of cancelled bookings"
          />
          <MetricCard
            title="No-Show Rate"
            value={`${bookingStats?.noShowRate ?? 0}%`}
            description="Percentage of no-shows"
          />
          <MetricCard
            title="New Attendees"
            value={attendeeStats?.newAttendees ?? 0}
            description="First-time bookers"
          />
          <MetricCard
            title="Returning Attendees"
            value={attendeeStats?.returningAttendees ?? 0}
            description="Repeat bookings"
          />
          <MetricCard
            title="Repeat Booking Rate"
            value={`${attendeeStats?.repeatBookingRate ?? 0}%`}
            description="Percentage of returning attendees"
          />
        </div>

        {/* Detailed Stats Grid */}
        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          {/* Popular Time Slots */}
          <Card>
            <CardHeader>
              <CardTitle>Popular Time Slots</CardTitle>
              <CardDescription>
                Most frequently booked time slots
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!popularTimeSlots || popularTimeSlots.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No bookings yet
                </p>
              ) : (
                <div className="space-y-3">
                  {popularTimeSlots.map((slot, index) => (
                    <div
                      key={`${slot.time}-${index}`}
                      className="flex items-center justify-between border-b pb-2 last:border-b-0"
                    >
                      <span className="font-medium text-foreground">
                        {slot.time}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        {slot.count} booking{slot.count !== 1 ? "s" : ""}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Popular Days */}
          <Card>
            <CardHeader>
              <CardTitle>Popular Days</CardTitle>
              <CardDescription>
                Most frequently booked days of the week
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!popularDays || popularDays.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No bookings yet
                </p>
              ) : (
                <div className="space-y-3">
                  {popularDays.map((day, index) => (
                    <div
                      key={`${day.day}-${index}`}
                      className="flex items-center justify-between border-b pb-2 last:border-b-0"
                    >
                      <span className="font-medium text-foreground">
                        {day.day}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        {day.count} booking{day.count !== 1 ? "s" : ""}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Booking Trends Over Time */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Booking Trends</CardTitle>
            <CardDescription>Bookings over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {!bookingsTrend || bookingsTrend.length === 0 ? (
              <p className="text-muted-foreground text-sm">No bookings yet</p>
            ) : (
              <div className="space-y-3">
                {bookingsTrend.map((item, index) => {
                  const maxCount = Math.max(
                    ...bookingsTrend.map((t) => t.count)
                  );
                  const percentage = (item.count / maxCount) * 100;
                  return (
                    <div
                      key={`${item.date}-${index}`}
                      className="flex items-center gap-2"
                    >
                      <span className="w-20 font-medium text-foreground text-sm">
                        {item.date}
                      </span>
                      <div className="flex flex-1 items-center gap-2">
                        <div
                          className="h-8 rounded bg-primary"
                          style={{
                            width: `${Math.max(20, percentage)}px`,
                          }}
                        />
                        <span className="text-muted-foreground text-sm">
                          {item.count}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detailed Metrics */}
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Booking Status Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Booking Status</CardTitle>
              <CardDescription>Breakdown of all booking statuses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-foreground">Confirmed</span>
                  <span className="font-medium text-foreground">
                    {bookingStats?.confirmedBookings ?? 0}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-foreground">Cancelled</span>
                  <span className="font-medium text-foreground">
                    {bookingStats?.cancelledBookings ?? 0}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-foreground">No-Show</span>
                  <span className="font-medium text-foreground">
                    {bookingStats?.noShowBookings ?? 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground">Rescheduled</span>
                  <span className="font-medium text-foreground">
                    {bookingStats?.rescheduleRequests ?? 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attendee Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Attendees</CardTitle>
              <CardDescription>New vs returning attendees</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-foreground">Unique Attendees</span>
                  <span className="font-medium text-foreground">
                    {attendeeStats?.totalAttendees ?? 0}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-foreground">New</span>
                  <span className="font-medium text-foreground">
                    {attendeeStats?.newAttendees ?? 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground">Returning</span>
                  <span className="font-medium text-foreground">
                    {attendeeStats?.returningAttendees ?? 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="mb-4 font-semibold text-foreground text-lg">
            Quick Actions
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Button
              className="h-auto flex-col items-start justify-start px-4 py-4"
              variant="outline"
            >
              <span className="font-semibold">View All Bookings</span>
              <span className="text-muted-foreground text-xs">
                See detailed booking list
              </span>
            </Button>
            <Button
              className="h-auto flex-col items-start justify-start px-4 py-4"
              variant="outline"
            >
              <span className="font-semibold">Download Report</span>
              <span className="text-muted-foreground text-xs">
                Export analytics data
              </span>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

interface MetricCardProps {
  description: string;
  title: string;
  value: string | number;
}

function MetricCard({ title, value, description }: MetricCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-medium text-muted-foreground text-sm">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-2 font-bold text-3xl text-foreground">{value}</div>
        <p className="text-muted-foreground text-xs">{description}</p>
      </CardContent>
    </Card>
  );
}
