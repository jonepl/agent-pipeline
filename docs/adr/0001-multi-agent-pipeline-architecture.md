# ADR-0001 — Multi-Agent Pipeline Architecture

**Status:** Accepted (revised — local-first)
**Date:** 2026-06-27
**Revision:** Pivoted from GitHub Actions (mode B) to local always-on process after Docker-in-CI auth issues proved intractable for a solo dev setup. Actions remains a future option.

---

## 1. Context & problem

The goal is to implement code faster than the current manual workflow by handing well-scoped tasks to AI agents, while keeping a human in control at the points that matter. The system must:

- Accept tasks described in natural language and queue many of them, including tasks that depend on one another.
- Make every task **verifiable**.
- Work across **multiple languages**.
- Let a human **review plans and PRs from anywhere**.
- Run AI steps **even when the human is away from the computer**.

Inspiration is Sandcastle (`@ai-hero/sandcastle`). A prior root-cause finding drives the design: implementation was missing PRD requirements because there was **no traceability** between specs and outputs. Closing that gap is a first-class concern.

## 2. Goals & non-goals

**Goals:** durable, low-overhead throughput; human gates only where judgment is required; observable, incrementally-trusted automation; reuse across projects and languages.

**Non-goals:** deployment / CD past merge-to-`main`; cloud infrastructure; webhook servers.

## 3. System shape

### 3.1 Two layers — tool vs. content

- **Pipeline repo (shared tool):** orchestration logic, planner/agent prompt templates, dependency-graph derivation, the label state-machine helpers, the Sandcastle wrappers, the polling loop, and the npm package.
- **Consuming repo (per-project content + config):** the PRD/specs, the **verify contract** (build/test/lint/typecheck commands), `CLAUDE.md` + path-scoped rules, the Issues queue, and one config file (model assignment, concurrency cap, autonomy toggles, PRD path, label names, poll interval).

### 3.2 Execution model — local always-on polling loop

A single persistent `tsx` process runs on the developer's Mac indefinitely. Every **30 seconds** (configurable) it:

1. Reads all open GitHub Issues labeled `ready`
2. Re-derives the full dependency graph
3. Identifies unblocked issues (no blocking deps) up to the concurrency cap `K`
4. Checks each in-flight issue's current label state
5. Dispatches any work that's ready (plan-draft, implement, verify)
6. Sleeps until next poll

**Why polling over events:** no webhook server, no ephemeral runner, no Docker-in-CI auth complexity. The pipeline is a single process on a machine that stays on. Human gates are signals in GitHub (labels, PR merge) that the polling loop detects on the next wake cycle. Latency is at most one poll interval — acceptable for a solo dev.

**Sandcastle** provides sandboxed agent execution in both local and (future) CI modes. The same `runAgent` path runs in both, preserving future portability.

### 3.3 Human gates via GitHub labels

The polling loop is the only orchestrator. Human gates are implemented as **label checks** — the loop will not advance an issue past a gate until the correct label is present:

- `plan-approved` — human reviewed the spec PR and applied this label → loop dispatches implement
- PR merged — human merged the PR → loop closes the issue and re-derives the graph

Review happens from anywhere (GitHub mobile/web). The loop detects the signal on next poll.

## 4. The pipeline (happy path)

Each task is one GitHub Issue. State lives entirely in GitHub (labels + PR status).

1. **Issue created (human).** Filed in natural language, labeled `ready`. The only authoring step.
2. **Graph derivation (auto, un-gated).** On each poll, the planner reads all `ready` issues, re-derives the full dependency graph globally, and identifies up to `K − in-flight` unblocked issues. Labels them `ready-to-plan`.
3. **Plan drafting (auto).** For each `ready-to-plan` issue, a plan agent drafts an implementation spec against the issue + the path-scoped PRD, including a **"Requirements covered"** section pointing to specific PRD passages. The spec is committed to `issue-{id}`, an evolving PR is opened, issue labeled `awaiting-plan-approval`.
4. **Plan approval — GATE 1 (human, from anywhere).** Human reviews the spec in the PR and applies `plan-approved`. *(Unhappy path: leave feedback comment → re-plan agent rewrites spec → back to `awaiting-plan-approval`.)*
5. **Implementation (auto).** Loop detects `plan-approved`, dispatches implementer in a Sandcastle sandbox on `issue-{id}`, producing code commits on the same branch.
6. **Regression — hard gate, runs first (auto, deterministic).** Runs the repo verify contract (build/test/lint/typecheck). Fail-fast before any agent step.
7. **Review — advisory (auto, agent).** Posts code-quality/security comments on the PR. Non-blocking.
8. **Verification (auto, agent).** Exercises behavior + audits diff against spec's acceptance criteria. Posts result to PR. Labels `awaiting-merge` on pass.
9. **Merge — GATE 2 (human, from anywhere).** Human reviews code + QA in the PR and merges to `main`. Spec rides into `docs/` on that merge.
10. **Unblock + re-plan (auto).** Loop detects merged PR, closes issue, re-derives graph on next poll cycle. Picks up newly-unblocked issues.

