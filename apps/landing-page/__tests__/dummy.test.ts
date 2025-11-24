import { describe, expect, it } from "bun:test";

describe("Landing Page App", () => {
  it("should pass a dummy test", () => {
    expect(true).toBe(true);
  });

  it("should have basic exports", () => {
    expect(typeof describe).toBe("function");
    expect(typeof it).toBe("function");
  });
});
