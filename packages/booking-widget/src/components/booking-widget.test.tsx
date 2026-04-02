import { render, screen } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { BookingWidget } from "./booking-widget";

describe("BookingWidget", () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T12:00:00.000Z"));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it("renders calendar on initial load", () => {
    const defaultMonth = new Date(2026, 5, 15);
    render(<BookingWidget defaultMonth={defaultMonth} />);

    expect(screen.getByText("Select a Date")).toBeInTheDocument();
  });
});
