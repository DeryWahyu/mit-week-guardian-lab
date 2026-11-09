import { describe, expect, it } from "bun:test";
import { cn } from "./utils";

describe("cn utility", () => {
  it("merges class names correctly", () => {
    expect(cn("px-2", "py-1")).toBe("px-2 py-1");
  });

  it("handles conditional classes and Tailwind conflicts", () => {
    expect(cn("px-2", false && "hidden", "px-4")).toBe("px-4");
  });
});
