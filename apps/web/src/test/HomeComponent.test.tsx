import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, mock, test } from "bun:test";
import { Route } from "../routes/index";

// Mock the dependencies
const mockUseQuery = mock(() => ({
	data: "OK",
	isLoading: false,
}));

const mockConvexQuery = mock(() => ({}));

const mockApi = {
	healthCheck: {
		get: mock(() => {}),
	},
};

beforeEach(() => {
	// Reset mocks before each test
	mockUseQuery.mockClear();
	mockConvexQuery.mockClear();
	mockApi.healthCheck.get.mockClear();
});

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
		render(<Component />);
		expect(screen.getByText(/BETTER/)).toBeDefined();
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
