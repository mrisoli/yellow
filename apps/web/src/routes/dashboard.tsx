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
import EventTypeForm from "@/components/event-type-form";
import EventTypesList from "@/components/event-types-list";
import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";
import UserMenu from "@/components/user-menu";

export const Route = createFileRoute("/dashboard")({
  component: RouteComponent,
});

function RouteComponent() {
  const [showSignIn, setShowSignIn] = useState(false);
  const user = useQuery(api.auth.getCurrentUser);

  return (
    <>
      <Authenticated>
        <AuthenticatedDashboard user={user} />
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

interface AuthenticatedDashboardProps {
  user:
    | {
        name?: string;
        email?: string;
      }
    | null
    | undefined;
}

function AuthenticatedDashboard({ user }: AuthenticatedDashboardProps) {
  const firstName = user?.name?.split(" ")[0] || "User";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-foreground/10 border-b bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
          <div>
            <h1 className="font-bold text-3xl text-foreground">
              Welcome back, {firstName}
            </h1>
            <p className="mt-1 text-muted-foreground text-sm">
              Here's your appointment overview
            </p>
          </div>
          <UserMenu />
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Section */}
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <StatCard
            description="Scheduled for today"
            title="Today's Appointments"
            value="0"
          />
          <StatCard description="Next 7 days" title="Upcoming" value="—" />
          <StatCard
            description="All time"
            title="Total Appointments"
            value="0"
          />
        </div>

        {/* Upcoming Appointments Section */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Appointments</CardTitle>
              <CardDescription>No appointments scheduled yet</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="mb-4 text-muted-foreground">
                  You don't have any upcoming appointments. Create one to get
                  started!
                </p>
                <Button variant="default">New Appointment</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Event Types Section */}
        <div className="mb-8">
          <h2 className="mb-4 font-semibold text-foreground text-lg">
            Event Types
          </h2>
          <div className="grid gap-6 lg:grid-cols-2">
            <EventTypeForm />
            <EventTypesList />
          </div>
        </div>

        {/* Quick Actions Section */}
        <div>
          <h2 className="mb-4 font-semibold text-foreground text-lg">
            Quick Actions
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Button
              className="h-auto flex-col items-start justify-start px-4 py-4"
              variant="outline"
            >
              <span className="font-semibold">New Appointment</span>
              <span className="text-muted-foreground text-xs">
                Schedule a new appointment
              </span>
            </Button>
            <Button
              className="h-auto flex-col items-start justify-start px-4 py-4"
              variant="outline"
            >
              <span className="font-semibold">View Calendar</span>
              <span className="text-muted-foreground text-xs">
                See all your appointments
              </span>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

interface StatCardProps {
  description: string;
  title: string;
  value: string;
}

function StatCard({ title, value, description }: StatCardProps) {
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
