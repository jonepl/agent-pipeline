import { describe, it, expect } from "vitest";
import { issueBranchName } from "../branchName.js";

describe("issueBranchName", () => {
  it("uses the issue-{id} format", () => {
    expect(issueBranchName("42")).toBe("issue-42");
  });

  it("is deterministic — same id always yields the same branch name", () => {
    expect(issueBranchName("42")).toBe(issueBranchName("42"));
  });

  it("different ids produce different branch names", () => {
    expect(issueBranchName("1")).not.toBe(issueBranchName("2"));
  });
});
