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
import { toast } from "sonner";
import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";
import UserMenu from "@/components/user-menu";

export const Route = createFileRoute("/group-meetings")({
  component: RouteComponent,
});

function RouteComponent() {
  const [showSignIn, setShowSignIn] = useState(false);
  const user = useQuery(api.auth.getCurrentUser);

  return (
    <>
      <Authenticated>
        <AuthenticatedGroupMeetings user={user} />
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

interface AuthenticatedGroupMeetingsProps {
  user:
    | {
        name?: string;
        email?: string;
      }
    | null
    | undefined;
}

function AuthenticatedGroupMeetings({
  user,
}: AuthenticatedGroupMeetingsProps) {
  const firstName = user?.name?.split(" ")[0] || "User";
  const [showCreateForm, setShowCreateForm] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-foreground/10 border-b bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
          <div>
            <h1 className="font-bold text-3xl text-foreground">
              Group Meetings
            </h1>
            <p className="mt-1 text-muted-foreground text-sm">
              Schedule group meetings and gather availability with polls
            </p>
          </div>
          <UserMenu />
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {showCreateForm ? (
          <CreateGroupMeetingForm
            onSuccess={() => {
              setShowCreateForm(false);
              toast.success("Group meeting created successfully!");
            }}
            onCancel={() => setShowCreateForm(false)}
          />
        ) : (
          <>
            <div className="mb-8">
              <Button
                onClick={() => setShowCreateForm(true)}
                className="mb-4"
                size="lg"
              >
                Create Group Meeting
              </Button>
            </div>

            <GroupMeetingsList />
          </>
        )}
      </main>
    </div>
  );
}

interface Attendee {
  name: string;
  email: string;
}

function CreateGroupMeetingForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void;
  onCancel: () => void;
}): JSX.Element {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [attendees, setAttendees] = useState<Attendee[]>([
    { name: "", email: "" },
  ]);
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createMeeting = useMutation(api.groupMeetings.createGroupMeeting);

  const addAttendee = () => {
    setAttendees([...attendees, { name: "", email: "" }]);
  };

  const updateAttendee = (
    index: number,
    field: keyof Attendee,
    value: string
  ) => {
    const newAttendees = [...attendees];
    newAttendees[index] = { ...newAttendees[index], [field]: value };
    setAttendees(newAttendees);
  };

  const removeAttendee = (index: number) => {
    setAttendees(attendees.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Meeting title is required");
      return;
    }

    const validAttendees = attendees.filter(
      (a) => a.name.trim() && a.email.trim()
    );
    if (validAttendees.length === 0) {
      toast.error("At least one attendee is required");
      return;
    }

    setIsSubmitting(true);
    try {
      await createMeeting({
        title: title.trim(),
        description: description.trim() || undefined,
        attendees: validAttendees,
        durationMinutes,
      });
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create meeting"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Create Group Meeting</CardTitle>
        <CardDescription>
          Set up a new group meeting and add attendees
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Meeting Title</Label>
            <Input
              id="title"
              placeholder="Team Sync"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              placeholder="Discuss Q2 goals and roadmap"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              min="15"
              max="480"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              disabled={isSubmitting}
            />
          </div>

          {/* Attendees */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Attendees</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addAttendee}
                disabled={isSubmitting}
              >
                Add Attendee
              </Button>
            </div>

            {attendees.map((attendee, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="Name"
                  value={attendee.name}
                  onChange={(e) =>
                    updateAttendee(index, "name", e.target.value)
                  }
                  disabled={isSubmitting}
                />
                <Input
                  placeholder="Email"
                  type="email"
                  value={attendee.email}
                  onChange={(e) =>
                    updateAttendee(index, "email", e.target.value)
                  }
                  disabled={isSubmitting}
                />
                {attendees.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => removeAttendee(index)}
                    disabled={isSubmitting}
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Meeting"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function GroupMeetingsList(): JSX.Element {
  const meetings = useQuery(api.groupMeetings.getGroupMeetingsByOrganizer);

  if (meetings === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Group Meetings</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!meetings || meetings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Group Meetings</CardTitle>
          <CardDescription>No group meetings yet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="mb-4 text-muted-foreground">
              Create your first group meeting to get started!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-foreground text-lg">
        Your Group Meetings
      </h2>
      {meetings.map((meeting) => (
        <GroupMeetingCard key={meeting._id} meeting={meeting} />
      ))}
    </div>
  );
}

interface GroupMeetingCardProps {
  meeting: {
    _id: string;
    title: string;
    description?: string;
    attendees: Array<{ name: string; email: string }>;
    status: string;
    durationMinutes: number;
    confirmedDate?: string;
    confirmedTime?: string;
  };
}

function GroupMeetingCard({ meeting }: GroupMeetingCardProps): JSX.Element {
  const getStatusBadge = (status: string) => {
    const statusStyles: Record<string, { bg: string; text: string }> = {
      draft: { bg: "bg-gray-100", text: "text-gray-800" },
      poll_active: { bg: "bg-blue-100", text: "text-blue-800" },
      confirmed: { bg: "bg-green-100", text: "text-green-800" },
      cancelled: { bg: "bg-red-100", text: "text-red-800" },
      completed: { bg: "bg-purple-100", text: "text-purple-800" },
    };

    const style = statusStyles[status] || statusStyles.draft;

    return (
      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${style.bg} ${style.text}`}>
        {status.replace("_", " ").charAt(0).toUpperCase() +
          status.replace("_", " ").slice(1)}
      </span>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{meeting.title}</CardTitle>
            {meeting.description && (
              <CardDescription>{meeting.description}</CardDescription>
            )}
          </div>
          {getStatusBadge(meeting.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground text-sm">Duration</p>
            <p className="font-medium">{meeting.durationMinutes} minutes</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Attendees</p>
            <p className="font-medium">{meeting.attendees.length} invited</p>
          </div>
          {meeting.confirmedDate && (
            <div>
              <p className="text-muted-foreground text-sm">Date & Time</p>
              <p className="font-medium">
                {meeting.confirmedDate} at {meeting.confirmedTime}
              </p>
            </div>
          )}
        </div>

        <div>
          <p className="text-muted-foreground text-sm mb-2">Attendees</p>
          <ul className="space-y-1">
            {meeting.attendees.map((attendee) => (
              <li key={attendee.email} className="text-sm">
                {attendee.name} ({attendee.email})
              </li>
            ))}
          </ul>
        </div>

        <div className="flex gap-2 pt-4">
          {meeting.status === "draft" && (
            <Button size="sm" variant="outline">
              Create Poll
            </Button>
          )}
          {meeting.status === "poll_active" && (
            <Button size="sm" variant="outline">
              View Poll Results
            </Button>
          )}
          <Button size="sm" variant="ghost">
            Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
