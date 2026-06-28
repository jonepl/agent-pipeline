import { describe, it, expect } from "vitest";
import { multiply, divide } from "../utils.js";

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

describe("divide", () => {
  it("returns the quotient of two numbers", () => {
    expect(divide(10, 2)).toBe(5);
  });

  it("handles negative operands", () => {
    expect(divide(-9, 3)).toBe(-3);
  });

  it("handles non-integer results", () => {
    expect(divide(1, 4)).toBe(0.25);
  });

  it("throws when dividing by zero", () => {
    expect(() => divide(5, 0)).toThrow("Division by zero");
  });
});
