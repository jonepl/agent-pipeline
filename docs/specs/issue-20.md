# Spec: issue-20 — Add subtract utility function

## Summary

This issue adds a `subtract(a, b)` function to `src/utils.ts` that returns the difference `a - b`, along with at least two unit tests covering it. It is a small, well-scoped utility addition that follows the same pattern established by `multiply` and `divide` — typed, ESM, no `any`. Its secondary purpose is to exercise the plan-drafting and spec-as-artifact step (Phase 2.1) against a concrete, verifiable code task, confirming the traceability mechanism works for a new function in an already-populated `utils.ts`.

## Acceptance criteria

- `src/utils.ts` exports a `subtract(a: number, b: number): number` function that returns `a - b`.
- The implementation uses TypeScript with no use of `any` (per CLAUDE.md conventions).
- At least two unit tests exist in `src/__tests__/utils.test.ts` (or equivalent): one positive case (e.g. `subtract(5, 3) === 2`) and one covering a negative-result or edge case (e.g. `subtract(2, 5) === -3`).
- All existing tests for `multiply` and `divide` continue to pass (no regression).
- A spec file exists on the `issue-20` branch at `docs/specs/issue-20.md` committed before any code changes.

## Implementation plan

1. Commit this spec to the `issue-20` branch (`spec: draft spec for issue-20`) before touching any source code.
2. Open (or reuse) a draft PR for `issue-20` so the spec is reviewable first and code follows after plan approval.
3. After plan approval: add `export function subtract(a: number, b: number): number { return a - b }` to `src/utils.ts`.
4. Add at least two unit tests in `src/__tests__/utils.test.ts`: a basic case (`subtract(5, 3) === 2`) and an edge case (`subtract(2, 5) === -3`).
5. Run the verify contract (`npm run build`, `npm run test`, `npm run lint`, `npm run typecheck`) once they exist; ensure all green.
6. Update `ai/status.md` to reflect this task done and set the next task.

## Requirements covered

- § build-plan.md "2.1 Plan-as-spec artifact" — "Plan agent writes a spec with a **'Requirements covered'** section pointing to PRD passages, commits it to `issue-{id}`. AC: spec file present on branch; covered-requirements section non-empty." This spec is committed on `issue-20` before any code, satisfying the spec-before-code invariant.
- § CLAUDE.md "Conventions" — "No `any`. Prefer `unknown` + narrowing" and "TypeScript, ESM" govern the `subtract` implementation and its tests. The function signature `subtract(a: number, b: number): number` follows these conventions exactly.
- § ADR-0001 §4 step 3 "Plan drafting (auto)" — "a plan agent drafts an implementation spec against the issue + the path-scoped PRD, including a **'Requirements covered'** section pointing to the specific PRD passages it implements. The spec is committed to a deterministic branch `issue-{id}`, an evolving PR is opened." This spec follows that exact shape: deterministic `issue-20` branch, evolving PR, spec-before-code.

> Note: This pipeline (tool) repo has no `docs/prd.md`; per ADR-0001 §3.1 the PRD lives in the *consuming* repo. The governing requirements for this bootstrap task are therefore `docs/build-plan.md`, `docs/adr/0001-...md`, and `CLAUDE.md`, cited above.
