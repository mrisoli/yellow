import { describe, expect, mock, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import { Route } from "../routes/index";

// Mock the dependencies
const mockUseQuery = mock(() => ({
  data: "OK",
  isLoading: false,
}));

const mockConvexQuery = mock(() => ({}));

const mockApi = {
  healthCheck: {
    get: mock(() => undefined),
  },
};

// Set up module mocks
mock.module("@tanstack/react-query", () => ({
  useQuery: mockUseQuery,
}));

mock.module("@convex-dev/react-query", () => ({
  convexQuery: mockConvexQuery,
}));

mock.module("@yellow/backend/convex/_generated/api", () => ({
  api: mockApi,
}));

describe("HomeComponent", () => {
  test("renders the title text", () => {
    const Component = Route.options.component;
    if (!Component) {
      throw new Error("Component not found");
    }
    const { container } = render(<Component />);
    const pre = container.querySelector("pre");
    expect(pre).toBeDefined();
    expect(pre?.textContent).toContain("██");
  });

  test("shows API status section", () => {
    const Component = Route.options.component;
    if (!Component) {
      throw new Error("Component not found");
    }
    render(<Component />);
    expect(screen.getByText("API Status")).toBeDefined();
    expect(screen.getByText("Connected")).toBeDefined();
  });
});
