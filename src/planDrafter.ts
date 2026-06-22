import * as sandcastle from "@ai-hero/sandcastle";
import { docker } from "@ai-hero/sandcastle/sandboxes/docker";
import type { AgentProvider, SandboxHooks } from "@ai-hero/sandcastle";
import { runAgent } from "./runAgent.js";
import type { PlanIssue } from "./planner.js";

export type PlanDraftResult = {
  readonly commits: { sha: string }[];
};

export type RunPlanDraftOptions = {
  readonly issue: PlanIssue;
  readonly agent: AgentProvider;
  readonly prdPath: string;
  readonly hooks?: SandboxHooks;
};

export async function runPlanDraft(opts: RunPlanDraftOptions): Promise<PlanDraftResult> {
  const sandbox = await sandcastle.createSandbox({
    branch: opts.issue.branch,
    sandbox: docker(),
    hooks: opts.hooks,
  });

  try {
    const result = await runAgent(
      {
        name: "plan-drafter",
        maxIterations: 1,
        agent: opts.agent,
        promptFile: ".sandcastle/plan-draft-prompt.md",
        promptArgs: {
          ISSUE_ID: opts.issue.id,
          ISSUE_TITLE: opts.issue.title,
          PRD_PATH: opts.prdPath,
          BRANCH: opts.issue.branch,
        },
      },
      sandbox,
    );

    return { commits: result.commits };
  } finally {
    await sandbox.close();
  }
}
