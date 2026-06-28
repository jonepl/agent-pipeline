# ADR-0001 — Multi-Agent Code Pipeline Architecture

**Status:** Accepted (design)
**Date:** 2026-06-20
**Scope:** Architecture of the reusable pipeline *tool*. Consuming projects (e.g. Rental Buddy) adopt it via the onboarding checklist.

---

## 1. Context & problem

The goal is to implement code faster than the current manual workflow by handing well-scoped tasks to AI agents, while keeping a human in control at the points that matter. The system must:

- Accept tasks described in natural language and queue many of them, including tasks that depend on one another.
- Make every task **verifiable**.
- Work across **multiple languages**.
- Let a human **review plans and PRs from anywhere**.
- Run AI steps **even when the human is away from the computer**.

Inspiration is Sandcastle (`@ai-hero/sandcastle`). A prior root-cause finding drives the design: implementation was missing PRD requirements because there was **no traceability** between specs and outputs. Closing that gap is a first-class concern, not an afterthought.

## 2. Goals & non-goals

**Goals:** durable, low-overhead throughput; human gates only where judgment is required; observable, incrementally-trusted automation; reuse across projects and languages.

**Non-goals (explicitly out of scope):** deployment / CD past merge-to-`main` (the flow ends at the human merge); secrets handling beyond standard GitHub Actions plumbing (`CLAUDE_CODE_OAUTH_TOKEN`, `GITHUB_TOKEN`).

## 3. System shape

### 3.1 Two layers — tool vs. content

