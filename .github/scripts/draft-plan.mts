import * as sandcastle from "@ai-hero/sandcastle";
import { runPlanDraft } from "../../src/planDrafter.js";
import { issueBranchName } from "../../src/branchName.js";

const issueId = process.env["ISSUE_NUMBER"];
const issueTitle = process.env["ISSUE_TITLE"] ?? "";
const prdPath = process.env["PIPELINE_PRD_PATH"] ?? "docs/prd.md";

if (!issueId) throw new Error("ISSUE_NUMBER env var is required");

await runPlanDraft({
  issue: { id: issueId, title: issueTitle, branch: issueBranchName(issueId) },
  agent: sandcastle.claudeCode("claude-opus-4-8"),
  prdPath,
});
