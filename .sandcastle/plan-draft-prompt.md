# TASK

Draft the implementation spec for issue {{ISSUE_ID}}: {{ISSUE_TITLE}}.

# STEP 1 — Read the issue

```sh
gh issue view {{ISSUE_ID}}
```

Pull in all comments too; they may contain clarifications from the human reviewer.

# STEP 2 — Read the PRD

Read the project requirements document at `{{PRD_PATH}}`. Identify every section this issue addresses.

# STEP 3 — Write the spec

Write the spec to `docs/specs/issue-{{ISSUE_ID}}.md`. The file must contain all of the following sections:

```markdown
# Spec: issue-{{ISSUE_ID}} — {{ISSUE_TITLE}}

## Summary

[One paragraph describing what this issue implements and why.]

## Acceptance criteria

- [Verifiable behavior 1]
- [Verifiable behavior 2]

## Implementation plan

1. [Step 1]
2. [Step 2]

## Requirements covered

- § "[exact heading or short quote from the PRD]" — [how this issue addresses it]
- § "[another PRD passage]" — [relevance]
```

**Critical:** The `## Requirements covered` section must cite at least one specific PRD passage by heading or short quote. Do not leave it empty, do not write a placeholder like "TBD" or "N/A".

# STEP 4 — Commit the spec

```sh
git add docs/specs/issue-{{ISSUE_ID}}.md
git commit -m "spec: draft spec for issue-{{ISSUE_ID}}"
```

# STEP 5 — Open an evolving PR

Check whether a PR already exists for this branch:

```sh
gh pr list --head {{BRANCH}} --state open --json number --jq 'length'
```

If the result is `0`, open one:

```sh
gh pr create \
  --title "issue-{{ISSUE_ID}}: {{ISSUE_TITLE}}" \
  --body "Implementation spec for review. Code commits follow after plan approval." \
  --draft \
  --head {{BRANCH}}
```

If a PR already exists, skip this step.

Once complete, output <promise>COMPLETE</promise>.
