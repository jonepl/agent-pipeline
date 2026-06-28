---
# Status

## Current phase
Phase 4 — Gates wired into polling loop (in progress).

## Done
- pipeline-sandbox throwaway repo confirmed the reference loop end-to-end
- ADR, build plan, and onboarding checklist authored
- Phase 0.3: CLAUDE.md, ai/rules.md, README.md cold-start prompt established
- Phase 1.1: runAgent extracted; TypeScript project scaffolded; 4 unit tests pass
- Phase 1.2: runPlanner extracted; ready label + K cap; 4 unit tests pass
- Phase 1.3: issueBranchName extracted; deterministic branch naming; 5 tests pass
- Phase 1.4: runImplement extracted; isolated sandbox, implementer + reviewer; 8 tests pass
- Phase 2.1 (partial): runPlanDraft extracted; spec with "Requirements covered" section validated end-to-end; draft PR step deferred to Phase 4.1
- Phase 3.1 (labels/machine): label taxonomy (LABELS + Label type) and labelMachine (TRANSITIONS, applyTransition, parkIssue, resumeFromPark); 13 tests pass
- Phase 3.2: 4 Actions workflow YAMLs + 4 entrypoint scripts (archived — deferred)
- Phase 3.3 (partial): sandboxEnv fix — CLAUDE_CODE_OAUTH_TOKEN now correctly forwarded into createSandbox() path via docker({ env: opts.sandboxEnv }). All 62 tests pass. Actions auth resolved but pivot made before first clean Actions run.
- Phase 3.1 (revised) — Config surface: pipeline.config.ts PipelineConfig type, DEFAULT_CONFIG, defineConfig, mergeConfig, loadConfig; workflows.test.ts deleted (archived); 61 tests pass.
- Phase 3.2 — Polling loop skeleton: src/poll.ts exports tick (PollDeps-injected cycle logic) and startPoll(config, deps) returning PollHandle {stop, done}; default deps use gh via execSync; 9 tests cover dispatch capping, in-flight accounting, deriveUnblocked delegation, and multi-cycle lifecycle; 70 tests pass.
- Phase 3.3 — Gate checks: GhIssueWithLabels type; countInFlight replaced by listInFlightIssues (returns issues + labels, count derived from length); dispatchImplement / dispatchVerify / isPrMerged / closeIssue added to PollDeps; tick loops over in-flight issues and fires gate handlers (plan-approved → implement, verifying → verify, merged PR → close); makeDefaultDeps(config) replaces static DEFAULT_DEPS; 6 new gate tests; 76 tests pass.
- Phase 3.4 — Entrypoint: src/index.ts loads config via loadConfig(), starts loop via startPoll(config) (real deps via default arg), wires SIGINT/SIGTERM to handle.stop(), awaits handle.done, logs startup message; package.json gains bin field and start script; 76 tests pass.
- Phase 3.5 — Graceful shutdown: verified that runImplement and runPlanDraft already close their sandboxes in finally blocks; SIGINT sets running=false and the in-progress operation finishes its finally before the process exits — no orphaned containers or worktrees on clean exit; sandbox hygiene note added to ai/rules.md; no code changes required; 76 tests pass.

## Pivot rationale
Docker-in-CI auth intractable for solo dev setup. Pivoting to local 
always-on polling loop — simpler, no cloud ops, same GitHub label 
state machine. Actions support deferred to future phase.

- Phase 4.1 — Evolving PR: runPlanDraft gains openPr dep (PrInfo type, ghOpenPr production helper); after agent commits spec, calls openPr(issue) and returns pr in PlanDraftResult; 3 new tests; 79 tests pass.
- Phase 4.2 — Dispatch wiring: makeDefaultDeps in poll.ts wired with real runPlanDraft (dispatch) and runImplement (dispatchImplement); label transitions via ghLabelIssue (gh issue edit); sandboxEnv built from process.env; re-plan gate added to tick (hasFeedbackComments + dispatchRePlan deps); ghHasFeedbackComments checks PR comments via gh pr view; ghFetchPr used for re-plan openPr to return existing PR; 3 new gate tests; 82 tests pass.
- Worktree fix — plan-draft-prompt.md updated to add -R jonepl/agent-pipeline to all gh commands and git push before PR creation; ISSUE_NUMBER added as promptArg in planDrafter.ts; ghOpenPr updated to get-or-create (checks gh pr list before creating) so agent-opened PRs are not duplicated; all tests pass.

## Next task
Validate plan-draft end-to-end with a fresh issue: file a ready issue, run npx tsx src/index.ts, confirm spec committed on issue branch and draft PR opened.

## Known behavior (not bugs)
- Issues not auto-closed after merge — manual gh issue close <n> 
  required until Phase 4.7 implements merge detection
- Loop runs up to 10 iterations if issue stays open — expected for 
  mode-A local loop until polling loop replaces it
- sandboxEnv fix confirmed working locally; not yet validated in Actions
---
