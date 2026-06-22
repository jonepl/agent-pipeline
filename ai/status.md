# Status

## Current phase
Phase 3 — Mode B (Actions). Next task: 3.1 label state machine.

## Done
- pipeline-sandbox throwaway repo confirmed the reference loop end-to-end
- ADR, build plan, and onboarding checklist authored
- Phase 0.3: CLAUDE.md, ai/rules.md, README.md (cold-start prompt) established
- Phase 1.1: `runAgent` extracted; TypeScript project scaffolded; template loop uses `runAgent` throughout; 4 unit tests pass.
- Phase 1.2: `runPlanner` extracted; prompt uses `--label ready` + `{{K}}` cap; code-level cap enforced; 4 unit tests verify K passthrough and cap at K.
- Phase 1.3: `issueBranchName` extracted; `runPlanner` normalizes every plan issue's branch to `issue-{id}` regardless of LLM output; 3 + 2 tests verify format, determinism, and normalization.
- Phase 1.4: `runImplement` extracted; creates an isolated Sandcastle sandbox on `issue.branch`, runs implementer then (conditionally) reviewer, closes sandbox in `finally`; 8 tests cover sandbox creation, promptArgs, commit forwarding, reviewer gating, combined commits, and sandbox cleanup on error.
- Phase 2.1 (partial — spec artifact only): `runPlanDraft` extracted; `plan-draft-prompt.md` instructs agent to write `docs/specs/issue-{id}.md` with a mandatory non-empty "Requirements covered" section citing PRD passages and commit it; validated end-to-end via issue-2. Draft PR step deferred to Phase 4.1 (belongs in mode B).

## Next task
Phase 3.1 — label state machine.
AC: each label transition is driven by exactly one event/label and is idempotent (no double-dispatch).

## Notes
- Build plan reordered 2026-06-22: gates (originally Phase 2.2–2.7) moved to Phase 4, to be wired into the Actions model Phase 3 establishes. Sequencing rationale in `docs/build-plan.md`.
- Issues are not auto-closed after merge — manual `gh issue close <n>` required until Phase 3.5 implements the merge → re-plan trigger.
- Loop runs up to 10 iterations if issue stays open — expected for the mode-A local loop at this stage.