Two human touches per task (approve plan, merge PR); everything else runs while the Mac is on.

## 5. Failure handling & recovery

**Default policy: immediate park.** Any blocking failure labels the issue/PR `needs-human` and stops. The `needs-human` set is the human's from-anywhere inbox.

**Self-heal exceptions** (eval phase, budget 1 + logged): Regression fail and Verification fail on a concretely-unmet criterion re-dispatch the implementer once with the failure context, then park.

**Park always:** verification can't determine, review raises judgment concern, implementation produced no commits, budget exhausted.

**Recovery — hand-fix (default):** human pushes commits or edits the plan, drops `needs-human`; re-enters gate chain at Regression. **Re-dispatch** (comment + `redispatch` label) built but off by default.

## 6. The autonomy dial

Every automation ships built but defaulted to its manual/observable mode, flipped on per-component via config as confidence grows. One config file holds all toggles.

Eval-phase defaults: failure policy = park; self-heal = exceptions only, budget 1, logged; recovery = hand-fix; `K = 1`; re-dispatch = off; poll interval = 30s; coverage check = manual at plan gate.

## 7. Verification & multi-language

- **Repo-level verify contract** is the deterministic floor — a committed declaration of `build/test/lint/typecheck`. Multi-language by delegation; the tool runs whatever the repo declares.
- **Monorepo path-scoping:** changed paths → run only the affected subproject's checks.
- **Post-hoc verify agent** audits spec compliance after implementation. Human merge gate is the backstop.

## 8. Traceability

PRD requirement-ID restructuring deferred. For now:

- Spec must include **"Requirements covered"** section pointing to specific PRD passages.
- Coverage checked manually at plan gate (Gate 1).
- Revisit trigger: misses clustering in the post-implementation outcome log.

## 9. Distribution & multi-project model

- **Separate pipeline repo.** Published as an **npm package** (`npm i -D`).
- Each consuming project: dependency, config file, verify contract, `CLAUDE.md` + rules, Issues queue.
- Start with `@main`; pin to tags once stable.
- **Monorepo recommended** for consuming projects — collapses cross-cutting features into one ordinary task.

## 10. Decision log

1. **Compute** — **local always-on Mac** over *{GitHub Actions, always-on VPS}*. Docker-in-CI auth proved intractable; solo dev machine stays on; no cloud ops.
2. **Gate mechanism** — **polling loop + GitHub labels** over *{webhook listener, terminal prompt gates}*. No server to maintain; review from anywhere via GitHub mobile; acceptable latency for solo dev.
3. **Queue substrate** — **GitHub Issues** over *{committed manifest, native job-deps}*.
4. **Merge timing** — **ordering gate** over *{stacked branches}*.
5. **Edge declaration** — **planner-derived, global re-derivation each round** over *{human-declared, frozen-incremental}*.
6. **Plan-gate granularity** — **per-issue plan approval, graph un-gated**.
7. **Plan artifact** — **plan PR (one evolving PR)** over *{issue comment, two separate PRs}*.
8. **Verify source** — **repo-level verify contract** (multi-language by delegation).
9. **Spec-check authorship** — **post-hoc verify agent**.
10. **Failure policy** — **immediate park, self-heal exceptions** (eval phase).
11. **Recovery** — **hand-fix default, re-dispatch toggleable**.
12. **Concurrency** — **cap `K`, default `K=1`**.
13. **Consuming-repo model** — **monorepo recommended**.
14. **Traceability** — **agent-enumeration + manual gate check** (IDs deferred).
15. **Sandcastle's role** — **execution library** (both local and future CI).
16. **Distribution** — **separate repo: npm package**.

## 11. Deferred / open

- GitHub Actions (mode B) support — deferred until local pipeline is proven. The `runAgent` abstraction preserves portability.
- Broaden self-heal beyond Regression/Verification once upstream flow is proven.
- Introduce `REQ-` IDs + automated coverage check if misses cluster.
- Version the published package once stable.

**Default model assignment:** Opus — graph derivation, plan drafting, verification; Sonnet — implementation, self-heal; Sonnet/Haiku — advisory review.

**Default label taxonomy:** `ready` → `ready-to-plan` → `awaiting-plan-approval` → `plan-approved` → `verifying` → `awaiting-merge`; plus `needs-human`, `redispatch`.

**Poll interval:** 30 seconds (configurable).
