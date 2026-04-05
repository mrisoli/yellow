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
import { useEffect, useState } from "react";
import { toast } from "sonner";
import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";

export const Route = createFileRoute("/event-types")({
  component: RouteComponent,
});

interface EventTypeForm {
  name: string;
  description: string;
  duration: number;
  smsReminderEnabled: boolean;
  smsReminderTimings: number[];
}

const SMS_TIMING_OPTIONS = [
  { label: "1 hour before", value: 60 },
  { label: "24 hours before", value: 1440 },
  { label: "1 week before", value: 10080 },
];

function EventTypeEditor() {
  const eventTypes = useQuery(api.eventTypes.getEventTypes);
  const createEventType = useMutation(api.eventTypes.createEventType);
  const updateEventType = useMutation(api.eventTypes.updateEventType);

  const [form, setForm] = useState<EventTypeForm>({
    name: "",
    description: "",
    duration: 30,
    smsReminderEnabled: false,
    smsReminderTimings: [60], // Default to 1 hour before
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleFormChange = (field: keyof EventTypeForm, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleSmsTiming = (timing: number) => {
    setForm((prev) => {
      const timings = prev.smsReminderTimings.includes(timing)
        ? prev.smsReminderTimings.filter((t) => t !== timing)
        : [...prev.smsReminderTimings, timing];
      return { ...prev, smsReminderTimings: timings };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingId) {
        await updateEventType({
          eventTypeId: editingId as any,
          ...form,
        });
        toast.success("Event type updated");
      } else {
        await createEventType(form);
        toast.success("Event type created");
      }

      setForm({
        name: "",
        description: "",
        duration: 30,
        smsReminderEnabled: false,
        smsReminderTimings: [60],
      });
      setEditingId(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save event type"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (eventTypes === undefined) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton className="h-32 w-full" key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create/Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>
            {editingId ? "Edit Event Type" : "Create New Event Type"}
          </CardTitle>
          <CardDescription>
            Set up the basic details and SMS reminder options
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Name */}
            <div>
              <Label htmlFor="name">Event Type Name</Label>
              <Input
                className="mt-1"
                id="name"
                onChange={(e) => handleFormChange("name", e.target.value)}
                placeholder="e.g., Consultation, Meeting"
                required
                type="text"
                value={form.name}
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <textarea
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm"
                id="description"
                onChange={(e) =>
                  handleFormChange("description", e.target.value)
                }
                placeholder="Brief description of the event type"
                rows={3}
                value={form.description}
              />
            </div>

            {/* Duration */}
            <div>
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                className="mt-1"
                id="duration"
                min="5"
                onChange={(e) =>
                  handleFormChange("duration", Number(e.target.value))
                }
                type="number"
                value={form.duration}
              />
            </div>

            {/* SMS Reminders */}
            <div className="space-y-4 rounded bg-blue-50 p-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={form.smsReminderEnabled}
                  id="sms-enabled"
                  onCheckedChange={(checked) =>
                    handleFormChange("smsReminderEnabled", checked)
                  }
                />
                <Label
                  className="cursor-pointer font-medium"
                  htmlFor="sms-enabled"
                >
                  Enable SMS Reminders
                </Label>
              </div>

              {form.smsReminderEnabled && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-700">
                    Select when to send SMS reminders:
                  </p>
                  {SMS_TIMING_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-center gap-2">
                      <Checkbox
                        checked={form.smsReminderTimings.includes(
                          option.value
                        )}
                        id={`sms-timing-${option.value}`}
                        onCheckedChange={() => toggleSmsTiming(option.value)}
                      />
                      <Label
                        className="cursor-pointer text-sm"
                        htmlFor={`sms-timing-${option.value}`}
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button disabled={isSubmitting} type="submit">
                {isSubmitting
                  ? "Saving..."
                  : editingId
                    ? "Update Event Type"
                    : "Create Event Type"}
              </Button>
              {editingId && (
                <Button
                  onClick={() => {
                    setEditingId(null);
                    setForm({
                      name: "",
                      description: "",
                      duration: 30,
                      smsReminderEnabled: false,
                      smsReminderTimings: [60],
                    });
                  }}
                  type="button"
                  variant="outline"
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Event Types List */}
      {eventTypes.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Your Event Types</h3>
          {eventTypes.map((eventType: any) => (
            <Card key={eventType._id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <h4 className="font-medium text-lg">{eventType.name}</h4>
                    {eventType.description && (
                      <p className="text-gray-600 text-sm">
                        {eventType.description}
                      </p>
                    )}
                    <p className="text-gray-500 text-sm">
                      Duration: {eventType.duration} minutes
                    </p>
                    {eventType.smsReminderEnabled && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-blue-600">
                          SMS Reminders enabled
                        </p>
                        <p className="text-gray-600 text-xs">
                          Timings: {eventType.smsReminderTimings.join(", ")} min
                          before
                        </p>
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={() => {
                      setEditingId(eventType._id);
                      setForm({
                        name: eventType.name,
                        description: eventType.description || "",
                        duration: eventType.duration,
                        smsReminderEnabled: eventType.smsReminderEnabled,
                        smsReminderTimings: eventType.smsReminderTimings,
                      });
                    }}
                    size="sm"
                    variant="outline"
                  >
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function RouteComponent() {
  const [showSignIn, setShowSignIn] = useState(false);

  return (
    <>
      <Authenticated>
        <div className="container mx-auto max-w-3xl px-4 py-8">
          <h1 className="mb-2 font-bold text-3xl">Event Types</h1>
          <p className="mb-6 text-muted-foreground text-sm">
            Manage your event types and configure SMS reminders for each type.
          </p>

          <EventTypeEditor />
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
        <div className="container mx-auto max-w-3xl px-4 py-8">
          <Skeleton className="mb-6 h-10 w-48" />
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <Skeleton className="h-32 w-full" key={i} />
            ))}
          </div>
        </div>
      </AuthLoading>
    </>
  );
}
