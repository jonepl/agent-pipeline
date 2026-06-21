# ISSUES

Here are the open `ready` issues in the repo:

<issues-json>

!`gh issue list --state open --label ready --limit 100 --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'`

</issues-json>

# TASK

Analyze the open issues and build a dependency graph. For each issue, determine whether it **blocks** or **is blocked by** any other open issue.

An issue B is **blocked by** issue A if:

- B requires code or infrastructure that A introduces
- B and A modify overlapping files or modules, making concurrent work likely to produce merge conflicts
- B's requirements depend on a decision or API shape that A will establish

An issue is **unblocked** if it has zero blocking dependencies on other open issues.

For each unblocked issue, assign a branch name using the exact format `issue-{id}` (no slug or other suffix). This must be deterministic so that re-planning the same issue always produces the same branch name and accumulated progress is preserved.

# CONCURRENCY CAP

The concurrency cap for this round is **{{K}}**.

Include **at most {{K}} issues** in your plan. Prioritize by fewest blocking dependents (issues that unblock the most work come first), then by issue number ascending.

If every issue is blocked, include the single highest-priority candidate (the one with the fewest or weakest dependencies), subject to the cap.

# OUTPUT

Output your plan as a JSON object wrapped in `<plan>` tags:

<plan>
{"issues": [{"id": "42", "title": "Fix auth bug", "branch": "issue-42"}]}
</plan>

Include only unblocked issues, up to the concurrency cap of {{K}}.

Always emit the `<plan>` tags, even when there is nothing to do. If there are no issues to work on at all, output `<plan>{"issues": []}</plan>` so the run can exit cleanly.
