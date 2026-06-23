import * as sandcastle from "@ai-hero/sandcastle";
import { runImplement } from "../../src/implementer.js";
import { issueBranchName } from "../../src/branchName.js";

const issueId = process.env["ISSUE_NUMBER"];
const issueTitle = process.env["ISSUE_TITLE"] ?? "";

if (!issueId) throw new Error("ISSUE_NUMBER env var is required");

await runImplement({
  issue: { id: issueId, title: issueTitle, branch: issueBranchName(issueId) },
  implementerAgent: sandcastle.claudeCode("claude-opus-4-8"),
  reviewerAgent: sandcastle.claudeCode("claude-sonnet-4-6"),
});
