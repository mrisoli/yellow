import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  formatDate,
  formatTime,
  getDaysInMonth,
  getFirstDayOfMonth,
  isPastDate,
  isTimeBlocked,
} from "./utils";

describe("formatDate", () => {
  it("formats date with zero-padded month and day", () => {
    const date = new Date(2024, 0, 5);
    expect(formatDate(date)).toBe("2024-01-05");
  });

  it("handles December correctly", () => {
    const date = new Date(2024, 11, 31);
    expect(formatDate(date)).toBe("2024-12-31");
  });
});

describe("formatTime", () => {
  it("formats time with zero-padded hours and minutes", () => {
    const date = new Date(2024, 0, 1, 9, 5);
    expect(formatTime(date)).toBe("09:05");
  });

  it("handles hour 00 and minute 00", () => {
    const date = new Date(2024, 0, 1, 0, 0);
    expect(formatTime(date)).toBe("00:00");
  });
});

describe("getDaysInMonth", () => {
  it("returns 31 for January", () => {
    const date = new Date(2024, 0, 1);
    expect(getDaysInMonth(date)).toBe(31);
  });

  it("returns 29 for February in leap year 2024", () => {
    const date = new Date(2024, 1, 1);
    expect(getDaysInMonth(date)).toBe(29);
  });

  it("returns 28 for February in non-leap year 2023", () => {
    const date = new Date(2023, 1, 1);
    expect(getDaysInMonth(date)).toBe(28);
  });

  it("returns 30 for April", () => {
    const date = new Date(2024, 3, 1);
    expect(getDaysInMonth(date)).toBe(30);
  });
});

describe("getFirstDayOfMonth", () => {
  it("returns correct day for known date", () => {
    // January 1, 2024 is a Monday (day 1)
    const date = new Date(2024, 0, 1);
    expect(getFirstDayOfMonth(date)).toBe(1);
  });

  it("returns 1 for Monday", () => {
    // July 1, 2024 is a Monday
    const date = new Date(2024, 6, 15);
    expect(getFirstDayOfMonth(date)).toBe(1);
  });
});

describe("isPastDate", () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T12:00:00.000Z"));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it("returns true for yesterday", () => {
    const yesterday = new Date(2024, 5, 14);
    expect(isPastDate(yesterday)).toBe(true);
  });

  it("returns false for today", () => {
    const today = new Date(2024, 5, 15);
    expect(isPastDate(today)).toBe(false);
  });

  it("returns false for tomorrow", () => {
    const tomorrow = new Date(2024, 5, 16);
    expect(isPastDate(tomorrow)).toBe(false);
  });
});

describe("isTimeBlocked", () => {
  const blockedTimes = [
    { date: "2024-06-15", startTime: "09:00", endTime: "10:00" },
    { date: "2024-06-15", startTime: "14:00", endTime: "15:00" },
    { date: "2024-06-16", startTime: "10:00", endTime: "11:00" },
  ];

  it("returns true for time within blocked range", () => {
    expect(isTimeBlocked("2024-06-15", "09:30", blockedTimes)).toBe(true);
  });

  it("returns true for time exactly at block start", () => {
    expect(isTimeBlocked("2024-06-15", "09:00", blockedTimes)).toBe(true);
  });

  it("returns false for time at block end boundary (exclusive)", () => {
    expect(isTimeBlocked("2024-06-15", "10:00", blockedTimes)).toBe(false);
  });

  it("returns false for time before block", () => {
    expect(isTimeBlocked("2024-06-15", "08:00", blockedTimes)).toBe(false);
  });

  it("returns false for different date", () => {
    expect(isTimeBlocked("2024-06-14", "09:30", blockedTimes)).toBe(false);
  });

  it("returns false when no blocks exist for date", () => {
    expect(isTimeBlocked("2024-06-17", "09:00", blockedTimes)).toBe(false);
  });

  it("handles multiple blocked ranges", () => {
    expect(isTimeBlocked("2024-06-15", "14:30", blockedTimes)).toBe(true);
    expect(isTimeBlocked("2024-06-15", "13:00", blockedTimes)).toBe(false);
  });
});
