import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function getDaysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export function getFirstDayOfMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
}

export function isTimeBlocked(
  date: string,
  time: string,
  blockedTimes: Array<{ date: string; startTime: string; endTime: string }>
): boolean {
  return blockedTimes.some((block) => {
    if (block.date !== date) {
      return false;
    }
    const [blockStartHours = 0, blockStartMins = 0] = block.startTime
      .split(":")
      .map(Number);
    const [blockEndHours = 0, blockEndMins = 0] = block.endTime
      .split(":")
      .map(Number);
    const [timeHours = 0, timeMins = 0] = time.split(":").map(Number);

    const blockStartTotalMins = blockStartHours * 60 + blockStartMins;
    const blockEndTotalMins = blockEndHours * 60 + blockEndMins;
    const timeTotalMins = timeHours * 60 + timeMins;

    return (
      timeTotalMins >= blockStartTotalMins && timeTotalMins < blockEndTotalMins
    );
  });
}

export function isPastDate(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}
