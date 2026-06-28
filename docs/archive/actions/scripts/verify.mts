// Phase 4.5 — verify agent wired here once implemented.
// For now, exits successfully so the workflow can advance to awaiting-merge.
const issueId = process.env["ISSUE_NUMBER"];
if (!issueId) throw new Error("ISSUE_NUMBER env var is required");

console.log(`Verification stub for issue ${issueId} — passes unconditionally until Phase 4.5.`);
