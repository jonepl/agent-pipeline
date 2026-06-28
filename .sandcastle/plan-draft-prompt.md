# TASK

Draft the implementation spec for issue {{ISSUE_NUMBER}}: {{ISSUE_TITLE}}.

**Important context:** You are running inside a Sandcastle worktree. The
`.git` entry is a file pointer, not a full clone, so `gh` cannot auto-detect
the remote. Always pass `-R jonepl/agent-pipeline` to every `gh` command.
Plain `git` commands (add, commit, push) work normally from
`/home/agent/workspace`.

# STEP 0 — Configure git credentials

The container does not have SSH push access. Set up HTTPS push via the
injected `GH_TOKEN` before doing anything else:

```sh
git remote set-url origin "https://x-access-token:${GH_TOKEN}@github.com/jonepl/agent-pipeline.git"
```

# STEP 1 — Read the issue

```sh
gh issue view {{ISSUE_NUMBER}} -R jonepl/agent-pipeline
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

# STEP 5 — Push the branch and open a draft PR

Push the branch:

```sh
git push origin issue-{{ISSUE_NUMBER}}
```

Check whether a PR already exists for this branch:

```sh
gh pr list --head {{BRANCH}} --state open --json number --jq 'length' -R jonepl/agent-pipeline
```

If the result is `0`, open one:

```sh
gh pr create -R jonepl/agent-pipeline \
  --draft \
  --head {{BRANCH}} \
  --title "issue-{{ISSUE_NUMBER}}: {{ISSUE_TITLE}}" \
  --body "Implementation spec for review. Code commits follow after plan approval."
```

If a PR already exists, skip this step.

Once complete, output <promise>COMPLETE</promise>.
