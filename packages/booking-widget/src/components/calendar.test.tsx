import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
    headers.forEach((header) => {
      expect(screen.getByText(header)).toBeInTheDocument();
    });
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

  it("calls onDateSelect when clicking a future date", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const month = new Date(2024, 5);
    const onDateSelect = vi.fn();

    render(
      <Calendar
        month={month}
        onDateSelect={onDateSelect}
        onMonthChange={vi.fn()}
        selectedDate={null}
      />
    );

    // June 20 is in the future
    const futureDate = screen.getByLabelText("June 20");
    await user.click(futureDate);

    expect(onDateSelect).toHaveBeenCalledWith(expect.any(Date));
    const passedDate = onDateSelect.mock.calls[0][0];
    expect(passedDate.getDate()).toBe(20);
  });

  it("calls onMonthChange when clicking prev button", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const month = new Date(2024, 5);
    const onMonthChange = vi.fn();

    render(
      <Calendar
        month={month}
        onDateSelect={vi.fn()}
        onMonthChange={onMonthChange}
        selectedDate={null}
      />
    );

    const prevButton = screen.getByLabelText("Previous month");
    await user.click(prevButton);

    expect(onMonthChange).toHaveBeenCalledWith(expect.any(Date));
    const passedMonth = onMonthChange.mock.calls[0][0];
    expect(passedMonth.getMonth()).toBe(4);
  });

  it("calls onMonthChange when clicking next button", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const month = new Date(2024, 5);
    const onMonthChange = vi.fn();

    render(
      <Calendar
        month={month}
        onDateSelect={vi.fn()}
        onMonthChange={onMonthChange}
        selectedDate={null}
      />
    );

    const nextButton = screen.getByLabelText("Next month");
    await user.click(nextButton);

    expect(onMonthChange).toHaveBeenCalledWith(expect.any(Date));
    const passedMonth = onMonthChange.mock.calls[0][0];
    expect(passedMonth.getMonth()).toBe(6);
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
