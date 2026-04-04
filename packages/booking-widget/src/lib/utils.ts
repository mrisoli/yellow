import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import type { DayAvailability } from "../types";

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

/**
 * Generate the list of time slots (in "HH:mm" format) available for a given
 * date, based on the host's weekly availability schedule and the meeting
 * duration.
 *
 * Falls back to 09:00–17:00 when no schedule is provided (preserving the
 * original behaviour of the widget).
 */
export function getAvailableTimeslots(
  date: Date,
  meetingDuration: number,
  availability?: DayAvailability[]
): string[] {
  const dayOfWeek = date.getDay();

  // If no schedule is provided, use the legacy 09:00–17:00 window.
  if (!availability) {
    const slots: string[] = [];
    for (let hour = 9; hour < 17; hour++) {
      for (let minute = 0; minute < 60; minute += meetingDuration) {
        slots.push(
          `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
        );
      }
    }
    return slots;
  }

  const dayConfig = availability.find((d) => d.dayOfWeek === dayOfWeek);

  // Day is disabled or missing → no slots.
  if (!dayConfig?.enabled || dayConfig.timeRanges.length === 0) {
    return [];
  }

  const slots: string[] = [];

  for (const range of dayConfig.timeRanges) {
    const [startHour = 0, startMin = 0] = range.startTime
      .split(":")
      .map(Number);
    const [endHour = 0, endMin = 0] = range.endTime.split(":").map(Number);

    const startTotal = startHour * 60 + startMin;
    const endTotal = endHour * 60 + endMin;

    for (
      let minutes = startTotal;
      minutes + meetingDuration <= endTotal;
      minutes += meetingDuration
    ) {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }

  return slots;
}
