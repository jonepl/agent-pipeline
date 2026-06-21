import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Sandbox, SandboxRunResult, AgentProvider } from "@ai-hero/sandcastle";

vi.mock("@ai-hero/sandcastle", () => ({
  run: vi.fn().mockResolvedValue({
    commits: [],
    stdout: "",
    iterations: [],
    branch: "main",
  }),
  Output: {
    object: (o: unknown) => ({ _tag: "object", ...(o as object) }),
  },
}));

vi.mock("@ai-hero/sandcastle/sandboxes/docker", () => ({
  docker: vi.fn(() => ({ type: "docker" })),
}));

import * as sandcastle from "@ai-hero/sandcastle";
import { runAgent } from "../runAgent.js";

const mockAgent = {} as AgentProvider;

const baseOpts = {
  name: "test",
  maxIterations: 1,
  agent: mockAgent,
  promptFile: "./test.md",
};

const emptyResult: SandboxRunResult = {
  commits: [],
  stdout: "",
  iterations: [],
};

beforeEach(() => {
  vi.mocked(sandcastle.run).mockClear();
  vi.mocked(sandcastle.run).mockResolvedValue({
    ...emptyResult,
    branch: "main",
    commits: [],
  });
});

describe("runAgent", () => {
  it("delegates to sandcastle.run when no sandbox is provided", async () => {
    await runAgent(baseOpts);

    expect(sandcastle.run).toHaveBeenCalledOnce();
    expect(sandcastle.run).toHaveBeenCalledWith(
      expect.objectContaining({ name: "test", promptFile: "./test.md" })
    );
  });

  it("passes hooks to sandcastle.run", async () => {
    const hooks = { sandbox: { onSandboxReady: [{ command: "npm install" }] } };
    await runAgent({ ...baseOpts, hooks });

    expect(sandcastle.run).toHaveBeenCalledWith(
      expect.objectContaining({ hooks })
    );
  });

  it("delegates to sandbox.run when sandbox is provided", async () => {
    const sandboxRun = vi.fn().mockResolvedValue({
      commits: [{ sha: "abc123" }],
      stdout: "done",
      iterations: [],
    });
    const mockSandbox = { run: sandboxRun } as unknown as Sandbox;

    const result = await runAgent(baseOpts, mockSandbox);

    expect(sandboxRun).toHaveBeenCalledOnce();
    expect(sandcastle.run).not.toHaveBeenCalled();
    expect(result.commits).toEqual([{ sha: "abc123" }]);
  });

  it("passes promptArgs to sandbox.run", async () => {
    const sandboxRun = vi.fn().mockResolvedValue(emptyResult);
    const mockSandbox = { run: sandboxRun } as unknown as Sandbox;
    const promptArgs = { TASK_ID: "42", ISSUE_TITLE: "Fix bug" };

    await runAgent({ ...baseOpts, promptArgs }, mockSandbox);

    expect(sandboxRun).toHaveBeenCalledWith(
      expect.objectContaining({ promptArgs })
    );
  });
});
