# Agent Rules — Agent Pipeline Repo

Rules for Claude Code agents implementing tasks in this repo. Read alongside `CLAUDE.md`.

## Scope

Only work on the task specified in the prompt. Do not touch unrelated files or fix unrelated issues.

## Branch

Work on the branch given in the task prompt. Branch names are deterministic (`issue-{id}`); do not invent new branch names.

## Implementation discipline

- Satisfy the acceptance criterion in the build plan — no more, no less.
- No speculative abstractions. Three similar lines beat a premature helper.
- No feature flags or backwards-compatibility shims — just change the code.
- No error handling for scenarios that cannot happen. Trust internal contracts.
- Default to no comments. One short comment only when the WHY is non-obvious.

## TypeScript

- Strict mode. No `any`; prefer `unknown` + narrowing.
- Explicit return types on exported functions.
- No barrel re-exports until there is a real public API surface.

## Testing

- Tests live in `src/__tests__/` or co-located as `*.test.ts`.
- Write one test per behavior; cover the acceptance criterion directly.
- Run `npm run typecheck && npm run test` before committing.

## Commits

- One logical commit per AC satisfied.
- Format: `<scope>: <imperative summary>` (e.g. `runAgent: wrap sandcastle.run behind thin interface`)
- Include the build-plan task ID in the commit body (e.g. `Build plan: 1.1`).

## After the task

Update `ai/status.md`:
- Move the completed task to **Done**.
- Set **Next task** to the next build-plan item.
- Do not start the next task — stop and let the human review.

## Sandcastle sandbox hygiene

`runImplement` and `runPlanDraft` both close their sandbox in a `finally` block, so a clean Ctrl+C (SIGINT) will let the current operation finish and release the sandbox before the process exits. If the process is killed hard (SIGKILL, power loss, or a crash before the `finally` runs), orphaned resources may remain. Before restarting the pipeline after an unclean exit, check:
- Orphaned worktrees: `.sandcastle/worktrees/`
- Orphaned Docker containers: `docker ps -a --filter name=sandcastle`
