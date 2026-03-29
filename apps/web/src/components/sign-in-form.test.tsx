import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import SignInForm from "./sign-in-form";

const mockNavigate = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signIn: {
      email: vi.fn(),
    },
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("SignInForm", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders Welcome Back heading", () => {
    render(<SignInForm onSwitchToSignUp={vi.fn()} />);
    expect(screen.getByText("Welcome Back")).toBeInTheDocument();
  });

  it("renders email and password inputs", () => {
    render(<SignInForm onSwitchToSignUp={vi.fn()} />);
    const emailInput = screen.getByLabelText("Email");
    expect(emailInput).toBeInTheDocument();
    const passwordInput = screen.getByLabelText("Password");
    expect(passwordInput).toBeInTheDocument();
  });

  it("renders Sign In submit button", () => {
    render(<SignInForm onSwitchToSignUp={vi.fn()} />);
    expect(screen.getByText("Sign In")).toBeInTheDocument();
  });

  it("calls onSwitchToSignUp when clicking Need an account link", async () => {
    const user = userEvent.setup();
    const onSwitchToSignUp = vi.fn();

    render(<SignInForm onSwitchToSignUp={onSwitchToSignUp} />);

    const signUpLink = screen.getByText("Need an account? Sign Up");
    await user.click(signUpLink);

    expect(onSwitchToSignUp).toHaveBeenCalled();
  });

  it("allows submitting the form with valid data", async () => {
    const user = userEvent.setup();
    render(<SignInForm onSwitchToSignUp={vi.fn()} />);

    const emailInput = screen.getByLabelText("Email");
    await user.type(emailInput, "test@example.com");

    const passwordInput = screen.getByLabelText("Password");
    await user.type(passwordInput, "password123");

    const submitButton = screen.getByText("Sign In");
    expect(submitButton).toBeInTheDocument();
  });
});
