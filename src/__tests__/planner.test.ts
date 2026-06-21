import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AgentProvider } from "@ai-hero/sandcastle";
import type { PlanIssue } from "../planner.js";

const { mockRunAgent } = vi.hoisted(() => ({
  mockRunAgent: vi.fn(),
}));

vi.mock("../runAgent.js", () => ({
  runAgent: mockRunAgent,
}));

vi.mock("@ai-hero/sandcastle", () => ({
  Output: {
    object: (o: unknown) => ({ _tag: "object", ...(o as object) }),
  },
}));

import { runPlanner } from "../planner.js";

const mockAgent = {} as AgentProvider;

const makeIssues = (n: number): PlanIssue[] =>
  Array.from({ length: n }, (_, i) => ({
    id: String(i + 1),
    title: `Issue ${i + 1}`,
    branch: `issue-${i + 1}`,
  }));

beforeEach(() => {
  mockRunAgent.mockClear();
});

describe("runPlanner", () => {
  it("passes K as a promptArg to the planner agent", async () => {
    mockRunAgent.mockResolvedValue({
      output: { issues: makeIssues(1) },
      commits: [],
      stdout: "",
      iterations: [],
    });

    await runPlanner({ K: 3, agent: mockAgent });

    expect(mockRunAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        promptArgs: expect.objectContaining({ K: 3 }),
      }),
    );
  });

  it("caps the plan at K when the planner returns more issues than K", async () => {
    mockRunAgent.mockResolvedValue({
      output: { issues: makeIssues(5) },
      commits: [],
      stdout: "",
      iterations: [],
    });

    const result = await runPlanner({ K: 2, agent: mockAgent });

    expect(result).toHaveLength(2);
    expect(result[0]?.id).toBe("1");
    expect(result[1]?.id).toBe("2");
  });

  it("returns all issues when fewer than K exist", async () => {
    mockRunAgent.mockResolvedValue({
      output: { issues: makeIssues(2) },
      commits: [],
      stdout: "",
      iterations: [],
    });

    const result = await runPlanner({ K: 5, agent: mockAgent });

    expect(result).toHaveLength(2);
  });

  it("returns an empty array when the planner finds no unblocked issues", async () => {
    mockRunAgent.mockResolvedValue({
      output: { issues: [] },
      commits: [],
      stdout: "",
      iterations: [],
    });

    const result = await runPlanner({ K: 1, agent: mockAgent });

    expect(result).toHaveLength(0);
  });

  it("normalizes branch to issue-{id} regardless of what the LLM returns", async () => {
    mockRunAgent.mockResolvedValue({
      output: {
        issues: [{ id: "42", title: "Fix bug", branch: "some-llm-invented-branch" }],
      },
      commits: [],
      stdout: "",
      iterations: [],
    });

    const result = await runPlanner({ K: 1, agent: mockAgent });

    expect(result[0]?.branch).toBe("issue-42");
  });

  it("re-planning the same issue id always yields the same branch name", async () => {
    const issue = { id: "7", title: "Add feature", branch: "whatever" };
    mockRunAgent.mockResolvedValue({
      output: { issues: [issue] },
      commits: [],
      stdout: "",
      iterations: [],
    });

    const first = await runPlanner({ K: 1, agent: mockAgent });
    const second = await runPlanner({ K: 1, agent: mockAgent });

    expect(first[0]?.branch).toBe(second[0]?.branch);
    expect(first[0]?.branch).toBe("issue-7");
  });
});
