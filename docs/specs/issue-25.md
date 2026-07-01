# Spec: issue-25 — Add subtract utility function

## Summary

This issue adds a `subtract(a, b)` function to `src/utils.ts` that returns the difference `a - b`, along with at least two unit tests in `src/__tests__/utils.test.ts`. It is consistent with the existing pattern established by the `multiply` and `divide` utility functions already in the file, and continues to exercise the Phase 2.1 plan-as-spec capability by producing this spec on the deterministic `issue-25` branch before any code is written.

## Acceptance criteria

- `src/utils.ts` exports a `subtract(a: number, b: number): number` function that returns `a - b`.
- The function is typed with no use of `any` (per CLAUDE.md conventions) and is written in TypeScript ESM style.
- At least two unit tests exist under `src/__tests__/utils.test.ts` covering `subtract`, including at least one positive case and one case with negative operands or zero.
- All existing tests continue to pass after the change (`npm run test`).
- A spec file exists on the `issue-25` branch at `docs/specs/issue-25.md` (this file), committed before any code.

## Implementation plan

1. Draft this spec and commit it to the `issue-25` branch (`spec: draft spec for issue-25`), satisfying the Phase 2.1 artifact requirement before any code.
2. Open (or reuse) a draft PR for `issue-25` so the spec is reviewable first; code follows after plan approval.
3. After plan approval: add `export function subtract(a: number, b: number): number { return a - b; }` to `src/utils.ts`.
4. Add tests to `src/__tests__/utils.test.ts`: at minimum, `subtract(5, 3) === 2` and `subtract(-2, 3) === -5`.
5. Run the verify contract (`npm run build`, `npm run test`, `npm run lint`, `npm run typecheck`) and ensure green.
6. Update `ai/status.md` to reflect this issue done and set the next task.

## Requirements covered

- § build-plan.md "2.1 Plan-as-spec artifact" — "Plan agent writes a spec with a **'Requirements covered'** section pointing to PRD passages, commits it to `issue-{id}`. AC: spec file present on branch; covered-requirements section non-empty." This issue directly exercises that capability: it produces the spec on `issue-25` before code, with a non-empty requirements section.
- § ADR-0001 §4 step 3 "Plan drafting (auto)" — "a plan agent drafts an implementation spec against the issue + the path-scoped PRD, including a **'Requirements covered'** section pointing to the specific PRD passages it implements. The spec is committed to `issue-{id}`, an evolving PR is opened." This spec follows that exact shape: deterministic `issue-25` branch, evolving PR, spec-before-code.
- § ADR-0001 §8 "Traceability" — "Spec must include **'Requirements covered'** section pointing to specific PRD passages. Coverage checked manually at plan gate (Gate 1)." The presence of this section fulfills that traceability invariant.
- § CLAUDE.md "Conventions" — "No `any`. Prefer `unknown` + narrowing" and "TypeScript, ESM (`\"type\": \"module\"` when scaffolded in Phase 1)." These govern the `subtract` implementation and its tests.

> Note: This pipeline (tool) repo has no `docs/prd.md`; per ADR-0001 §3.1 the PRD lives in the *consuming* repo. The governing requirements for this bootstrap task are therefore `docs/build-plan.md`, `docs/adr/0001-...md`, and `CLAUDE.md`, cited above.
