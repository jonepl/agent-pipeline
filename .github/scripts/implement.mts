import * as sandcastle from "@ai-hero/sandcastle";
import { runImplement } from "../../src/implementer.js";
import { issueBranchName } from "../../src/branchName.js";

const issueId = process.env["ISSUE_NUMBER"];
const issueTitle = process.env["ISSUE_TITLE"] ?? "";

if (!issueId) throw new Error("ISSUE_NUMBER env var is required");

const sandcastleEnv = {
  GH_TOKEN: process.env["GH_TOKEN"] ?? "",
  GH_HOST: process.env["GH_HOST"] ?? "github.com",
};

await runImplement({
  issue: { id: issueId, title: issueTitle, branch: issueBranchName(issueId) },
  implementerAgent: sandcastle.claudeCode("claude-opus-4-8", { env: sandcastleEnv }),
  reviewerAgent: sandcastle.claudeCode("claude-sonnet-4-6", { env: sandcastleEnv }),
});
