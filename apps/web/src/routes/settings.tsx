import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { api } from "@yellow/backend/convex/_generated/api";
import { Button } from "@yellow/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@yellow/ui/components/card";
import { Input } from "@yellow/ui/components/input";
import { Label } from "@yellow/ui/components/label";
import { Skeleton } from "@yellow/ui/components/skeleton";
import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
  useAction,
  useMutation,
  useQuery,
} from "convex/react";
import { useEffect, useState } from "react";
import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/settings")({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>) => ({
    calendarConnected: search.calendarConnected as string | undefined,
    calendarError: search.calendarError as string | undefined,
  }),
});

// ---------------------------------------------------------------------------
// Calendar provider metadata
// ---------------------------------------------------------------------------

interface CalendarProvider {
  id: "google" | "outlook";
  name: string;
  description: string;
}

const CALENDAR_PROVIDERS: CalendarProvider[] = [
  {
    id: "google",
    name: "Google Calendar",
    description: "Sync availability from your Google Calendar account.",
  },
  {
    id: "outlook",
    name: "Outlook / Office 365",
    description: "Sync availability from your Microsoft Outlook calendar.",
  },
];

// ---------------------------------------------------------------------------
// Calendar integrations card
// ---------------------------------------------------------------------------

function CalendarIntegrationsCard() {
  const connections = useQuery(api.calendar.listCalendarConnections);
  const getAuthUrl = useAction(api.calendar.getCalendarAuthUrl);
  const removeConnection = useMutation(api.calendar.removeCalendarConnection);
  const syncBusyTimes = useAction(api.calendar.syncCalendarBusyTimes);

  const [loadingProvider, setLoadingProvider] = useState<
    "google" | "outlook" | null
  >(null);
  const [syncingProvider, setSyncingProvider] = useState<
    "google" | "outlook" | null
  >(null);
  const [removingProvider, setRemovingProvider] = useState<
    "google" | "outlook" | null
  >(null);

  const connectedIds = new Set(connections?.map((c) => c.provider) ?? []);

  const handleConnect = async (provider: "google" | "outlook") => {
    setLoadingProvider(provider);
    try {
      const url = await getAuthUrl({ provider });
      window.location.href = url;
    } catch {
      setLoadingProvider(null);
    }
  };

  const handleDisconnect = async (provider: "google" | "outlook") => {
    setRemovingProvider(provider);
    try {
      await removeConnection({ provider });
    } finally {
      setRemovingProvider(null);
    }
  };

  const handleSync = async (provider: "google" | "outlook") => {
    setSyncingProvider(provider);
    try {
      await syncBusyTimes({});
    } finally {
      setSyncingProvider(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendar Integrations</CardTitle>
        <CardDescription>
          Connect external calendars to automatically block off busy times and
          prevent double bookings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {connections === undefined ? (
          <Skeleton className="h-16 w-full" />
        ) : (
          CALENDAR_PROVIDERS.map((provider) => {
            const connection = connections.find(
              (c) => c.provider === provider.id
            );
            const isConnected = connectedIds.has(provider.id);
            const isLoading = loadingProvider === provider.id;
            const isSyncing = syncingProvider === provider.id;
            const isRemoving = removingProvider === provider.id;

            return (
              <div
                key={provider.id}
                className="flex items-start justify-between gap-4 rounded-lg border p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm">{provider.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {provider.description}
                  </p>
                  {connection && (
                    <p className="mt-1 truncate text-muted-foreground text-xs">
                      Connected as{" "}
                      <span className="font-medium">
                        {connection.accountEmail}
                      </span>
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 gap-2">
                  {isConnected ? (
                    <>
                      <Button
                        disabled={isSyncing || isRemoving}
                        onClick={() => handleSync(provider.id)}
                        size="sm"
                        variant="outline"
                      >
                        {isSyncing ? "Syncing…" : "Sync now"}
                      </Button>
                      <Button
                        disabled={isSyncing || isRemoving}
                        onClick={() => handleDisconnect(provider.id)}
                        size="sm"
                        variant="destructive"
                      >
                        {isRemoving ? "Removing…" : "Disconnect"}
                      </Button>
                    </>
                  ) : (
                    <Button
                      disabled={isLoading}
                      onClick={() => handleConnect(provider.id)}
                      size="sm"
                      variant="outline"
                    >
                      {isLoading ? "Redirecting…" : "Connect"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main route component
// ---------------------------------------------------------------------------

function RouteComponent() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/settings" });
  const [showSignIn, setShowSignIn] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const user = useQuery(api.auth.getCurrentUser);

  // Show feedback after OAuth redirect
  useEffect(() => {
    if (search.calendarConnected) {
      const providerName =
        search.calendarConnected === "google" ? "Google Calendar" : "Outlook";
      setStatusMessage({
        type: "success",
        text: `${providerName} connected successfully.`,
      });
      void navigate({ to: "/settings", replace: true });
    } else if (search.calendarError) {
      const messages: Record<string, string> = {
        access_denied: "Calendar access was denied.",
        state_expired: "The connection request expired. Please try again.",
        token_exchange_failed:
          "Failed to connect the calendar. Please try again.",
      };
      setStatusMessage({
        type: "error",
        text: messages[search.calendarError] ?? "Calendar connection failed.",
      });
      void navigate({ to: "/settings", replace: true });
    }
  }, [search.calendarConnected, search.calendarError, navigate]);

  const handleSignOut = () => {
    authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          void navigate({ to: "/dashboard" });
        },
      },
    });
  };

  return (
    <>
      <Authenticated>
        <div className="container mx-auto max-w-2xl px-4 py-8">
          <h1 className="mb-6 font-bold text-3xl">Settings</h1>

          {statusMessage && (
            <div
              className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
                statusMessage.type === "success"
                  ? "border-green-200 bg-green-50 text-green-800"
                  : "border-red-200 bg-red-50 text-red-800"
              }`}
              role="alert"
            >
              {statusMessage.text}
            </div>
          )}

          <div className="space-y-6">
            {/* Profile Section */}
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>
                  Manage your profile information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  {user === undefined ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Input
                      disabled
                      id="name"
                      placeholder="Your name"
                      type="text"
                      value={user?.name ?? ""}
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  {user === undefined ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Input
                      disabled
                      id="email"
                      placeholder="your@email.com"
                      type="email"
                      value={user?.email ?? ""}
                    />
                  )}
                </div>

                <Button disabled variant="outline">
                  Edit Profile
                </Button>
              </CardContent>
            </Card>

            {/* Calendar Integrations Section */}
            <CalendarIntegrationsCard />

            {/* Appearance Section */}
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>
                  Customize how the app looks to you
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Theme settings coming soon
                </p>
              </CardContent>
            </Card>

            {/* Account Section */}
            <Card>
              <CardHeader>
                <CardTitle>Account</CardTitle>
                <CardDescription>
                  Manage your account and sign out
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleSignOut} variant="destructive">
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </Authenticated>

      <Unauthenticated>
        <div className="container mx-auto max-w-md px-4 py-8">
          {showSignIn ? (
            <SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
          ) : (
            <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
          )}
        </div>
      </Unauthenticated>

      <AuthLoading>
        <div className="container mx-auto max-w-2xl px-4 py-8">
          <h1 className="mb-6 font-bold text-3xl">Settings</h1>
          <div className="space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="mt-2 h-4 w-48" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AuthLoading>
    </>
  );
}
