---
# Status

## Current phase
Phase 3 — Polling loop (local always-on). Next task: Phase 3.1 — config surface.

## Done
- pipeline-sandbox throwaway repo confirmed the reference loop end-to-end
- ADR, build plan, and onboarding checklist authored
- Phase 0.3: CLAUDE.md, ai/rules.md, README.md cold-start prompt established
- Phase 1.1: runAgent extracted; TypeScript project scaffolded; 4 unit tests pass
- Phase 1.2: runPlanner extracted; ready label + K cap; 4 unit tests pass
- Phase 1.3: issueBranchName extracted; deterministic branch naming; 5 tests pass
- Phase 1.4: runImplement extracted; isolated sandbox, implementer + reviewer; 8 tests pass
- Phase 2.1 (partial): runPlanDraft extracted; spec with "Requirements covered" section validated end-to-end; draft PR step deferred to Phase 4.1
- Phase 3.1: label taxonomy (LABELS + Label type) and labelMachine (TRANSITIONS, applyTransition, parkIssue, resumeFromPark); 13 tests pass
- Phase 3.2: 4 Actions workflow YAMLs + 4 entrypoint scripts (archived — deferred)
- Phase 3.3 (partial): sandboxEnv fix — CLAUDE_CODE_OAUTH_TOKEN now correctly forwarded into createSandbox() path via docker({ env: opts.sandboxEnv }). All 62 tests pass. Actions auth resolved but pivot made before first clean Actions run.

## Pivot rationale
Docker-in-CI auth intractable for solo dev setup. Pivoting to local 
always-on polling loop — simpler, no cloud ops, same GitHub label 
state machine. Actions support deferred to future phase.

## Next task
Phase 3.1 (revised) — Config surface.
Implement pipeline.config.ts with all autonomy toggles: K, 
pollIntervalMs (default 30000), prdPath, selfHeal, selfHealBudget, 
redispatch, model assignments, label names.
AC: changing a config value changes pipeline behavior with no code edit.

## Known behavior (not bugs)
- Issues not auto-closed after merge — manual gh issue close <n> 
  required until Phase 4.7 implements merge detection
- Loop runs up to 10 iterations if issue stays open — expected for 
  mode-A local loop until polling loop replaces it
- sandboxEnv fix confirmed working locally; not yet validated in Actions
---
