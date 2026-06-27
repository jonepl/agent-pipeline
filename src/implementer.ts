import * as sandcastle from "@ai-hero/sandcastle";
import { docker } from "@ai-hero/sandcastle/sandboxes/docker";
import type { AgentProvider, SandboxHooks } from "@ai-hero/sandcastle";
import { runAgent } from "./runAgent.js";
import type { PlanIssue } from "./planner.js";

export type ImplementResult = {
  readonly commits: { sha: string }[];
};

export type RunImplementOptions = {
  readonly issue: PlanIssue;
  readonly implementerAgent: AgentProvider;
  readonly reviewerAgent: AgentProvider;
  readonly hooks?: SandboxHooks;
  readonly copyToWorktree?: string[];
  /** Env vars injected into the Docker container at sandbox start time. */
  readonly sandboxEnv?: Record<string, string>;
};

export async function runImplement(opts: RunImplementOptions): Promise<ImplementResult> {
  const sandbox = await sandcastle.createSandbox({
    branch: opts.issue.branch,
    sandbox: docker({ env: opts.sandboxEnv }),
    hooks: opts.hooks,
    copyToWorktree: opts.copyToWorktree,
  });

  try {
    const implement = await runAgent(
      {
        name: "implementer",
        maxIterations: 100,
        agent: opts.implementerAgent,
        promptFile: ".sandcastle/implement-prompt.md",
        promptArgs: {
          TASK_ID: opts.issue.id,
          ISSUE_TITLE: opts.issue.title,
          BRANCH: opts.issue.branch,
        },
      },
      sandbox,
    );

    if (implement.commits.length === 0) {
      return { commits: [] };
    }

    const review = await runAgent(
      {
        name: "reviewer",
        maxIterations: 1,
        agent: opts.reviewerAgent,
        promptFile: ".sandcastle/review-prompt.md",
        promptArgs: { BRANCH: opts.issue.branch },
      },
      sandbox,
    );

    return { commits: [...implement.commits, ...review.commits] };
  } finally {
    await sandbox.close();
  }
}
