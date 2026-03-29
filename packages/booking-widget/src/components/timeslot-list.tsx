import { cn, formatDate, isTimeBlocked } from "../lib/utils";
import type { BlockedTime } from "../types";

interface TimeslotListProps {
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
  blockedTimes = [],
  selectedTime,
  onTimeSelect,
  className,
}: TimeslotListProps) {
  const dateStr = formatDate(date);
  const timeslots: string[] = [];

  for (let hour = 9; hour < 17; hour++) {
    for (let minute = 0; minute < 60; minute += meetingDuration) {
      const timeStr = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
      timeslots.push(timeStr);
    }
  }

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
