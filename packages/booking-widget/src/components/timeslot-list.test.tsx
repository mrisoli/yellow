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
});
