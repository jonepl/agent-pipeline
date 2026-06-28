# Spec: issue-13 — Phase 4.2 end-to-end validation

## Summary

This issue serves a dual purpose: it is the live end-to-end validation exercise for the Phase 4.2 plan-approval gate, and it delivers a small but well-defined code change — a `divide(a, b)` function in `src/utils.ts` that returns `a / b` and throws on zero divisor. By running this issue through the full pipeline cycle (plan-draft → plan-approval → implement → regression → verify → merge), we confirm that the polling loop correctly detects the `plan-approved` label on an `awaiting-plan-approval` issue and dispatches implementation, and that it re-queues re-plan when feedback exists without the label. The code artifact is intentionally trivial so any pipeline failure is unambiguously a gate or orchestration bug, not a code complexity issue.

## Acceptance criteria

- `src/utils.ts` exports `divide(a: number, b: number): number` that returns `a / b`.
- `divide` throws an `Error` (e.g. `"Division by zero"`) when `b === 0`.
- The function is typed with no use of `any` (per CLAUDE.md conventions).
- At least two passing unit tests exist in `src/__tests__/utils.test.ts`: one for a normal case and one asserting the zero-divisor throw.
- This spec file (`docs/specs/issue-13.md`) is committed to `issue-13` before any code commit (spec-before-code invariant).
- A draft PR exists for `issue-13` at or before the `awaiting-plan-approval` label state.
- After a human applies `plan-approved`, the polling loop dispatches the implement step on the next poll cycle without manual intervention.
- If a reviewer leaves a feedback comment on the PR without applying `plan-approved`, the polling loop dispatches re-plan on the next cycle.
- The verify contract (`npm run build`, `npm run test`, `npm run lint`, `npm run typecheck`) passes green after implementation.

## Implementation plan

1. Commit this spec to `issue-13` (`spec: draft spec for issue-13`) and open a draft PR, satisfying the spec-before-code and Phase 4.1 evolving-PR requirements.
2. Await human review: either `plan-approved` label (happy path) or feedback comment (re-plan path). Do not proceed to code until the gate signal is received.
3. After `plan-approved`: add `export function divide(a: number, b: number): number` to `src/utils.ts`, implementing `if (b === 0) throw new Error("Division by zero"); return a / b`.
4. Add tests to `src/__tests__/utils.test.ts`: a normal-division assertion and a `expect(() => divide(1, 0)).toThrow("Division by zero")` assertion.
5. Run the verify contract (`npm run build && npm run test && npm run lint && npm run typecheck`) and confirm green.
6. Update `ai/status.md` to move Phase 4.2 validation to Done and set the next task.

## Requirements covered

- § build-plan.md "4.2 Plan-approval gate" — "Loop checks for `plan-approved` label on `awaiting-plan-approval` issues. If present, dispatches implement. If a feedback comment exists on the PR without `plan-approved`, dispatches re-plan. AC: applying `plan-approved` label → implement dispatches on next cycle; leaving feedback without label → re-plan runs." This issue is the live end-to-end test of exactly that gate: it sits in `awaiting-plan-approval` until a human acts, and verifies that both branches (approve → implement, feedback → re-plan) are observed.
- § ADR-0001 §4 step 4 "Plan approval — GATE 1 (human, from anywhere)" — "Human reviews the spec in the PR and applies `plan-approved`. *(Unhappy path: leave feedback comment → re-plan agent rewrites spec → back to `awaiting-plan-approval`.)*" By exercising this gate with a real issue, this validation confirms the polling loop correctly implements both the happy and unhappy paths described in the ADR.
- § ADR-0001 §3.3 "Human gates via GitHub labels" — "the loop will not advance an issue past a gate until the correct label is present." The code task is deliberately trivial so that any unintended advance (implement running before `plan-approved`) is detectable — no implementation commits should appear on this branch before the gate signal is present.
- § build-plan.md "4.1 Evolving PR" — "Plan-draft step opens a PR on `issue-{id}` after committing the spec. AC: PR exists at `awaiting-plan-approval` after plan-draft runs." This spec is committed first, with the PR opened immediately after, satisfying the precondition that Phase 4.2 gate validation depends on.

> Note: This pipeline (tool) repo has no `docs/PRD.md`; per ADR-0001 §3.1 the PRD lives in the *consuming* repo. The governing requirements for this bootstrap task are therefore `docs/build-plan.md` and `docs/adr/0001-multi-agent-pipeline-architecture.md`, cited above.
