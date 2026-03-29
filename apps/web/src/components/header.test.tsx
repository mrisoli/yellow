import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Header from "./header";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "light", setTheme: vi.fn() }),
}));

describe("Header", () => {
  it("renders Home link with correct href", () => {
    render(<Header />);
    const homeLink = screen.getByText("Home") as HTMLAnchorElement;
    expect(homeLink).toBeInTheDocument();
    expect(homeLink.href).toContain("/");
  });

  it("renders Dashboard link with correct href", () => {
    render(<Header />);
    const dashboardLink = screen.getByText("Dashboard") as HTMLAnchorElement;
    expect(dashboardLink).toBeInTheDocument();
    expect(dashboardLink.href).toContain("/dashboard");
  });
});
