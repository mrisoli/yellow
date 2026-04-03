import { render, screen } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { Calendar } from "./calendar";

describe("Calendar", () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T12:00:00.000Z"));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it("renders month name and year", () => {
    const month = new Date(2024, 5);
    render(
      <Calendar
        month={month}
        onDateSelect={vi.fn()}
        onMonthChange={vi.fn()}
        selectedDate={null}
      />
    );

    expect(screen.getByText("June 2024")).toBeInTheDocument();
  });

  it("renders 7 day-of-week headers", () => {
    const month = new Date(2024, 5);
    render(
      <Calendar
        month={month}
        onDateSelect={vi.fn()}
        onMonthChange={vi.fn()}
        selectedDate={null}
      />
    );

    const headers = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (const header of headers) {
      expect(screen.getByText(header)).toBeInTheDocument();
    }
  });

  it("disables past dates", () => {
    const month = new Date(2024, 5);
    render(
      <Calendar
        month={month}
        onDateSelect={vi.fn()}
        onMonthChange={vi.fn()}
        selectedDate={null}
      />
    );

    // June 14 is in the past
    const pastDate = screen.getByLabelText("June 14");
    expect(pastDate).toBeDisabled();
  });

  it("highlights selected date", () => {
    const month = new Date(2024, 5);
    const selectedDate = new Date(2024, 5, 20);

    render(
      <Calendar
        month={month}
        onDateSelect={vi.fn()}
        onMonthChange={vi.fn()}
        selectedDate={selectedDate}
      />
    );

    const selectedButton = screen.getByLabelText("June 20");
    expect(selectedButton).toHaveClass("bg-blue-500");
  });
});
