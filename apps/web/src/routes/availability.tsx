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

export const Route = createFileRoute("/availability")({
  component: RouteComponent,
});

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

interface TimeRange {
  endTime: string;
  startTime: string;
}

interface DaySchedule {
  dayOfWeek: number;
  enabled: boolean;
  timeRanges: TimeRange[];
}

function buildDefaultSchedule(): DaySchedule[] {
  return [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
    dayOfWeek,
    enabled: dayOfWeek >= 1 && dayOfWeek <= 5,
    timeRanges: [{ startTime: "09:00", endTime: "17:00" }],
  }));
}

function AvailabilityEditor() {
  const savedSchedule = useQuery(api.availability.getAvailabilitySchedule);
  const setSchedule = useMutation(api.availability.setAvailabilitySchedule);

  const [schedule, setLocalSchedule] = useState<DaySchedule[]>(
    buildDefaultSchedule()
  );
  const [isSaving, setIsSaving] = useState(false);

  // Populate local state once data loads
  useEffect(() => {
    if (savedSchedule) {
      setLocalSchedule(savedSchedule as DaySchedule[]);
    }
  }, [savedSchedule]);

  const updateDay = (dayOfWeek: number, patch: Partial<DaySchedule>) => {
    setLocalSchedule((prev) =>
      prev.map((day) =>
        day.dayOfWeek === dayOfWeek ? { ...day, ...patch } : day
      )
    );
  };

  const updateTimeRange = (
    dayOfWeek: number,
    index: number,
    patch: Partial<TimeRange>
  ) => {
    setLocalSchedule((prev) =>
      prev.map((day) => {
        if (day.dayOfWeek !== dayOfWeek) {
          return day;
        }
        const newRanges = day.timeRanges.map((range, i) =>
          i === index ? { ...range, ...patch } : range
        );
        return { ...day, timeRanges: newRanges };
      })
    );
  };

  const addTimeRange = (dayOfWeek: number) => {
    setLocalSchedule((prev) =>
      prev.map((day) => {
        if (day.dayOfWeek !== dayOfWeek) {
          return day;
        }
        return {
          ...day,
          timeRanges: [
            ...day.timeRanges,
            { startTime: "09:00", endTime: "17:00" },
          ],
        };
      })
    );
  };

  const removeTimeRange = (dayOfWeek: number, index: number) => {
    setLocalSchedule((prev) =>
      prev.map((day) => {
        if (day.dayOfWeek !== dayOfWeek) {
          return day;
        }
        const newRanges = day.timeRanges.filter((_, i) => i !== index);
        return { ...day, timeRanges: newRanges };
      })
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await setSchedule({ schedule });
      toast.success("Availability saved");
    } catch {
      toast.error("Failed to save availability");
    } finally {
      setIsSaving(false);
    }
  };

  if (savedSchedule === undefined) {
    return (
      <div className="space-y-4">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton className="h-16 w-full" key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {schedule.map((day) => (
        <Card key={day.dayOfWeek}>
          <CardContent className="pt-4">
            <div className="flex items-start gap-4">
              {/* Day toggle */}
              <div className="flex w-36 shrink-0 items-center gap-2 pt-1">
                <Checkbox
                  checked={day.enabled}
                  id={`day-${day.dayOfWeek}`}
                  onCheckedChange={(checked) =>
                    updateDay(day.dayOfWeek, { enabled: !!checked })
                  }
                />
                <Label
                  className="cursor-pointer font-medium"
                  htmlFor={`day-${day.dayOfWeek}`}
                >
                  {DAY_NAMES[day.dayOfWeek]}
                </Label>
              </div>

              {/* Time ranges */}
              {day.enabled ? (
                <div className="flex-1 space-y-2">
                  {day.timeRanges.map((range, rangeIndex) => (
                    <div
                      className="flex items-center gap-2"
                      key={`${day.dayOfWeek}-${range.startTime}-${range.endTime}`}
                    >
                      <Input
                        className="w-32"
                        onChange={(e) =>
                          updateTimeRange(day.dayOfWeek, rangeIndex, {
                            startTime: e.target.value,
                          })
                        }
                        type="time"
                        value={range.startTime}
                      />
                      <span className="text-muted-foreground text-sm">to</span>
                      <Input
                        className="w-32"
                        onChange={(e) =>
                          updateTimeRange(day.dayOfWeek, rangeIndex, {
                            endTime: e.target.value,
                          })
                        }
                        type="time"
                        value={range.endTime}
                      />
                      {day.timeRanges.length > 1 && (
                        <Button
                          className="h-8 w-8 rounded-full p-0"
                          onClick={() =>
                            removeTimeRange(day.dayOfWeek, rangeIndex)
                          }
                          type="button"
                          variant="ghost"
                        >
                          ✕
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    className="h-7 px-2 text-xs"
                    onClick={() => addTimeRange(day.dayOfWeek)}
                    type="button"
                    variant="ghost"
                  >
                    + Add time range
                  </Button>
                </div>
              ) : (
                <p className="pt-1 text-muted-foreground text-sm">
                  Unavailable
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-end pt-2">
        <Button disabled={isSaving} onClick={handleSave} type="button">
          {isSaving ? "Saving…" : "Save availability"}
        </Button>
      </div>
    </div>
  );
}

function RouteComponent() {
  const [showSignIn, setShowSignIn] = useState(false);

  return (
    <>
      <Authenticated>
        <div className="container mx-auto max-w-2xl px-4 py-8">
          <h1 className="mb-2 font-bold text-3xl">Availability</h1>
          <p className="mb-6 text-muted-foreground text-sm">
            Set your weekly working hours. The booking widget will only show
            slots within these windows.
          </p>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Weekly schedule</CardTitle>
              <CardDescription>
                Enable days and set one or more time ranges per day. Multiple
                ranges allow for lunch breaks or split shifts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AvailabilityEditor />
            </CardContent>
          </Card>
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
          <Skeleton className="mb-6 h-10 w-48" />
          <div className="space-y-4">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton className="h-16 w-full" key={i} />
            ))}
          </div>
        </div>
      </AuthLoading>
    </>
  );
}
