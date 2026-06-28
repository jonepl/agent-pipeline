# Build Plan — Multi-Agent Pipeline (Bootstrap)

**Revised:** Pivoted to local always-on polling loop. GitHub Actions workflows removed from scope. The pipeline is a persistent `tsx` process on the developer's Mac.

Each task has an **acceptance criterion** (AC). Work in order; phases gate on each other. Run Claude Code at the pipeline repo root.

---

## Phase 0 — Repo & scaffold ✅
- **0.1** Repo created, ADR committed.
- **0.2** Sandcastle scaffold validated end-to-end (pipeline-sandbox).
- **0.3** ACS files established (`CLAUDE.md`, `ai/rules.md`, `ai/status.md`, README).

## Phase 1 — Execution layer ✅
- **1.1** `runAgent` wrapper extracted. Template loop works through `runAgent`.
- **1.2** Planner prompt adapted. Emits unblocked set capped at `K`.
- **1.3** Deterministic branch naming. `issue-{id}` is a code-level invariant.
- **1.4** `runImplement` extracted. Implementer + reviewer run in isolated sandbox.

## Phase 2 — Plan-as-spec artifact ✅ (partial)
- **2.1** Plan agent writes spec with "Requirements covered" section, commits to `issue-{id}`. AC: spec file present; covered-requirements non-empty. *(Spec artifact validated; PR gate deferred to Phase 4.)*

## Phase 3 — Polling loop (replaces Actions)

> This phase replaces the GitHub Actions event-driven model. The polling loop is the orchestrator.

- **3.1** **Config surface.** A single config file (`pipeline.config.ts` or `pipeline.config.json`) holds all autonomy toggles: `K`, `pollIntervalMs`, `prdPath`, `selfHeal`, `selfHealBudget`, `redispatch`, model assignments, label names. AC: changing a config value changes pipeline behavior with no code edit.

- **3.2** **Polling loop skeleton.** A `src/poll.ts` module exports `startPoll(config)` — wakes every `pollIntervalMs`, reads all open `ready` issues via `gh`, runs graph derivation, identifies unblocked issues up to `K − in-flight`, dispatches ready work, sleeps. AC: with one `ready` issue, the loop wakes, derives the graph, and logs the unblocked set on each cycle.

- **3.3** **Label state checks in the loop.** On each cycle, the loop reads current labels for all in-flight issues and dispatches the next step if the gate signal is present (`plan-approved` → dispatch implement; `verifying` → dispatch verify; merged PR → close issue + re-derive). AC: applying `plan-approved` label causes implement to dispatch on the next poll cycle.

- **3.4** **Entrypoint.** `src/index.ts` (or `bin/pipeline.ts`) loads config, calls `startPoll`. Becomes the `main` field of the npm package. AC: `npx agent-pipeline` starts the loop against the consuming repo's config.

- **3.5** **Graceful shutdown.** `SIGINT`/`SIGTERM` stops the loop cleanly after the current cycle completes. AC: `Ctrl+C` exits without leaving orphaned sandboxes.

## Phase 4 — Gates wired into polling loop

- **4.1** **Evolving PR.** Plan-draft step opens a PR on `issue-{id}` after committing the spec. AC: PR exists at `awaiting-plan-approval` after plan-draft runs.

- **4.2** **Plan-approval gate.** Loop checks for `plan-approved` label on `awaiting-plan-approval` issues. If present, dispatches implement. If a feedback comment exists on the PR without `plan-approved`, dispatches re-plan. AC: applying `plan-approved` label → implement dispatches on next cycle; leaving feedback without label → re-plan runs.

- **4.3** **Repo verify contract + path-scoping.** Read the project's declared `build/test/lint/typecheck`; run only affected subproject by changed paths. AC: regression runs green on no-op change; red on seeded break.

- **4.4** **Regression as fail-fast gate.** AC: no agent step runs while regression is red.

- **4.5** **Post-hoc verify agent.** Exercises behavior + audits acceptance criteria; posts results to PR. AC: spec-violating diff is flagged; compliant one passes.

- **4.6** **Advisory review (non-blocking).** AC: review comments post to PR but never block.

- **4.7** **Merge detection.** Loop detects merged PR (poll GitHub PR state), closes issue, re-derives graph on next cycle. AC: merging a PR closes the issue and unblocks dependents on next cycle.

## Phase 5 — Failure handling & autonomy dial

- **5.1** **Park policy + `needs-human` inbox.** AC: every blocking failure labels issue/PR `needs-human` with reason logged.

- **5.2** **Self-heal exceptions (budget 1 + log).** AC: regression/verification failure self-heals once, logs attempt, parks on second failure.

- **5.3** **Per-issue cost/attempt budget.** AC: exhausting budget parks regardless of failure type.

- **5.4** **Hand-fix recovery.** AC: dropping `needs-human` re-enters gate chain at regression.

- **5.5** **`redispatch` toggle (off by default).** AC: enabling toggle + guidance comment re-runs implement with steer.

## Phase 6 — Packaging for reuse

- **6.1** **Publish npm package.** AC: a second repo can `npm i -D @you/agent-pipeline` and run the polling loop against its own config and Issues.

- **6.2** **Onboarding checklist validated** end-to-end on one real consuming repo (Rental Buddy). AC: fresh project files a `ready` issue and reaches a human-merged PR.

---

## Definition of done

A consuming repo can file a `ready` issue, leave the Mac running, and reach a human-merged PR with `K=1` and park-by-default — reviewing plan and code from GitHub mobile.

---

## Sequencing rationale

Original Phase 3 (GitHub Actions) replaced by a local polling loop after Docker-in-CI auth proved intractable. The polling loop is simpler, requires no cloud infrastructure, and is fully consistent with the always-on Mac assumption. GitHub Actions support is deferred to a future phase once the local pipeline is proven.

## What to do with existing Phase 3 work (Actions workflows)

The four workflow YAMLs and entrypoint scripts built in Phases 3.1–3.2 are no longer on the critical path. Options:
- **Delete them** to reduce confusion (recommended for now).
- **Archive them** in `docs/archive/actions/` as a reference for future mode B work.

The label state machine (`src/labels.ts`, `src/labelMachine.ts`) is fully reusable — keep it.
