import { createFileRoute } from "@tanstack/react-router";
import { api } from "@yellow/backend/convex/_generated/api";
import { Button } from "@yellow/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@yellow/ui/components/card";
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
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-4" />
            <p className="text-foreground">Loading...</p>
          </div>
        </div>
      </AuthLoading>
    </>
  );
}

interface AuthenticatedDashboardProps {
  user: {
    name?: string;
    email?: string;
  } | null | undefined;
}

function AuthenticatedDashboard({ user }: AuthenticatedDashboardProps) {
  const firstName = user?.name?.split(" ")[0] || "User";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-foreground/10 bg-card">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Welcome back, {firstName}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
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
            title="Today's Appointments"
            value="0"
            description="Scheduled for today"
          />
          <StatCard
            title="Upcoming"
            value="—"
            description="Next 7 days"
          />
          <StatCard
            title="Total Appointments"
            value="0"
            description="All time"
          />
        </div>

        {/* Upcoming Appointments Section */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Appointments</CardTitle>
              <CardDescription>
                No appointments scheduled yet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground mb-4">
                  You don't have any upcoming appointments. Create one to get started!
                </p>
                <Button variant="default">
                  New Appointment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Section */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Quick Actions
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Button variant="outline" className="h-auto flex-col items-start justify-start py-4 px-4">
              <span className="font-semibold">New Appointment</span>
              <span className="text-xs text-muted-foreground">Schedule a new appointment</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col items-start justify-start py-4 px-4">
              <span className="font-semibold">View Calendar</span>
              <span className="text-xs text-muted-foreground">See all your appointments</span>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  description: string;
}

function StatCard({ title, value, description }: StatCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-foreground mb-2">
          {value}
        </div>
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
