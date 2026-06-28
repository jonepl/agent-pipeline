import { execSync } from "node:child_process";
import * as sandcastle from "@ai-hero/sandcastle";
import { docker } from "@ai-hero/sandcastle/sandboxes/docker";
import type { AgentProvider, SandboxHooks } from "@ai-hero/sandcastle";
import { runAgent } from "./runAgent.js";
import type { PlanIssue } from "./planner.js";

export type PrInfo = {
  readonly url: string;
  readonly number: number;
};

export type PlanDraftResult = {
  readonly commits: { sha: string }[];
  readonly pr: PrInfo;
};

export type RunPlanDraftOptions = {
  readonly issue: PlanIssue;
  readonly agent: AgentProvider;
  readonly prdPath: string;
  readonly hooks?: SandboxHooks;
  /** Env vars injected into the Docker container at sandbox start time. */
  readonly sandboxEnv?: Record<string, string>;
  readonly openPr: (issue: PlanIssue) => Promise<PrInfo>;
};

/** Production openPr implementation: returns existing PR if one exists for the branch, otherwise creates one. */
export function ghOpenPr(label: string): (issue: PlanIssue) => Promise<PrInfo> {
  return (issue) => {
    const listRaw = execSync(
      `gh pr list --head "${issue.branch}" --state open --json number,url`,
      { encoding: "utf8" },
    );
    const existing = JSON.parse(listRaw) as Array<{ number: number; url: string }>;
    if (existing.length > 0) {
      return Promise.resolve({ url: existing[0]!.url, number: existing[0]!.number });
    }
    const url = execSync(
      `gh pr create --title "Plan: ${issue.title}" --head "${issue.branch}" --label "${label}" --body "Spec draft for #${issue.id}"`,
      { encoding: "utf8" },
    ).trim();
    const number = parseInt(url.split("/").at(-1) ?? "", 10);
    if (isNaN(number)) throw new Error(`could not parse PR number from: ${url}`);
    return Promise.resolve({ url, number });
  };
}

export async function runPlanDraft(opts: RunPlanDraftOptions): Promise<PlanDraftResult> {
  const sandbox = await sandcastle.createSandbox({
    branch: opts.issue.branch,
    sandbox: docker({ env: opts.sandboxEnv }),
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
          ISSUE_NUMBER: opts.issue.id,
          ISSUE_TITLE: opts.issue.title,
          PRD_PATH: opts.prdPath,
          BRANCH: opts.issue.branch,
        },
      },
      sandbox,
    );

    const pr = await opts.openPr(opts.issue);
    return { commits: result.commits, pr };
  } finally {
    await sandbox.close();
  }
}
