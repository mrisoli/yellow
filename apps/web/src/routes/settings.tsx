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

function BookingUrlSection() {
  const profile = useQuery(api.userProfiles.getUserProfile);
  const setSlugMutation = useMutation(api.userProfiles.setUserSlug);

  const [slugInput, setSlugInput] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const currentSlug = profile?.slug ?? null;
  const publicUrl = currentSlug
    ? `${window.location.origin.replace(":5173", ":5174")}/${currentSlug}`
    : null;

  const handleEdit = () => {
    setSlugInput(currentSlug ?? "");
    setError(null);
    setSuccess(false);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
  };

  const handleSave = async () => {
    const trimmed = slugInput.trim().toLowerCase();
    if (!trimmed) {
      setError("Slug cannot be empty");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await setSlugMutation({ slug: trimmed });
      setSuccess(true);
      setIsEditing(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save slug");
    } finally {
      setSaving(false);
    }
  };

  if (profile === undefined) {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking URL</CardTitle>
        <CardDescription>
          Customize your personal booking link. Share this URL so clients can
          book time with you.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isEditing ? (
          <>
            {currentSlug ? (
              <div className="space-y-2">
                <Label>Your booking URL</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded bg-muted px-3 py-2 font-mono text-sm break-all">
                    {publicUrl}
                  </code>
                  <Button
                    onClick={() => {
                      if (publicUrl) {
                        navigator.clipboard.writeText(publicUrl);
                      }
                    }}
                    size="sm"
                    variant="outline"
                    type="button"
                  >
                    Copy
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                You haven't set a custom booking URL yet.
              </p>
            )}
            {success && (
              <p className="text-green-600 text-sm">
                Booking URL saved successfully!
              </p>
            )}
            <Button onClick={handleEdit} variant="outline" type="button">
              {currentSlug ? "Change URL slug" : "Set booking URL slug"}
            </Button>
          </>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="slug">URL slug</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm whitespace-nowrap">
                  yellow.app/
                </span>
                <Input
                  id="slug"
                  value={slugInput}
                  onChange={(e) => {
                    setSlugInput(e.target.value.toLowerCase());
                    setError(null);
                  }}
                  placeholder="your-name"
                  maxLength={30}
                  pattern="[a-z0-9-]+"
                  autoFocus
                />
              </div>
              <p className="text-muted-foreground text-xs">
                2–30 characters. Lowercase letters, numbers, and hyphens only.
              </p>
            </div>

            {error && <p className="text-destructive text-sm">{error}</p>}

            <div className="flex gap-2">
              <Button
                disabled={saving}
                onClick={handleSave}
                type="button"
              >
                {saving ? "Saving…" : "Save"}
              </Button>
              <Button
                disabled={saving}
                onClick={handleCancel}
                variant="ghost"
                type="button"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

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

            {/* Booking URL Section */}
            <BookingUrlSection />

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
