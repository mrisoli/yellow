import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Route } from "../routes/index";

// Mock the dependencies
vi.mock("@tanstack/react-query", () => ({
	useQuery: vi.fn(() => ({
		data: "OK",
		isLoading: false,
	})),
}));

vi.mock("@convex-dev/react-query", () => ({
	convexQuery: vi.fn(() => ({})),
}));

vi.mock("@yellow/backend/convex/_generated/api", () => ({
	api: {
		healthCheck: {
			get: vi.fn(),
		},
	},
}));

describe("HomeComponent", () => {
	it("renders the title text", () => {
		const Component = Route.options.component;
		if (!Component) {
			throw new Error("Component not found");
		}
		render(<Component />);
		expect(screen.getByText(/BETTER/)).toBeDefined();
	});

	it("shows API status section", () => {
		const Component = Route.options.component;
		if (!Component) {
			throw new Error("Component not found");
		}
		render(<Component />);
		expect(screen.getByText("API Status")).toBeDefined();
		expect(screen.getByText("Connected")).toBeDefined();
	});
});
