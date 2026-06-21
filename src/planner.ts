import * as sandcastle from "@ai-hero/sandcastle";
import { z } from "zod";
import type { AgentProvider, SandboxHooks } from "@ai-hero/sandcastle";
import { runAgent } from "./runAgent.js";
import { issueBranchName } from "./branchName.js";

const planSchema = z.object({
  issues: z.array(
    z.object({ id: z.string(), title: z.string(), branch: z.string() }),
  ),
});

export type PlanIssue = z.infer<typeof planSchema>["issues"][number];

export type RunPlannerOptions = {
  readonly K: number;
  readonly agent: AgentProvider;
  readonly hooks?: SandboxHooks;
};

export async function runPlanner(opts: RunPlannerOptions): Promise<PlanIssue[]> {
  const plan = await runAgent<z.infer<typeof planSchema>>({
    name: "planner",
    maxIterations: 1,
    agent: opts.agent,
    promptFile: ".sandcastle/plan-prompt.md",
    hooks: opts.hooks,
    promptArgs: { K: opts.K },
    output: sandcastle.Output.object({ tag: "plan", schema: planSchema }),
  });

  return plan.output.issues
    .slice(0, opts.K)
    .map((issue) => ({ ...issue, branch: issueBranchName(issue.id) }));
}
