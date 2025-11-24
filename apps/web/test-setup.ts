import { Window } from "happy-dom";
import "@testing-library/jest-dom";
import { afterEach, mock } from "bun:test";
import { cleanup } from "@testing-library/react";

const window = new Window();
globalThis.window = window as unknown as Window & typeof globalThis;
globalThis.document = window.document as unknown as Document;
globalThis.navigator = window.navigator as unknown as Navigator;

// Mock Convex hooks
mock.module("convex/react", () => ({
  ConvexProvider: ({ children }: { children: React.ReactNode }) => children,
  useQuery: () => {}, // Return undefined to simulate loading state
}));

afterEach(cleanup);
