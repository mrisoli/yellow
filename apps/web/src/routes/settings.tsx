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
import { Checkbox } from "@yellow/ui/components/checkbox";
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

            {/* Notifications Section */}
            <NotificationSettingsCard />

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

function NotificationSettingsCard() {
  const settings = useQuery(api.notifications.getNotificationSettings);
  const saveSettings = useMutation(api.notifications.setNotificationSettings);

  const [emailConfirmationEnabled, setEmailConfirmationEnabled] = useState<
    boolean | null
  >(null);
  const [reminderEnabled, setReminderEnabled] = useState<boolean | null>(null);
  const [reminderHoursBefore, setReminderHoursBefore] = useState<number | null>(
    null
  );
  const [smsReminderEnabled, setSmsReminderEnabled] = useState<boolean | null>(
    null
  );
  const [followUpEnabled, setFollowUpEnabled] = useState<boolean | null>(null);
  const [followUpHoursAfter, setFollowUpHoursAfter] = useState<number | null>(
    null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const resolved = {
    emailConfirmationEnabled:
      emailConfirmationEnabled ?? settings?.emailConfirmationEnabled ?? true,
    reminderEnabled: reminderEnabled ?? settings?.reminderEnabled ?? true,
    reminderHoursBefore:
      reminderHoursBefore ?? settings?.reminderHoursBefore ?? 24,
    smsReminderEnabled:
      smsReminderEnabled ?? settings?.smsReminderEnabled ?? false,
    followUpEnabled: followUpEnabled ?? settings?.followUpEnabled ?? false,
    followUpHoursAfter: followUpHoursAfter ?? settings?.followUpHoursAfter ?? 1,
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await saveSettings(resolved);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  if (settings === undefined) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="mt-2 h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>
          Configure automated email and SMS notifications for your attendees
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Confirmation email */}
        <div className="flex items-start gap-3">
          <Checkbox
            checked={resolved.emailConfirmationEnabled}
            id="email-confirmation"
            onCheckedChange={(checked) =>
              setEmailConfirmationEnabled(checked === true)
            }
          />
          <div className="space-y-1">
            <Label className="cursor-pointer" htmlFor="email-confirmation">
              Booking confirmation email
            </Label>
            <p className="text-muted-foreground text-sm">
              Send an email to attendees immediately after they book
            </p>
          </div>
        </div>

        {/* Reminder email */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Checkbox
              checked={resolved.reminderEnabled}
              id="reminder-email"
              onCheckedChange={(checked) =>
                setReminderEnabled(checked === true)
              }
            />
            <div className="space-y-1">
              <Label className="cursor-pointer" htmlFor="reminder-email">
                Reminder email
              </Label>
              <p className="text-muted-foreground text-sm">
                Send a reminder email before the meeting
              </p>
            </div>
          </div>
          {resolved.reminderEnabled && (
            <div className="ml-7 flex items-center gap-2">
              <Input
                className="w-20"
                id="reminder-hours"
                max={168}
                min={1}
                onChange={(e) => setReminderHoursBefore(Number(e.target.value))}
                type="number"
                value={resolved.reminderHoursBefore}
              />
              <Label htmlFor="reminder-hours">hours before meeting</Label>
            </div>
          )}
        </div>

        {/* SMS reminder */}
        <div className="flex items-start gap-3">
          <Checkbox
            checked={resolved.smsReminderEnabled}
            id="sms-reminder"
            onCheckedChange={(checked) =>
              setSmsReminderEnabled(checked === true)
            }
          />
          <div className="space-y-1">
            <Label className="cursor-pointer" htmlFor="sms-reminder">
              SMS reminder
            </Label>
            <p className="text-muted-foreground text-sm">
              Send an SMS reminder (requires Twilio credentials and attendee
              phone number)
            </p>
          </div>
        </div>

        {/* Follow-up email */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Checkbox
              checked={resolved.followUpEnabled}
              id="follow-up-email"
              onCheckedChange={(checked) =>
                setFollowUpEnabled(checked === true)
              }
            />
            <div className="space-y-1">
              <Label className="cursor-pointer" htmlFor="follow-up-email">
                Follow-up email
              </Label>
              <p className="text-muted-foreground text-sm">
                Send a follow-up email after the meeting concludes
              </p>
            </div>
          </div>
          {resolved.followUpEnabled && (
            <div className="ml-7 flex items-center gap-2">
              <Input
                className="w-20"
                id="followup-hours"
                max={72}
                min={0}
                onChange={(e) => setFollowUpHoursAfter(Number(e.target.value))}
                type="number"
                value={resolved.followUpHoursAfter}
              />
              <Label htmlFor="followup-hours">hours after meeting</Label>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button disabled={isSaving} onClick={handleSave}>
            {isSaving ? "Saving..." : "Save Notification Settings"}
          </Button>
          {saveSuccess && (
            <span className="text-green-600 text-sm">Settings saved!</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
