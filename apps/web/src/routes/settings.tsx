import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
  useMutation,
  useQuery,
} from "convex/react";
import { useState } from "react";
import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/settings")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const [showSignIn, setShowSignIn] = useState(false);
  const user = useQuery(api.auth.getCurrentUser);

  const handleSignOut = () => {
    authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          navigate({
            to: "/dashboard",
          });
        },
      },
    });
  };

  return (
    <>
      <Authenticated>
        <div className="container mx-auto max-w-2xl px-4 py-8">
          <h1 className="mb-6 font-bold text-3xl">Settings</h1>

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

            {/* Payments Section */}
            <PayPalIntegrationCard />

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
            {[1, 2, 3].map((i) => (
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

function PayPalIntegrationCard() {
  const integration = useQuery(api.paypal.getPaypalIntegration);
  const saveIntegration = useMutation(api.paypal.savePaypalIntegration);
  const disconnect = useMutation(api.paypal.disconnectPaypal);

  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [environment, setEnvironment] = useState<"sandbox" | "live">("sandbox");
  const [isSaving, setIsSaving] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (integration === undefined) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="mt-2 h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  const handleSave = async () => {
    if (!clientId.trim() || !clientSecret.trim()) {
      setError("Client ID and Client Secret are required.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      await saveIntegration({ clientId: clientId.trim(), clientSecret: clientSecret.trim(), environment });
      setSaveSuccess(true);
      setClientId("");
      setClientSecret("");
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save PayPal credentials.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    setError(null);
    try {
      await disconnect();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disconnect PayPal.");
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payments</CardTitle>
        <CardDescription>
          Connect your PayPal business account to accept payments at booking time
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
          <div className="mb-2 flex items-center gap-2">
            <span className="font-semibold text-blue-900">PayPal</span>
            {integration && (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-green-800 text-xs font-medium">
                Connected
              </span>
            )}
          </div>

          {integration ? (
            <div className="space-y-3">
              <div className="text-sm text-blue-800">
                <p>
                  <span className="font-medium">Client ID:</span>{" "}
                  {integration.clientId.slice(0, 12)}…
                </p>
                <p>
                  <span className="font-medium">Environment:</span>{" "}
                  {integration.environment === "live" ? "Live" : "Sandbox"}
                </p>
                <p>
                  <span className="font-medium">Connected:</span>{" "}
                  {new Date(integration.connectedAt).toLocaleDateString()}
                </p>
              </div>

              <p className="text-sm text-gray-600">
                To update your credentials, disconnect and reconnect with the new
                Client ID and Secret.
              </p>

              <div className="flex items-center gap-2 pt-1">
                <Button
                  disabled={isDisconnecting}
                  onClick={handleDisconnect}
                  size="sm"
                  variant="destructive"
                >
                  {isDisconnecting ? "Disconnecting…" : "Disconnect PayPal"}
                </Button>
                {saveSuccess && (
                  <span className="text-green-600 text-sm">Disconnected.</span>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Connect your PayPal business account to let invitees pay when they book
                a paid event type. You'll need your PayPal app's{" "}
                <strong>Client ID</strong> and <strong>Client Secret</strong> from the{" "}
                <a
                  className="underline"
                  href="https://developer.paypal.com/dashboard/"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  PayPal Developer Dashboard
                </a>
                .
              </p>

              <div className="space-y-3">
                <div>
                  <Label className="text-sm" htmlFor="paypal-env">
                    Environment
                  </Label>
                  <select
                    className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm"
                    id="paypal-env"
                    onChange={(e) =>
                      setEnvironment(e.target.value as "sandbox" | "live")
                    }
                    value={environment}
                  >
                    <option value="sandbox">Sandbox (testing)</option>
                    <option value="live">Live (production)</option>
                  </select>
                </div>

                <div>
                  <Label className="text-sm" htmlFor="paypal-client-id">
                    Client ID
                  </Label>
                  <Input
                    className="mt-1"
                    id="paypal-client-id"
                    onChange={(e) => setClientId(e.target.value)}
                    placeholder="AaBbCcDd..."
                    type="text"
                    value={clientId}
                  />
                </div>

                <div>
                  <Label className="text-sm" htmlFor="paypal-client-secret">
                    Client Secret
                  </Label>
                  <Input
                    className="mt-1"
                    id="paypal-client-secret"
                    onChange={(e) => setClientSecret(e.target.value)}
                    placeholder="EeFfGgHh..."
                    type="password"
                    value={clientSecret}
                  />
                </div>
              </div>

              {error && (
                <p className="text-red-600 text-sm">{error}</p>
              )}

              <div className="flex items-center gap-3">
                <Button disabled={isSaving} onClick={handleSave} size="sm">
                  {isSaving ? "Saving…" : "Connect PayPal"}
                </Button>
                {saveSuccess && (
                  <span className="text-green-600 text-sm">
                    PayPal connected!
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
