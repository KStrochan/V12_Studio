import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("merges conflicting tailwind classes and drops falsy values", () => {
    expect(cn("p-2", false && "x", "p-4")).toBe("p-4");
  });
});
