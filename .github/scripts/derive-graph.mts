import { execSync } from "node:child_process";
import * as sandcastle from "@ai-hero/sandcastle";
import { runPlanner } from "../../src/planner.js";
import { LABELS } from "../../src/labels.js";
import { applyTransition } from "../../src/labelMachine.js";

const K = Number(process.env["PIPELINE_K"] ?? "1");

const issues = await runPlanner({
  K,
  agent: sandcastle.claudeCode("claude-opus-4-8"),
});

for (const issue of issues) {
  const raw = execSync(
    `gh issue view ${issue.id} --json labels --jq '[.labels[].name]'`,
  ).toString().trim();

  const currentLabels: string[] = JSON.parse(raw);
  const { changed } = applyTransition(currentLabels, LABELS.READY, LABELS.READY_TO_PLAN);

  if (changed) {
    execSync(
      `gh issue edit ${issue.id} --add-label "${LABELS.READY_TO_PLAN}" --remove-label "${LABELS.READY}"`,
      { stdio: "inherit" },
    );
    console.log(`  ${issue.id}: ${LABELS.READY} → ${LABELS.READY_TO_PLAN}`);
  } else {
    console.log(`  ${issue.id}: already at ${LABELS.READY_TO_PLAN}, skipped`);
  }
}
