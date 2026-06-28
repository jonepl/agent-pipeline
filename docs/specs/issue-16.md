# Spec: issue-16 — Phase 4.2 end-to-end validation

## Summary

This issue serves as the live end-to-end validation of Phase 4.2 ("Plan-approval gate") by running a small, well-scoped code task through the full polling loop: plan-draft → human gate (`plan-approved` label) → implement → verify → merge. The concrete deliverable is a `divide(a, b)` function added to `src/utils.ts` that returns `a / b` and throws a descriptive error when `b === 0`. By completing this issue through the pipeline — including the human applying `plan-approved` on the spec PR and the loop detecting it on the next cycle to dispatch the implementer — the Phase 4.2 gate wiring is validated in production conditions, not just unit tests.

## Acceptance criteria

- A spec file exists on the `issue-16` branch at `docs/specs/issue-16.md` before any code is committed.
- A draft PR for `issue-16` exists after plan-draft runs, with the issue labeled `awaiting-plan-approval`.
- After the human applies `plan-approved`, the polling loop dispatches the implementer on the next cycle (Phase 4.2 gate signal confirmed).
- `src/utils.ts` exports `divide(a: number, b: number): number` that returns `a / b`.
- Calling `divide(n, 0)` throws an `Error` with a message referencing the zero-divisor (e.g. `"Cannot divide by zero"`).
- The function uses no `any`; types are explicit (per CLAUDE.md conventions).
- At least two unit tests exist in `src/__tests__/utils.test.ts`: one verifying correct division and one verifying the zero-divisor error.
- `npm run build`, `npm run test`, `npm run lint`, and `npm run typecheck` all pass green after the code commit.

## Implementation plan

1. Commit this spec to the `issue-16` branch (`spec: draft spec for issue-16`) as the first commit, before any code.
2. Open (or reuse) a draft PR for `issue-16`; issue is labeled `awaiting-plan-approval`.
3. Wait for the human to apply `plan-approved` — the polling loop then auto-dispatches the implementer.
4. Add `export function divide(a: number, b: number): number` to `src/utils.ts`: if `b === 0` throw `new Error("Cannot divide by zero")`; otherwise return `a / b`.
5. Add tests to `src/__tests__/utils.test.ts`: `divide(10, 2) === 5`, `divide(-6, 3) === -2`, and `expect(() => divide(1, 0)).toThrow("Cannot divide by zero")`.
6. Run the verify contract (`npm run build && npm run test && npm run lint && npm run typecheck`) and confirm green.
7. Update `ai/status.md`: mark Phase 4.2 end-to-end validation done, set next task.

## Requirements covered

- § build-plan.md "4.2 Plan-approval gate" — "Loop checks for `plan-approved` label on `awaiting-plan-approval` issues. If present, dispatches implement. If a feedback comment exists on the PR without `plan-approved`, dispatches re-plan. AC: applying `plan-approved` label → implement dispatches on next cycle; leaving feedback without label → re-plan runs." This issue is the direct live test of that gate: a human applies `plan-approved` and the loop must dispatch implement on the next cycle.
- § ADR-0001 §3.3 "Human gates via GitHub labels" — "`plan-approved` — human reviewed the spec PR and applied this label → loop dispatches implement." Completing this issue through the polling loop confirms that gate is wired correctly end-to-end, beyond unit-test coverage.
- § ADR-0001 §4 step 4 "Plan approval — GATE 1" — "Human reviews the spec in the PR and applies `plan-approved`. (Unhappy path: leave feedback comment → re-plan agent rewrites spec → back to `awaiting-plan-approval`.)" The human gate interaction for this issue is the validation scenario.
- § ADR-0001 §8 "Traceability" — "Spec must include **'Requirements covered'** section pointing to specific PRD passages." This spec fulfils that traceability requirement for the `divide` implementation.
- § CLAUDE.md "Conventions" — "No `any`. Prefer `unknown` + narrowing" and "TypeScript, ESM" govern the `divide` implementation and its tests.

> Note: This pipeline (tool) repo has no `docs/prd.md`; per ADR-0001 §3.1 the PRD lives in the *consuming* repo. The governing requirements for this bootstrap task are therefore `docs/build-plan.md`, `docs/adr/0001-...md`, and `CLAUDE.md`, cited above.
