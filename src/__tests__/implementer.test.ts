import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AgentProvider, Sandbox } from "@ai-hero/sandcastle";
import type { PlanIssue } from "../planner.js";

const { mockRunAgent, mockCreateSandbox } = vi.hoisted(() => ({
  mockRunAgent: vi.fn(),
  mockCreateSandbox: vi.fn(),
}));

vi.mock("../runAgent.js", () => ({
  runAgent: mockRunAgent,
}));

vi.mock("@ai-hero/sandcastle", () => ({
  createSandbox: mockCreateSandbox,
}));

vi.mock("@ai-hero/sandcastle/sandboxes/docker", () => ({
  docker: vi.fn(() => ({ type: "docker" })),
}));

import { runImplement } from "../implementer.js";

const mockAgent = {} as AgentProvider;

const issue: PlanIssue = {
  id: "42",
  title: "Add feature",
  branch: "issue-42",
};

const baseOpts = {
  issue,
  implementerAgent: mockAgent,
  reviewerAgent: mockAgent,
};

const emptyRunResult = { commits: [], stdout: "", iterations: [] };

let mockClose: ReturnType<typeof vi.fn>;
let mockSandbox: Sandbox;

beforeEach(() => {
  mockRunAgent.mockClear();
  mockCreateSandbox.mockClear();
  mockClose = vi.fn().mockResolvedValue({});
  mockSandbox = { close: mockClose } as unknown as Sandbox;
  mockCreateSandbox.mockResolvedValue(mockSandbox);
});

describe("runImplement", () => {
  it("creates an isolated sandbox on the issue's branch", async () => {
    mockRunAgent.mockResolvedValue(emptyRunResult);

    await runImplement(baseOpts);

    expect(mockCreateSandbox).toHaveBeenCalledWith(
      expect.objectContaining({ branch: "issue-42" }),
    );
  });

  it("runs the implementer with the issue's TASK_ID, ISSUE_TITLE, and BRANCH", async () => {
    mockRunAgent.mockResolvedValue(emptyRunResult);

    await runImplement(baseOpts);

    expect(mockRunAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "implementer",
        promptArgs: expect.objectContaining({
          TASK_ID: "42",
          ISSUE_TITLE: "Add feature",
          BRANCH: "issue-42",
        }),
      }),
      mockSandbox,
    );
  });

  it("returns commits produced by the implementer", async () => {
    mockRunAgent.mockResolvedValueOnce({ commits: [{ sha: "abc" }], stdout: "", iterations: [] });

    const result = await runImplement(baseOpts);

    expect(result.commits).toEqual([{ sha: "abc" }]);
  });

  it("runs the reviewer only when the implementer produces commits", async () => {
    mockRunAgent
      .mockResolvedValueOnce({ commits: [{ sha: "abc" }], stdout: "", iterations: [] })
      .mockResolvedValueOnce({ commits: [{ sha: "def" }], stdout: "", iterations: [] });

    await runImplement(baseOpts);

    expect(mockRunAgent).toHaveBeenCalledTimes(2);
    expect(mockRunAgent).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ name: "reviewer" }),
      mockSandbox,
    );
  });

  it("skips the reviewer when the implementer produces no commits", async () => {
    mockRunAgent.mockResolvedValue(emptyRunResult);

    await runImplement(baseOpts);

    expect(mockRunAgent).toHaveBeenCalledOnce();
    expect(mockRunAgent).toHaveBeenCalledWith(
      expect.objectContaining({ name: "implementer" }),
      expect.anything(),
    );
  });

  it("returns combined commits from implementer and reviewer", async () => {
    mockRunAgent
      .mockResolvedValueOnce({ commits: [{ sha: "abc" }], stdout: "", iterations: [] })
      .mockResolvedValueOnce({ commits: [{ sha: "def" }], stdout: "", iterations: [] });

    const result = await runImplement(baseOpts);

    expect(result.commits).toEqual([{ sha: "abc" }, { sha: "def" }]);
  });

  it("closes the sandbox when no commits are produced", async () => {
    mockRunAgent.mockResolvedValue(emptyRunResult);

    await runImplement(baseOpts);

    expect(mockClose).toHaveBeenCalledOnce();
  });

  it("closes the sandbox even when the implementer throws", async () => {
    mockRunAgent.mockRejectedValue(new Error("agent crashed"));

    await expect(runImplement(baseOpts)).rejects.toThrow("agent crashed");

    expect(mockClose).toHaveBeenCalledOnce();
  });
});
