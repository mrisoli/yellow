import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";
import { ConvexProvider } from "convex/react";
import Home from "@/app/page";

const API_STATUS_PATTERN = /API Status/;
const CHECKING_STATUS_PATTERN = /Checking/;

// Create a mock Convex client for testing
const mockConvexClient = {
  watchQuery: () => ({
    localQueryResult: () => {
      // Simulate loading state
      return;
    },
    onUpdate: (callback: () => void) => {
      callback();
      return () => {
        // Unsubscribe function (intentionally empty)
        return;
      };
    },
    subscribe: (callback: (value: unknown) => void) => {
      callback(undefined); // Simulate undefined (loading) state
      return () => {
        // Unsubscribe function (intentionally empty)
        return;
      };
    },
  }),
};

// Wrapper to provide Convex context for testing
const MockConvexWrapper = ({ children }: { children: React.ReactNode }) => {
  // @ts-expect-error - Using mock client for testing
  return <ConvexProvider client={mockConvexClient}>{children}</ConvexProvider>;
};

describe("Web App Root", () => {
  it("should render the home page", () => {
    render(
      <MockConvexWrapper>
        <Home />
      </MockConvexWrapper>
    );
    expect(screen.getByText(API_STATUS_PATTERN)).toBeTruthy();
  });

  it("should display checking status text", () => {
    render(
      <MockConvexWrapper>
        <Home />
      </MockConvexWrapper>
    );
    expect(screen.getByText(CHECKING_STATUS_PATTERN)).toBeTruthy();
  });
});
