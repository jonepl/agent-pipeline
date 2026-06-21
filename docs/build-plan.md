# Build Plan — Multi-Agent Pipeline (Bootstrap)

This plan decomposes the ADR into ordered, individually-verifiable tasks. **You build this with your current workflow** (Claude.ai plans, Claude Code implements) because the pipeline doesn't exist yet to build itself — it's a bootstrap, and a dry run of the workflow you're building.

Each task lists an **acceptance criterion** (AC). Work them in order; phases gate on each other. Run Claude Code at the **pipeline repo root**.

---

## Phase 0 — Repo & scaffold

- **0.1 Create the pipeline repo.** AC: empty repo with `docs/adr/0001-...md` (this design) committed.
- **0.2 Scaffold Sandcastle.** Run `npx @ai-hero/sandcastle init`, choose the `parallel-planner-with-review` template. AC: `.sandcastle/main.mts` runs end-to-end against a throwaway test repo with at least one issue.
- **0.3 Establish ACS files.** AC: `ai/rules.md` and `ai/status.md` exist; cold-start prompt documented in the README.

## Phase 1 — Mode A: local loop (adapt the template)

- **1.1 Extract a thin agent-execution interface.** Wrap `sandcastle.run` / `createSandbox` behind one internal function (`runAgent`) so both modes call the same path later. AC: the template loop works through `runAgent`.
- **1.2 Adapt the planner prompt.** Take the template's plan prompt; have it derive the graph from `ready` issues, emit only unblocked issues, and respect a concurrency cap input. AC: given a seeded dependency graph, the planner emits exactly the unblocked set, capped at `K`.
- **1.3 Deterministic branch naming.** AC: re-planning the same issue yields the same `issue-{id}` branch and preserves accumulated commits.
- **1.4 Local implement step.** AC: an approved issue produces code commits on its branch in an isolated sandbox.

## Phase 2 — Gates, plan PR & verification (still local)

- **2.1 Plan-as-spec artifact.** Plan agent writes a spec with a **"Requirements covered"** section pointing to PRD passages, commits it to `issue-{id}`. AC: spec file present on branch; covered-requirements section non-empty.
- **2.2 Evolving PR.** Open one PR per issue; spec first, code later. AC: PR exists at `awaiting-plan-approval` after planning.
- **2.3 Plan-approval gate (label).** `plan-approved` triggers implement; feedback triggers a **stateless re-plan** that rewrites the spec. AC: rejection rewrites the spec from `{issue + current spec + feedback}`; approval proceeds.
- **2.4 Repo verify contract + path-scoping.** Read the project's declared `build/test/lint/typecheck`; run only the affected subproject by changed paths. AC: regression runs green on a no-op change; red on a seeded break.
- **2.5 Regression as fail-fast gate.** AC: no agent step runs while regression is red.
- **2.6 Post-hoc verify agent.** Exercise behavior + audit acceptance criteria; post results to the PR. AC: a spec-violating diff is flagged; a compliant one passes.
- **2.7 Advisory review (non-blocking).** AC: review comments post but never block.

## Phase 3 — Mode B: port to GitHub Actions (event-driven)

- **3.1 Label state machine.** Implement the full taxonomy + transitions. AC: each transition is driven by exactly one event/label and is idempotent (no double-dispatch).
- **3.2 One workflow per phase.** Split graph-derivation / plan / implement / verify into separate workflows triggered by labels and merge/issue events. AC: a task advances across workflow runs with state held only in GitHub.
- **3.3 Sandcastle-in-runner.** Run the same `runAgent` path inside each job (Docker-in-runner). AC: a task completes identically local vs. Actions on the same input.
- **3.4 Concurrency cap in derivation.** Emit `≤ K − in-flight` per round. AC: with `K=1`, never more than one PR in flight.
- **3.5 Merge → re-plan trigger.** AC: merging a PR closes its issue and re-runs graph derivation, unblocking dependents.

## Phase 4 — Failure handling & the autonomy dial

- **4.1 Park policy + `needs-human` inbox.** AC: every park reason lands the issue/PR in `needs-human` with a reason logged.
- **4.2 Self-heal exceptions (budget 1 + log).** AC: a regression/verification failure self-heals once, logs the attempt, parks on a second failure.
- **4.3 Per-issue cost/attempt budget.** AC: exhausting the budget parks regardless of failure type.
- **4.4 Hand-fix recovery.** AC: dropping `needs-human` re-enters the gate chain at regression.
- **4.5 `redispatch` toggle (off by default).** AC: enabling the toggle + a guidance comment re-runs implement with steer.
- **4.6 Single config surface.** All autonomy toggles (`K`, self-heal on/off, budget, re-dispatch, model assignment, PRD path, labels) in one config file. AC: changing a toggle changes behavior with no code edit.

## Phase 5 — Packaging for reuse

- **5.1 Publish the npm package** (local harness + shared logic + prompts). AC: a second repo can `npm i -D` and run mode A.
- **5.2 Reusable Actions workflows** (`workflow_call`). AC: a caller workflow in another repo runs the pipeline via `uses:`.
- **5.3 Onboarding checklist** (see separate doc) validated end-to-end on one real consuming repo. AC: a fresh project reaches a first merged task.

---

**Definition of done for the bootstrap:** a consuming repo can file a `ready` issue and reach a human-merged PR, fully through Actions, with `K=1` and park-by-default — and the same flow is reproducible locally via mode A.
