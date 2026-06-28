import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AgentProvider, Sandbox } from "@ai-hero/sandcastle";
import type { PlanIssue } from "../planner.js";

const { mockRunAgent, mockCreateSandbox, mockOpenPr } = vi.hoisted(() => ({
  mockRunAgent: vi.fn(),
  mockCreateSandbox: vi.fn(),
  mockOpenPr: vi.fn(),
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

import { runPlanDraft } from "../planDrafter.js";

const mockAgent = {} as AgentProvider;

const issue: PlanIssue = {
  id: "42",
  title: "Add auth flow",
  branch: "issue-42",
};

const baseOpts = {
  issue,
  agent: mockAgent,
  prdPath: "docs/prd.md",
  openPr: mockOpenPr,
};

const emptyRunResult = { commits: [], stdout: "", iterations: [] };

let mockClose: ReturnType<typeof vi.fn>;
let mockSandbox: Sandbox;

beforeEach(() => {
  mockRunAgent.mockClear();
  mockCreateSandbox.mockClear();
  mockOpenPr.mockClear();
  mockClose = vi.fn().mockResolvedValue({});
  mockSandbox = { close: mockClose } as unknown as Sandbox;
  mockCreateSandbox.mockResolvedValue(mockSandbox);
  mockOpenPr.mockResolvedValue({ url: "https://github.com/org/repo/pull/1", number: 1 });
});

describe("runPlanDraft", () => {
  it("creates an isolated sandbox on the issue's branch", async () => {
    mockRunAgent.mockResolvedValue(emptyRunResult);

    await runPlanDraft(baseOpts);

    expect(mockCreateSandbox).toHaveBeenCalledWith(
      expect.objectContaining({ branch: "issue-42" }),
    );
  });

  it("calls the plan-drafter with ISSUE_ID, ISSUE_TITLE, PRD_PATH, and BRANCH", async () => {
    mockRunAgent.mockResolvedValue(emptyRunResult);

    await runPlanDraft(baseOpts);

    expect(mockRunAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "plan-drafter",
        promptArgs: expect.objectContaining({
          ISSUE_ID: "42",
          ISSUE_TITLE: "Add auth flow",
          PRD_PATH: "docs/prd.md",
          BRANCH: "issue-42",
        }),
      }),
      mockSandbox,
    );
  });

  it("returns commits produced by the plan-drafter", async () => {
    mockRunAgent.mockResolvedValue({
      commits: [{ sha: "speccommit1" }],
      stdout: "",
      iterations: [],
    });

    const result = await runPlanDraft(baseOpts);

    expect(result.commits).toEqual([{ sha: "speccommit1" }]);
  });

  it("closes the sandbox after the plan-draft run", async () => {
    mockRunAgent.mockResolvedValue(emptyRunResult);

    await runPlanDraft(baseOpts);

    expect(mockClose).toHaveBeenCalledOnce();
  });

  it("closes the sandbox even when the agent throws", async () => {
    mockRunAgent.mockRejectedValue(new Error("spec agent crashed"));

    await expect(runPlanDraft(baseOpts)).rejects.toThrow("spec agent crashed");

    expect(mockClose).toHaveBeenCalledOnce();
  });

  it("opens a PR for the issue after the agent runs", async () => {
    mockRunAgent.mockResolvedValue(emptyRunResult);

    await runPlanDraft(baseOpts);

    expect(mockOpenPr).toHaveBeenCalledOnce();
    expect(mockOpenPr).toHaveBeenCalledWith(issue);
  });

  it("returns the PR url and number in the result", async () => {
    mockRunAgent.mockResolvedValue(emptyRunResult);
    mockOpenPr.mockResolvedValue({ url: "https://github.com/org/repo/pull/99", number: 99 });

    const result = await runPlanDraft(baseOpts);

    expect(result.pr).toEqual({ url: "https://github.com/org/repo/pull/99", number: 99 });
  });

  it("does not open a PR when the agent throws", async () => {
    mockRunAgent.mockRejectedValue(new Error("agent error"));

    await expect(runPlanDraft(baseOpts)).rejects.toThrow();

    expect(mockOpenPr).not.toHaveBeenCalled();
  });
});
