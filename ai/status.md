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
- Phase 3.1: `src/labels.ts` defines the full label taxonomy (`LABELS` + `Label` type); `src/labelMachine.ts` defines `TRANSITIONS` (happy-path chain, each `from`/`to` unique), `applyTransition` (idempotent, no-op on wrong state), `parkIssue`, `resumeFromPark`; 13 tests directly prove single-trigger and no-double-dispatch invariants, idempotency, and the full happy-path chain.
- Phase 3.2: 4 workflow YAMLs in `.github/workflows/` (`derive-graph`, `draft-plan`, `implement`, `verify`), each triggered by exactly one label event matching the TRANSITIONS table; 4 entrypoint scripts in `.github/scripts/` calling the corresponding `src/` functions; label updates in YAML steps (`--add-label`/`--remove-label`) keep state entirely in GitHub; park-on-failure step in every workflow; 12 tests verify trigger labels, target labels, and failure parks.
- Phase 3.3 pre-flight fixes: (1) `GH_TOKEN` + `GH_HOST` now forwarded into the Docker container via `claudeCode({ env: {...} })` in all 3 entrypoint scripts (`derive-graph.mts`, `draft-plan.mts`, `implement.mts`); (2) all `gh` CLI steps in workflow YAMLs (advance + park steps) now carry a step-level `env: GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}` override so label edits use the Actions-provided token, not the PAT.
- Phase 3.3 auth fix: Investigated `CLAUDE_CODE_OAUTH_TOKEN` propagation. Finding: `sandcastle.run()` path (used by `derive-graph`) correctly threads `agentProviderEnv` into Docker via `-e` flags — `claudeCode({ env })` fix works there. `createSandbox()` path (used by `draft-plan`, `implement`) hardcodes `agentProviderEnv: {}` in `createSandboxFromWorktree` (index.js:1772), silently dropping `claudeCode({ env })` options. Fix: added `sandboxEnv?: Record<string, string>` to `RunPlanDraftOptions` and `RunImplementOptions`; both now pass it to `docker({ env: opts.sandboxEnv })`. Entrypoint scripts for `draft-plan` and `implement` now use `sandboxEnv` instead of `claudeCode({ env })`. Confirmed `CLAUDE_CODE_OAUTH_TOKEN` (not `ANTHROPIC_API_KEY`) is the correct env var; confirmed env from `docker run -e` is visible in `docker exec` processes. All 62 tests pass.

## Next task
Phase 3.3 — Sandcastle-in-runner.
AC: a task completes identically local vs. Actions on the same input.

## Notes
- Build plan reordered 2026-06-22: gates (originally Phase 2.2–2.7) moved to Phase 4, to be wired into the Actions model Phase 3 establishes. Sequencing rationale in `docs/build-plan.md`.
- Issues are not auto-closed after merge — manual `gh issue close <n>` required until Phase 3.5 implements the merge → re-plan trigger.
- Loop runs up to 10 iterations if issue stays open — expected for the mode-A local loop at this stage.
