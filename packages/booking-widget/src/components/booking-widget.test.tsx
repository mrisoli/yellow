import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { BookingWidget } from "./booking-widget";

describe("BookingWidget", () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T12:00:00.000Z"));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders calendar on initial load", () => {
    const defaultMonth = new Date(2026, 5, 15);
    render(<BookingWidget defaultMonth={defaultMonth} />);

    expect(screen.getByText("Select a Date")).toBeInTheDocument();
  });

  it("advances to timeslots step after selecting a date", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const defaultMonth = new Date(2026, 5, 15);

    render(<BookingWidget defaultMonth={defaultMonth} />);

    // Select a future date
    const dateButton = screen.getByLabelText("June 20");
    await user.click(dateButton);

    expect(screen.getByText("Select a time slot")).toBeInTheDocument();
  });

  it("advances to form step after selecting a timeslot", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const defaultMonth = new Date(2026, 5, 15);

    render(<BookingWidget defaultMonth={defaultMonth} />);

    // Select date
    const dateButton = screen.getByLabelText("June 20");
    await user.click(dateButton);

    // Select timeslot
    const timeButton = screen.getByText("09:00");
    await user.click(timeButton);

    expect(screen.getByText("Complete Your Booking")).toBeInTheDocument();
  });

  it("returns to calendar step when clicking back from timeslots", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const defaultMonth = new Date(2026, 5, 15);

    render(<BookingWidget defaultMonth={defaultMonth} />);

    // Select date
    const dateButton = screen.getByLabelText("June 20");
    await user.click(dateButton);

    // Click back
    const backButtons = screen.getAllByText("Back");
    await user.click(backButtons[0]);

    expect(screen.getByText("Select a Date")).toBeInTheDocument();
  });

  it("returns to timeslots step when clicking back from form", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const defaultMonth = new Date(2026, 5, 15);

    render(<BookingWidget defaultMonth={defaultMonth} />);

    // Select date
    const dateButton = screen.getByLabelText("June 20");
    await user.click(dateButton);

    // Select timeslot
    const timeButton = screen.getByText("09:00");
    await user.click(timeButton);

    // Click back
    const backButtons = screen.getAllByText("Back");
    await user.click(backButtons[0]);

    expect(screen.getByText("Select a time slot")).toBeInTheDocument();
  });

  it("shows success step after successful submission", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const defaultMonth = new Date(2026, 5, 15);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
      })
    );

    render(
      <BookingWidget
        defaultMonth={defaultMonth}
        submitUrl="http://localhost/submit"
      />
    );

    // Select date
    const dateButton = screen.getByLabelText("June 20");
    await user.click(dateButton);

    // Select timeslot
    const timeButton = screen.getByText("09:00");
    await user.click(timeButton);

    // Fill email
    const emailInput = screen.getByPlaceholderText("you@example.com");
    await user.type(emailInput, "test@example.com");

    // Submit
    const confirmButton = screen.getByText("Confirm Booking");
    await user.click(confirmButton);

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(screen.getByText("Booking Confirmed!")).toBeInTheDocument();
  });

  it("resets to calendar when clicking 'Book Another Time'", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const defaultMonth = new Date(2026, 5, 15);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
      })
    );

    render(
      <BookingWidget
        defaultMonth={defaultMonth}
        submitUrl="http://localhost/submit"
      />
    );

    // Complete booking flow
    const dateButton = screen.getByLabelText("June 20");
    await user.click(dateButton);

    const timeButton = screen.getByText("09:00");
    await user.click(timeButton);

    const emailInput = screen.getByPlaceholderText("you@example.com");
    await user.type(emailInput, "test@example.com");

    const confirmButton = screen.getByText("Confirm Booking");
    await user.click(confirmButton);

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Click "Book Another Time"
    const bookAgainButton = screen.getByText("Book Another Time");
    await user.click(bookAgainButton);

    expect(screen.getByText("Select a Date")).toBeInTheDocument();
  });
});
