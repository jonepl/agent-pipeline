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

## Next task
Phase 2.1 — plan-as-spec artifact.
AC: spec file present on branch; covered-requirements section non-empty.
