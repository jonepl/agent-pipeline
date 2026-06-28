# Build Plan — Multi-Agent Pipeline (Bootstrap)

This plan decomposes the ADR into ordered, individually-verifiable tasks. **You build this with your current workflow** (Claude.ai plans, Claude Code implements) because the pipeline doesn't exist yet to build itself — it's a bootstrap, and a dry run of the workflow you're building.

Each task lists an **acceptance criterion** (AC) and a **mode target** (A = local loop, B = Actions). Work them in order; phases gate on each other. Run Claude Code at the **pipeline repo root**.

> **Sequencing principle:** the local loop (mode A) validates execution only. Gates are inherently event-driven and belong to mode B. Build the Actions model first, then wire the gates into it.

---

## Phase 0 — Repo & scaffold ✅

- **0.1 Create the pipeline repo.** AC: empty repo with `docs/adr/0001-...md` committed.
- **0.2 Scaffold Sandcastle.** AC: `.sandcastle/main.mts` runs end-to-end against a throwaway test repo with at least one issue.
- **0.3 Establish ACS files.** AC: `ai/rules.md` and `ai/status.md` exist; cold-start prompt documented in the README.

## Phase 1 — Mode A: local loop (adapt the template) ✅

- **1.1 Extract `runAgent`.** AC: the template loop works through `runAgent`. *(Mode A)*
- **1.2 Adapt the planner prompt.** AC: given a seeded dependency graph, the planner emits exactly the unblocked set, capped at `K`. *(Mode A)*
- **1.3 Deterministic branch naming.** AC: re-planning the same issue yields the same `issue-{id}` branch and preserves accumulated commits. *(Mode A)*
- **1.4 Local implement step.** AC: an approved issue produces code commits on its branch in an isolated sandbox. *(Mode A)*

## Phase 2 — Plan-as-spec artifact (mode A, no gates)

- **2.1 Plan-as-spec artifact.** *(Partially complete)* Plan agent writes a spec with a **"Requirements covered"** section pointing to PRD passages, commits it to `issue-{id}`. AC: spec file present on branch; covered-requirements section non-empty. *(Mode A)*
  > Note: the draft PR step in the prompt is deferred — PRs as a gate mechanism belong to mode B. The spec artifact itself is validated.

## Phase 3 — Mode B: port to GitHub Actions (event-driven)

> Gates are built here, not in Phase 2. The local loop validates execution; Actions is where human gates live.

- **3.1 Label state machine.** Implement the full label taxonomy + transitions. AC: each transition is driven by exactly one event/label and is idempotent (no double-dispatch). *(Mode B)*
- **3.2 One workflow per phase.** Split graph-derivation / plan-draft / implement / verify into separate workflows triggered by labels and merge/issue events. AC: a task advances across workflow runs with state held only in GitHub. *(Mode B)*
- **3.3 Sandcastle-in-runner.** Run the same `runAgent` path inside each Actions job (Docker-in-runner). AC: a task completes identically local vs. Actions on the same input. *(Mode B)*
- **3.4 Concurrency cap in derivation.** Emit `≤ K − in-flight` per round. AC: with `K=1`, never more than one PR in flight. *(Mode B)*
- **3.5 Merge → re-plan trigger.** AC: merging a PR closes its issue and re-runs graph derivation, unblocking dependents. *(Mode B)*

## Phase 4 — Gates (wired into Actions)

> These tasks were originally Phase 2. They are built here because gates require the event-driven model Phase 3 establishes.

- **4.1 Evolving PR.** Open one PR per issue on the plan-draft workflow; spec committed before code. AC: PR exists at `awaiting-plan-approval` after plan-draft workflow runs. *(Mode B)*
- **4.2 Plan-approval gate.** `plan-approved` label triggers the implement workflow; feedback comment triggers a stateless re-plan workflow that rewrites the spec. AC: rejection rewrites the spec; approval dispatches implement. *(Mode B)*
- **4.3 Repo verify contract + path-scoping.** Read the project's declared `build/test/lint/typecheck`; run only the affected subproject by changed paths. AC: regression runs green on a no-op change; red on a seeded break. *(Mode B)*
- **4.4 Regression as fail-fast gate.** AC: no agent step runs while regression is red. *(Mode B)*
- **4.5 Post-hoc verify agent.** Exercise behavior + audit acceptance criteria; post results to the PR. AC: a spec-violating diff is flagged; a compliant one passes. *(Mode B)*
- **4.6 Advisory review (non-blocking).** AC: review comments post to the PR but never block merge. *(Mode B)*

## Phase 5 — Failure handling & the autonomy dial

- **5.1 Park policy + `needs-human` inbox.** AC: every park reason lands the issue/PR in `needs-human` with a reason logged. *(Mode B)*
- **5.2 Self-heal exceptions (budget 1 + log).** AC: a regression/verification failure self-heals once, logs the attempt, parks on a second failure. *(Mode B)*
- **5.3 Per-issue cost/attempt budget.** AC: exhausting the budget parks regardless of failure type. *(Mode B)*
- **5.4 Hand-fix recovery.** AC: dropping `needs-human` re-enters the gate chain at regression. *(Mode B)*
- **5.5 `redispatch` toggle (off by default).** AC: enabling the toggle + a guidance comment re-runs implement with steer. *(Mode B)*
- **5.6 Single config surface.** All autonomy toggles (`K`, self-heal on/off, budget, re-dispatch, model assignment, PRD path, labels) in one config file. AC: changing a toggle changes behavior with no code edit. *(Mode B)*

## Phase 6 — Packaging for reuse

- **6.1 Publish the npm package** (local harness + shared logic + prompts). AC: a second repo can `npm i -D` and run mode A. *(Mode A+B)*
- **6.2 Reusable Actions workflows** (`workflow_call`). AC: a caller workflow in another repo runs the pipeline via `uses:`. *(Mode B)*
- **6.3 Onboarding checklist validated end-to-end** on one real consuming repo. AC: a fresh project reaches a first human-merged PR. *(Mode A+B)*

---

**Definition of done for the bootstrap:** a consuming repo can file a `ready` issue and reach a human-merged PR, fully through Actions, with `K=1` and park-by-default — and the same flow is reproducible locally via mode A.

---

## Sequencing rationale (added after Phase 1 validation)

The original plan ordered gates (Phase 2) before Actions (Phase 3). That was wrong: gates are inherently event-driven and cannot be meaningfully built into the continuous local loop. The local loop validates the execution layer only. The reordered plan builds Actions first (Phase 3), then wires gates into Actions (Phase 4). Phase 2 is retained as a stub for the spec artifact work that *is* mode-A compatible.
