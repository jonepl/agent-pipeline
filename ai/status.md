# Status

## Current phase
Phase 1 — in progress.

## Done
- pipeline-sandbox throwaway repo confirmed the reference loop end-to-end
- ADR, build plan, and onboarding checklist authored
- Phase 0.3: CLAUDE.md, ai/rules.md, README.md (cold-start prompt) established
- Phase 1.1: `runAgent` extracted; TypeScript project scaffolded; template loop uses `runAgent` throughout; 4 unit tests pass.

## Next task
Phase 1.2 — adapt the planner prompt so it derives the graph from `ready` issues, emits only unblocked issues, and respects a concurrency cap input.
AC: given a seeded dependency graph, the planner emits exactly the unblocked set, capped at `K`.
