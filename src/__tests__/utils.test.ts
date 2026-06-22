import { describe, it, expect } from "vitest";
import { multiply } from "../utils.js";

describe("multiply", () => {
  it("returns the product of two numbers", () => {
    expect(multiply(2, 3)).toBe(6);
  });

  it("handles negative operands", () => {
    expect(multiply(-2, 3)).toBe(-6);
  });

  it("returns zero when an operand is zero", () => {
    expect(multiply(0, 5)).toBe(0);
  });
});
