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

export const Route = createFileRoute("/group-meetings/$id/poll")({
  component: RouteComponent,
});

interface RouteParams {
  id: string;
}

function RouteComponent() {
  const params = Route.useParams() as RouteParams;
  const [showSignIn, setShowSignIn] = useState(false);
  const user = useQuery(api.auth.getCurrentUser);

  return (
    <>
      <Authenticated>
        <PollPage pollId={params.id} user={user} />
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

interface User {
  email?: string;
  name?: string;
}

interface PollPageProps {
  pollId: string;
  user: User | null | undefined;
}

function PollPage({ pollId, user }: PollPageProps): JSX.Element {
  const poll = useQuery(api.groupMeetings.getMeetingPoll, { pollId });
  const firstName = user?.name?.split(" ")[0] || "User";

  if (poll === undefined) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-foreground/10 border-b bg-card">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
            <h1 className="font-bold text-3xl text-foreground">
              Meeting Poll
            </h1>
            <UserMenu />
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Card>
            <CardHeader>
              <CardTitle>Loading poll...</CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-foreground/10 border-b bg-card">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
            <h1 className="font-bold text-3xl text-foreground">
              Meeting Poll
            </h1>
            <UserMenu />
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Card>
            <CardHeader>
              <CardTitle>Poll Not Found</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                The poll you're looking for doesn't exist.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-foreground/10 border-b bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
          <div>
            <h1 className="font-bold text-3xl text-foreground">{poll.title}</h1>
            <p className="mt-1 text-muted-foreground text-sm">
              What time works best for everyone?
            </p>
          </div>
          {user && <UserMenu />}
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {poll.status === "active" && user?.email ? (
          <PollVotingForm poll={poll} attendeeEmail={user.email} />
        ) : (
          <PollResults poll={poll} />
        )}
      </main>
    </div>
  );
}

interface PollOption {
  date: string;
  time: string;
  startTime: number;
}

interface PollData {
  _id: string;
  title: string;
  status: string;
  expiresAt: number;
  pollOptions: PollOption[];
  voteCount: number[];
  respondentCount: number;
  attendees: Array<{ name: string; email: string }>;
  durationMinutes: number;
}

interface PollVotingFormProps {
  poll: PollData;
  attendeeEmail: string;
}

function PollVotingForm({
  poll,
  attendeeEmail,
}: PollVotingFormProps): JSX.Element {
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitResponse = useMutation(api.groupMeetings.submitPollResponse);

  const toggleOption = (index: number) => {
    setSelectedOptions((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleSubmit = async () => {
    if (selectedOptions.length === 0) {
      toast.error("Please select at least one time slot");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitResponse({
        pollId: poll._id,
        attendeeEmail,
        selectedOptionIndices: selectedOptions,
      });
      toast.success("Your response has been recorded!");
      setSelectedOptions([]);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to submit response"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const expiresAt = new Date(poll.expiresAt);
  const isExpired = Date.now() > poll.expiresAt;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vote on Available Times</CardTitle>
        <CardDescription>
          Select all time slots that work for you
        </CardDescription>
        {!isExpired && (
          <p className="text-sm text-muted-foreground mt-2">
            Poll expires on {expiresAt.toLocaleDateString()} at{" "}
            {expiresAt.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
        {isExpired && (
          <p className="text-sm text-red-600">This poll has expired</p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Meeting Details */}
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground text-sm">Duration</p>
            <p className="font-medium">{poll.durationMinutes} minutes</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Attendees</p>
            <p className="font-medium">{poll.attendees.length} total</p>
          </div>
        </div>

        {/* Poll Options */}
        <div className="space-y-3">
          <p className="font-semibold">Available Times</p>
          {poll.pollOptions.map((option, index) => (
            <div key={index} className="flex items-center gap-3 border rounded-lg p-3">
              <Checkbox
                id={`option-${index}`}
                checked={selectedOptions.includes(index)}
                onCheckedChange={() => toggleOption(index)}
                disabled={isExpired || isSubmitting}
              />
              <label
                htmlFor={`option-${index}`}
                className="flex-1 cursor-pointer text-sm"
              >
                <div className="font-medium">{option.date}</div>
                <div className="text-muted-foreground">{option.time}</div>
              </label>
              <div className="text-right text-xs text-muted-foreground">
                {/* Show vote count if poll has responses */}
              </div>
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || isExpired || selectedOptions.length === 0}
          className="w-full"
        >
          {isSubmitting ? "Submitting..." : "Submit Your Response"}
        </Button>
      </CardContent>
    </Card>
  );
}

interface PollResultsProps {
  poll: PollData;
}

function PollResults({ poll }: PollResultsProps): JSX.Element {
  const voteCount = poll.voteCount || [];
  const maxVotes = Math.max(...voteCount, 1);

  const bestOptionIndex =
    voteCount.length > 0 ? voteCount.indexOf(Math.max(...voteCount)) : -1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Poll Results</CardTitle>
        <CardDescription>
          {poll.respondentCount} of {poll.attendees.length} attendees have
          responded
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Meeting Details */}
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground text-sm">Duration</p>
            <p className="font-medium">{poll.durationMinutes} minutes</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Status</p>
            <p className="font-medium capitalize">{poll.status}</p>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <p className="font-semibold">Time Slot Results</p>
          {poll.pollOptions.map((option, index) => {
            const votes = voteCount[index] || 0;
            const percentage =
              maxVotes > 0 ? Math.round((votes / maxVotes) * 100) : 0;
            const isBest = index === bestOptionIndex && votes > 0;

            return (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <div className={isBest ? "font-semibold" : ""}>
                      {option.date} at {option.time}
                      {isBest && " ⭐"}
                    </div>
                  </div>
                  <div className="text-muted-foreground">
                    {votes} vote{votes !== 1 ? "s" : ""}
                  </div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className={`h-full ${
                      isBest ? "bg-green-500" : "bg-blue-500"
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Best Time */}
        {bestOptionIndex >= 0 && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="text-sm font-semibold text-green-900">
              Best Time: {poll.pollOptions[bestOptionIndex]?.date} at{" "}
              {poll.pollOptions[bestOptionIndex]?.time}
            </p>
            <p className="text-sm text-green-800 mt-1">
              {voteCount[bestOptionIndex]} attendees prefer this time
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
