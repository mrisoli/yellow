import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";
import Home from "@/app/page";

describe("Landing Page Root", () => {
  it("should render the home page", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { level: 1 })).toBeTruthy();
  });

  it("should display welcome text", () => {
    render(<Home />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.textContent).toContain("Welcome to yellow");
  });

  it("should display description text", () => {
    render(<Home />);
    expect(screen.getByText(/Modern task management for teams/)).toBeTruthy();
  });
});
