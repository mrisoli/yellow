import { describe, expect, it } from "bun:test";
import { cn } from "../src/lib/utils";

describe("UI Package", () => {
  it("should pass a dummy test", () => {
    expect(true).toBe(true);
  });

  it("should have cn utility", () => {
    expect(typeof cn).toBe("function");
    expect(cn("class1", "class2")).toBe("class1 class2");
  });
});
