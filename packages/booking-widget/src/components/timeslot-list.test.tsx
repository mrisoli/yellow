import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TimeslotList } from "./timeslot-list";

const TIME_PATTERN = /\d{2}:\d{2}/;

describe("TimeslotList", () => {
  it("generates 30-minute slots from 9am to 4:30pm with 30-min duration", () => {
    const date = new Date(2024, 5, 20);
    render(
      <TimeslotList
        blockedTimes={[]}
        date={date}
        meetingDuration={30}
        onTimeSelect={vi.fn()}
        selectedTime={null}
      />
    );

    expect(screen.getByText("09:00")).toBeInTheDocument();
    expect(screen.getByText("16:30")).toBeInTheDocument();
  });

  it("generates 60-minute slots (8 total) with 60-min duration", () => {
    const date = new Date(2024, 5, 20);
    const { container } = render(
      <TimeslotList
        blockedTimes={[]}
        date={date}
        meetingDuration={60}
        onTimeSelect={vi.fn()}
        selectedTime={null}
      />
    );

    const buttons = container.querySelectorAll('button[type="button"]');
    // 8 slots + 1 heading = 9 elements, but we're checking all buttons
    const timeButtons = Array.from(buttons).filter((btn) =>
      TIME_PATTERN.test(btn.textContent || "")
    );
    expect(timeButtons).toHaveLength(8);
  });

  it("disables blocked time slot", () => {
    const date = new Date(2024, 5, 20);
    const blockedTimes = [
      { date: "2024-06-20", startTime: "09:00", endTime: "10:00" },
    ];

    render(
      <TimeslotList
        blockedTimes={blockedTimes}
        date={date}
        meetingDuration={30}
        onTimeSelect={vi.fn()}
        selectedTime={null}
      />
    );

    const blockedButton = screen.getByText("09:00");
    expect(blockedButton).toBeDisabled();
  });

  it("calls onTimeSelect when clicking non-blocked time", async () => {
    const user = userEvent.setup();
    const date = new Date(2024, 5, 20);
    const onTimeSelect = vi.fn();

    render(
      <TimeslotList
        blockedTimes={[]}
        date={date}
        meetingDuration={30}
        onTimeSelect={onTimeSelect}
        selectedTime={null}
      />
    );

    const timeButton = screen.getByText("10:00");
    await user.click(timeButton);

    expect(onTimeSelect).toHaveBeenCalledWith("10:00");
  });

  it("does not call onTimeSelect when clicking blocked time", async () => {
    const user = userEvent.setup();
    const date = new Date(2024, 5, 20);
    const blockedTimes = [
      { date: "2024-06-20", startTime: "09:00", endTime: "10:00" },
    ];
    const onTimeSelect = vi.fn();

    render(
      <TimeslotList
        blockedTimes={blockedTimes}
        date={date}
        meetingDuration={30}
        onTimeSelect={onTimeSelect}
        selectedTime={null}
      />
    );

    const blockedButton = screen.getByText("09:00");
    await user.click(blockedButton);

    expect(onTimeSelect).not.toHaveBeenCalled();
  });

  it("highlights selected time", () => {
    const date = new Date(2024, 6, 20);
    render(
      <TimeslotList
        blockedTimes={[]}
        date={date}
        meetingDuration={30}
        onTimeSelect={vi.fn()}
        selectedTime="14:00"
      />
    );

    const selectedButton = screen.getByText("14:00");
    expect(selectedButton).toHaveClass("bg-blue-500");
  });

  it("shows no slots when the day is disabled in the availability schedule", () => {
    // June 20, 2024 is a Thursday (dayOfWeek = 4)
    const date = new Date(2024, 5, 20);
    const availability = [{ dayOfWeek: 4, enabled: false, timeRanges: [] }];

    render(
      <TimeslotList
        availability={availability}
        blockedTimes={[]}
        date={date}
        meetingDuration={30}
        onTimeSelect={vi.fn()}
        selectedTime={null}
      />
    );

    expect(
      screen.getByText("No available slots for this day.")
    ).toBeInTheDocument();
  });

  it("only shows slots within a custom time range from the availability schedule", () => {
    // June 20, 2024 is a Thursday (dayOfWeek = 4)
    const date = new Date(2024, 5, 20);
    const availability = [
      {
        dayOfWeek: 4,
        enabled: true,
        timeRanges: [{ startTime: "10:00", endTime: "11:00" }],
      },
    ];

    render(
      <TimeslotList
        availability={availability}
        blockedTimes={[]}
        date={date}
        meetingDuration={30}
        onTimeSelect={vi.fn()}
        selectedTime={null}
      />
    );

    expect(screen.getByText("10:00")).toBeInTheDocument();
    expect(screen.getByText("10:30")).toBeInTheDocument();
    expect(screen.queryByText("09:00")).not.toBeInTheDocument();
    expect(screen.queryByText("11:00")).not.toBeInTheDocument();
  });

  it("combines multiple time ranges in the same day", () => {
    // June 20, 2024 is a Thursday (dayOfWeek = 4)
    const date = new Date(2024, 5, 20);
    const availability = [
      {
        dayOfWeek: 4,
        enabled: true,
        timeRanges: [
          { startTime: "09:00", endTime: "10:00" },
          { startTime: "14:00", endTime: "15:00" },
        ],
      },
    ];

    render(
      <TimeslotList
        availability={availability}
        blockedTimes={[]}
        date={date}
        meetingDuration={30}
        onTimeSelect={vi.fn()}
        selectedTime={null}
      />
    );

    expect(screen.getByText("09:00")).toBeInTheDocument();
    expect(screen.getByText("09:30")).toBeInTheDocument();
    expect(screen.getByText("14:00")).toBeInTheDocument();
    expect(screen.getByText("14:30")).toBeInTheDocument();
    expect(screen.queryByText("10:00")).not.toBeInTheDocument();
    expect(screen.queryByText("13:00")).not.toBeInTheDocument();
  });
});
