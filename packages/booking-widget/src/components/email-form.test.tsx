import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EmailForm } from "./email-form";

describe("EmailForm", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders email input and submit button", () => {
    render(
      <EmailForm
        date="2024-06-20"
        submitUrl="http://localhost/submit"
        time="14:00"
      />
    );

    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
    expect(screen.getByText("Confirm Booking")).toBeInTheDocument();
  });

  it("disables submit button when email is empty", () => {
    render(
      <EmailForm
        date="2024-06-20"
        submitUrl="http://localhost/submit"
        time="14:00"
      />
    );

    const submitButton = screen.getByText("Confirm Booking");
    expect(submitButton).toBeDisabled();
  });

  it("enables submit button when email is entered", async () => {
    const user = userEvent.setup();
    render(
      <EmailForm
        date="2024-06-20"
        submitUrl="http://localhost/submit"
        time="14:00"
      />
    );

    const emailInput = screen.getByPlaceholderText("you@example.com");
    await user.type(emailInput, "test@example.com");

    const submitButton = screen.getByText("Confirm Booking");
    expect(submitButton).not.toBeDisabled();
  });

  it("calls onSuccess on successful submission", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
      })
    );

    render(
      <EmailForm
        date="2024-06-20"
        onSuccess={onSuccess}
        submitUrl="http://localhost/submit"
        time="14:00"
      />
    );

    const emailInput = screen.getByPlaceholderText("you@example.com");
    await user.type(emailInput, "test@example.com");

    const submitButton = screen.getByText("Confirm Booking");
    await user.click(submitButton);

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(onSuccess).toHaveBeenCalled();
  });

  it("shows error message on failed submission", async () => {
    const user = userEvent.setup();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
      })
    );

    render(
      <EmailForm
        date="2024-06-20"
        submitUrl="http://localhost/submit"
        time="14:00"
      />
    );

    const emailInput = screen.getByPlaceholderText("you@example.com");
    await user.type(emailInput, "test@example.com");

    const submitButton = screen.getByText("Confirm Booking");
    await user.click(submitButton);

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(screen.getByText("HTTP error! status: 422")).toBeInTheDocument();
  });

  it("shows loading state while submitting", async () => {
    const user = userEvent.setup();

    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise((resolve) => setTimeout(() => resolve({ ok: true }), 100))
      )
    );

    render(
      <EmailForm
        date="2024-06-20"
        submitUrl="http://localhost/submit"
        time="14:00"
      />
    );

    const emailInput = screen.getByPlaceholderText("you@example.com");
    await user.type(emailInput, "test@example.com");

    const submitButton = screen.getByText("Confirm Booking");
    await user.click(submitButton);

    expect(screen.getByText("Submitting...")).toBeInTheDocument();
  });

  it("clears email input after successful submission", async () => {
    const user = userEvent.setup();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
      })
    );

    const onSuccess = vi.fn();

    render(
      <EmailForm
        date="2024-06-20"
        onSuccess={onSuccess}
        submitUrl="http://localhost/submit"
        time="14:00"
      />
    );

    const emailInput = screen.getByPlaceholderText(
      "you@example.com"
    ) as HTMLInputElement;
    await user.type(emailInput, "test@example.com");
    expect(emailInput.value).toBe("test@example.com");

    const submitButton = screen.getByText("Confirm Booking");
    await user.click(submitButton);

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(emailInput.value).toBe("");
  });
});
