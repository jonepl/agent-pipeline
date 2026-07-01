# Spec: issue-23 — Add subtract utility function

## Summary

This issue adds a `subtract(a, b)` function to `src/utils.ts` that returns the difference `a - b`, along with at least two unit tests in the existing `src/__tests__/utils.test.ts`. It follows the same shape as the prior `multiply` and `divide` additions: a typed, `any`-free ESM export covered by unit tests. The primary purpose of this task within the pipeline bootstrap is to exercise the plan-as-spec artifact flow (Phase 2.1) for a second well-scoped utility function, validating that the plan-drafting step consistently produces a spec with a non-empty "Requirements covered" section before any implementation begins.

## Acceptance criteria

- `src/utils.ts` exports a `subtract(a: number, b: number): number` function that returns `a - b`.
- The function is typed with no use of `any` (per CLAUDE.md conventions) and is exported as ESM.
- At least two passing unit tests covering `subtract` exist in `src/__tests__/utils.test.ts`.
- Tests cover at least one positive case (e.g. `subtract(5, 3) === 2`) and one edge case (e.g. negative result or zero operand).
- A spec file exists at `docs/specs/issue-23.md` on the `issue-23` branch, committed before any code.
- An evolving draft PR exists for the `issue-23` branch.

## Implementation plan

1. Draft this spec and commit it to the `issue-23` branch (`spec: draft spec for issue-23`), satisfying the Phase 2.1 artifact requirement before any code.
2. Open (or reuse) a draft PR for `issue-23` so the spec is reviewable first and code follows after plan approval.
3. After plan approval: add `export function subtract(a: number, b: number): number { return a - b; }` to `src/utils.ts`.
4. Add unit tests in `src/__tests__/utils.test.ts` asserting `subtract(5, 3) === 2` and at least one edge case (e.g. `subtract(3, 5) === -2`).
5. Run the verify contract (`npm run build`, `npm run test`, `npm run lint`, `npm run typecheck`) once the scripts exist; ensure green.
6. Update `ai/status.md` if applicable.

## Requirements covered

- § build-plan.md "2.1 Plan-as-spec artifact" — "Plan agent writes a spec with a **'Requirements covered'** section pointing to PRD passages, commits it to `issue-{id}`. AC: spec file present on branch; covered-requirements section non-empty." This issue directly exercises that capability: the spec is committed to `issue-23` before any code, with a non-empty covered-requirements section.
- § ADR-0001 §4 step 3 "Plan drafting (auto)" — "a plan agent drafts an implementation spec against the issue + the path-scoped PRD, including a **'Requirements covered'** section pointing to the specific PRD passages it implements. The spec is committed to a deterministic branch `issue-{id}`, an evolving PR is opened." This spec follows that exact shape: deterministic `issue-23` branch, evolving draft PR, spec-before-code.
- § ADR-0001 §1 "Context & problem" — "implementation was missing PRD requirements because there was **no traceability** between specs and outputs. Closing that gap is a first-class concern." The "Requirements covered" section here is the traceability artifact that closes that gap.
- § CLAUDE.md "Conventions" — "No `any`. Prefer `unknown` + narrowing" and "TypeScript, ESM" govern the `subtract` implementation and its tests.

> Note: This pipeline (tool) repo has no `docs/prd.md`; per ADR-0001 §3.1 the PRD lives in the *consuming* repo. The governing requirements for this bootstrap task are therefore `docs/build-plan.md`, `docs/adr/0001-...md`, and `CLAUDE.md`, cited above.
