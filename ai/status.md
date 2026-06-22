# Status

## Current phase
Phase 1 — in progress.

## Done
- pipeline-sandbox throwaway repo confirmed the reference loop end-to-end
- ADR, build plan, and onboarding checklist authored
- Phase 0.3: CLAUDE.md, ai/rules.md, README.md (cold-start prompt) established
- Phase 1.1: `runAgent` extracted; TypeScript project scaffolded; template loop uses `runAgent` throughout; 4 unit tests pass.
- Phase 1.2: `runPlanner` extracted; prompt uses `--label ready` + `{{K}}` cap; code-level cap enforced; 4 unit tests verify K passthrough and cap at K.
- Phase 1.3: `issueBranchName` extracted; `runPlanner` normalizes every plan issue's branch to `issue-{id}` regardless of LLM output; 3 + 2 tests verify format, determinism, and normalization.
- Phase 1.4: `runImplement` extracted; creates an isolated Sandcastle sandbox on `issue.branch`, runs implementer then (conditionally) reviewer, closes sandbox in `finally`; 8 tests cover sandbox creation, promptArgs, commit forwarding, reviewer gating, combined commits, and sandbox cleanup on error.
- Phase 2.1: plan-as-spec artifact verified via issue-2 — spec drafted to `docs/specs/issue-2.md` on the `issue-2` branch with a non-empty "Requirements covered" section; `src/utils.ts` exports `multiply(a, b)` (no `any`), covered by 3 unit tests.

## Next task
Phase 2.2 — next build-plan task.

## Known behavior (not bugs)
- Issues are not auto-closed after merge — manual `gh issue close <n>` 
  required until Phase 3.5 implements the merge → re-plan trigger.
- Loop runs up to 10 iterations if issue stays open — expected for 
  the mode-A local loop at this stage.
