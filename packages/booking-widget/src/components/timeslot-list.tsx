import { cn, formatDate, getAvailableTimeslots, isTimeBlocked } from "../lib/utils";
import type { DayAvailability, BlockedTime } from "../types";

interface TimeslotListProps {
  availability?: DayAvailability[];
  blockedTimes?: BlockedTime[];
  className?: string;
  date: Date;
  meetingDuration: number;
  onTimeSelect: (time: string) => void;
  selectedTime: string | null;
}

export function TimeslotList({
  date,
  meetingDuration,
  availability,
  blockedTimes = [],
  selectedTime,
  onTimeSelect,
  className,
}: TimeslotListProps) {
  const timeslots = getAvailableTimeslots(date, meetingDuration, availability);

  if (timeslots.length === 0) {
    return (
      <div className={cn("space-y-3", className)}>
        <h3 className="font-semibold">Select a time slot</h3>
        <p className="text-muted-foreground text-sm">
          No available slots for this day.
        </p>
      </div>
    );
  }

  const dateStr = formatDate(date);

  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="font-semibold">Select a time slot</h3>
      <div className="grid grid-cols-3 gap-2">
        {timeslots.map((time) => {
          const blocked = isTimeBlocked(dateStr, time, blockedTimes);
          const isSelected = selectedTime === time;

          return (
            <button
              className={cn(
                "rounded px-3 py-2 font-medium text-sm transition",
                isSelected
                  ? "bg-blue-500 text-white"
                  : "bg-gray-50 text-gray-900 hover:bg-gray-100",
                blocked && "cursor-not-allowed text-gray-400"
              )}
              disabled={blocked}
              key={time}
              onClick={() => !blocked && onTimeSelect(time)}
              type="button"
            >
              {time}
            </button>
          );
        })}
      </div>
    </div>
  );
}
