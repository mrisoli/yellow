import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { api } from "@yellow/backend/convex/_generated/api";
import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
  useQuery,
} from "convex/react";
import { useState } from "react";

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
          <h1 className="mb-6 text-3xl font-bold">Settings</h1>

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
                      id="name"
                      type="text"
                      value={user?.name ?? ""}
                      disabled
                      placeholder="Your name"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  {user === undefined ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Input
                      id="email"
                      type="email"
                      value={user?.email ?? ""}
                      disabled
                      placeholder="your@email.com"
                    />
                  )}
                </div>

                <Button variant="outline" disabled>
                  Edit Profile
                </Button>
              </CardContent>
            </Card>

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
          <h1 className="mb-6 text-3xl font-bold">Settings</h1>
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