- **Pipeline repo (shared tool):** orchestration logic, planner/agent prompt templates, dependency-graph derivation, the GitHub state-machine helpers, the Sandcastle wrappers, and reusable GitHub Actions workflows.
- **Consuming repo (per-project content + config):** the PRD/specs, the **verify contract** (the project's build/test/lint/typecheck commands), `CLAUDE.md` + path-scoped rules, the Issues queue, and one config file (model assignment, concurrency cap, autonomy toggles, PRD path, label names).

### 3.2 Two execution modes — and Sandcastle's role

- **Mode A (local):** the pipeline's npm package, run via `npx`, using Sandcastle for sandbox isolation + parallelism a local machine lacks. This is the **observable test harness**.
- **Mode B (production):** event-driven GitHub Actions workflows. Each workflow run is an isolated, ephemeral VM.
- **Sandcastle runs in both modes** for execution parity — the same agent-execution path locally and in CI — even though the Actions runner already provides isolation. The Docker-in-runner overhead is accepted as the price of a local harness that can faithfully reproduce production behavior.

**Sandcastle is the foundation of the *execution layer only*.** It provides: running an agent in an isolated sandbox/worktree, branch strategies + merge-back, structured-output extraction, multiple providers. It does **not** provide the queue, dependency graph, GitHub integration, human gates, or event-driven workflows — those are custom code in this repo. The `parallel-planner-with-review` scaffold template is the **mode-A bootstrap** (a single continuous local loop); mode B is built custom and reuses its planner prompt and deterministic branch naming.

## 4. The pipeline (happy path)

Each task is one GitHub Issue. State lives entirely in GitHub (labels + PR status); the human gates are the seams where one workflow ends and a later event starts the next.

1. **Issue created (human).** Filed in natural language, labeled `ready`. The only authoring step.
2. **Graph derivation (auto, un-gated).** Triggered by a new `ready` issue or a merge event. The planner reads *all* open `ready` issues, rebuilds the whole dependency graph from scratch, and labels up to `K − (in-flight)` currently-unblocked issues `ready-to-plan`.
3. **Plan drafting (auto).** For each `ready-to-plan` issue, a plan agent drafts an implementation spec against the issue + the path-scoped PRD, including a **"Requirements covered"** section pointing to the specific PRD passages it implements. The spec is committed to a deterministic branch `issue-{id}`, an evolving PR is opened, and the issue is set `awaiting-plan-approval`.
4. **Plan approval — GATE 1 (human, from anywhere).** The human reviews the spec in the PR and applies `plan-approved`. *(Unhappy path: leave feedback → a stateless re-plan workflow rewrites the spec in the same PR → back to `awaiting-plan-approval`. Trivial edits can be hand-made and approved directly.)*
5. **Implementation (auto).** `plan-approved` triggers the implementer in a Sandcastle sandbox on `issue-{id}`, producing code commits on the same branch.
6. **Regression — hard gate, runs first (auto, deterministic).** Runs the repo verify contract (build/test/lint/typecheck). Fail-fast: no agent step runs until this is green.
7. **Review — advisory (auto, agent).** Posts code-quality/security comments on the PR. **Non-blocking.**
8. **Verification (auto, agent).** Exercises the behavior **and** audits the diff against the spec's acceptance criteria (QA + spec-compliance, collapsed into one pass). Post-hoc.
9. **Merge — GATE 2 (human, from anywhere).** The human reviews code + QA in the same PR and merges to `main`. The spec rides into `docs/` on that merge.
10. **Unblock + re-plan (auto).** The merge closes the issue and re-triggers step 2, which picks up whatever the merged task was blocking. The loop continues until no unblocked issues remain.

Two human touches per task (approve plan, merge PR); everything else is AFK.

## 5. Failure handling & recovery

**Default policy: immediate park.** Any blocking failure labels the issue/PR `needs-human` and stops. The `needs-human` set is the human's from-anywhere inbox.

**Self-heal exceptions** (deterministic fix targets only): a **Regression** failure or a **Verification** failure on a concretely-unmet criterion re-dispatches the implementer with the failure context.

**Eval-phase discipline:** self-heal runs with a **budget of 1 attempt and full logging on the PR**, then parks. This keeps failure *rate* visible (the metric that signals whether the upstream flow is solid) and prevents the implementer churning against a possibly-wrong soft verifier. A global per-issue cost/attempt budget caps thrash.

**Park always (no self-heal):** verification can't determine, review raises a judgment concern, or implementation produced no commits / hard-errored.

**Recovery — hand-fix (default):** the human pushes commits or edits the plan, then drops `needs-human`; any change re-enters the gate chain at **Regression**. **Re-dispatch-with-guidance** (comment + `redispatch` label → agent re-runs with steer) is built but **toggled off** by default.

## 6. The autonomy dial

Recurring principle: **every automation ships built but defaulted to its manual/observable mode, and is flipped on per-component as confidence grows.** Implementation consequence: a single config surface holds all autonomy toggles — not autonomy hardcoded into each workflow.

Eval-phase defaults: failure policy = park; self-heal = exceptions only, budget 1, logged; recovery = hand-fix; concurrency `K = 1`; re-dispatch = off; coverage check = manual at the plan gate.

## 7. Verification & multi-language

- **Repo-level verify contract** is the deterministic floor: a committed per-subproject declaration of `build/test/lint/typecheck` (a `verify` script or Makefile target). The tool runs whatever the project declares — **multi-language by delegation**, with zero per-language code in the tool.
- **Monorepo path-scoping:** changed paths → run only the affected subproject's verify.
- **New-spec verification** comes from checks authored from the spec's acceptance criteria, run by that same generic runner. The repo contract is the *regression floor*; it proves nothing existing broke, not that the new spec was met.
- **Spec-check authorship = post-hoc verify agent** (chosen for now). Trade-off accepted: the human merge gate (step 9) is the real backstop against a rubber-stamped verification.

## 8. Traceability

PRD requirement-ID restructuring is **deferred**. For now:

- The spec must include a **"Requirements covered"** section pointing to specific PRD passages (heading/short quote), making the plan-gate coverage check a concrete diff rather than a mental scan.
- Coverage is checked **manually at the plan gate** (Gate 1), which is already where the spec is reviewed.
- **Revisit trigger:** if misses cluster in the per-task post-implementation outcome log, that is the data-driven signal to introduce stable `REQ-` IDs and an automated coverage check (flagging requirements with no implementing issue).

## 9. Distribution & multi-project model

- **Separate pipeline repo.** It is a tool, not part of any one project.
- **Mode A:** published as an **npm package** (`npm i -D` in each project, run via `npx`).
- **Mode B:** exposed as **reusable Actions workflows** (`workflow_call`); each project has thin caller workflows referencing them and passing config as inputs — update once, all projects inherit.
- Each consuming project supplies: the dependency, caller workflows, a config file, its verify contract, `CLAUDE.md` + rules, and its Issues queue.
- **Versioning:** start with projects pointing at `@main` (move fast); pin to tags once the tool stabilizes.

## 10. Decision log

Each entry: **chosen** over *{rejected}* — rationale.

1. **Compute** — **GitHub Actions (prod) + local (test)** over *{always-on host, hybrid}*. AFK + review-from-anywhere are satisfied by Actions + GitHub mobile; local gives full-fidelity testing.
2. **Queue substrate** — **GitHub Issues** over *{committed manifest, native job-deps}*. Free mobile board UI and native review surface; task is the ephemeral work order, PR is the durable record.
3. **Merge timing** — **ordering gate** over *{stacked branches}*. Keeps Git topology boring; independent tasks still parallelize; chains serialize cheaply.
4. **Edge declaration** — **planner-derived** over *{human-declared}*.
5. **Graph derivation** — **global re-derivation each round** over *{batch pass, frozen-incremental}*. Recomputes globally each round so it has no backward-edge blind spot; matches the Sandcastle reference.
6. **Loop shape** — **event-driven segmentation** over *{continuous loop on a host, Actions manual-approval step}*. The only model where a human gate can take days without holding a job open.
7. **Plan-gate granularity** — **per-issue plan approval, graph un-gated** over *{batch graph approval, both}*. The valuable review is the per-issue implementation plan; the graph is mechanical.
8. **Plan artifact** — **plan PR** over *{issue comment + label}*. Strongest review-from-anywhere surface; the spec becomes a durable merged artifact.
9. **PR topology** — **one evolving PR** over *{two separate PRs}*. Kills sprawl; two gates map to one PR (`plan-approved` label, then merge); one merge event = unambiguous unblock.
10. **Verify source** — **repo-level verify contract** over *{task-level, auto-detect}*. Language-agnostic by delegation.
11. **Spec-check authorship** — **post-hoc verify agent** over *{test-first in plan, pre-implement step}*. Lightest to start; human merge gate is the backstop.
12. **Failure policy** — **immediate park, self-heal exceptions** over *{uniform self-heal, uniform park}*. Park-heavy now for observability; broaden self-heal once upstream is proven.
13. **Recovery** — **hand-fix default, re-dispatch toggleable** over *{re-dispatch default, both-by-size}*. Stay close to failures during eval.
14. **Concurrency** — **cap `K`, default `K=1`** over *{fan-out all, strictly serial}*. Fully observable now; one number to raise later.
15. **Consuming-repo model** — **monorepo (recommended)** over *{polyrepo}*. Collapses cross-cutting features into one ordinary task; avoids a federated cross-repo graph. (Per-project choice.)
16. **Traceability** — **agent-enumeration + manual gate check** over *{requirement-ID restructuring now}*. Defer the upfront cost; data-driven revisit.
17. **Sandcastle's role** — **execution library (both modes) + template as mode-A bootstrap + custom orchestration** over *{fork & extend Sandcastle}*.
18. **Distribution** — **separate repo: npm package + reusable workflows** over *{template repo, mega-monorepo}*. Single source of truth; update once.

## 11. Deferred / open

- Broaden self-heal beyond Regression/Verification once the upstream flow is proven solid.
- Introduce `REQ-` IDs + automated coverage check if misses cluster.
- Version the published package + reusable workflows (move from `@main` to tags) once stable.
- Per-step model assignment is config, tunable any time (defaults below).

**Default model assignment:** Opus — graph derivation, plan drafting, verification; Sonnet — implementation, self-heal; Sonnet/Haiku — advisory review.

**Default label taxonomy:** `ready` → `ready-to-plan` → `awaiting-plan-approval` → `plan-approved` → `verifying` → `awaiting-merge`; plus `needs-human`, `redispatch`. Autonomy switches live in the config file, not as labels.
