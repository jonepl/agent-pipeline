# Spec: issue-2 — Test Phase 2.1 plan drafting

## Summary

This issue exercises the Phase 2.1 "plan-as-spec" capability of the pipeline by drafting and committing an implementation spec for a small, well-scoped code task: adding a `multiply(a, b)` function to `utils.ts`. Its purpose is twofold — deliver the trivial code change described in the issue, and serve as a live verification that the plan-drafting step produces a spec on the deterministic `issue-{id}` branch containing a non-empty "Requirements covered" section that traces back to the governing requirements. It validates the traceability mechanism the ADR identifies as a first-class concern.

## Acceptance criteria

- A spec file exists on the `issue-2` branch at `docs/specs/issue-2.md`.
- The spec's "Requirements covered" section is non-empty and cites at least one specific requirements passage by heading or short quote.
- `src/utils.ts` exports a `multiply(a: number, b: number): number` function that returns the product `a * b`.
- The function is typed with no use of `any` (per CLAUDE.md conventions) and is covered by at least one passing unit test under `src/__tests__`.
- An evolving draft PR exists for the `issue-2` branch with the spec committed before any code.

## Implementation plan

1. Draft this spec and commit it to the `issue-2` branch (`spec: draft spec for issue-2`), satisfying the Phase 2.1 artifact requirement before any code.
2. Open (or reuse) a draft PR for `issue-2` so the spec is reviewable first and code follows after plan approval.
3. After plan approval: create `src/utils.ts` exporting `export function multiply(a: number, b: number): number { return a * b }` (ESM, no `any`).
4. Add a unit test in `src/__tests__/utils.test.ts` asserting `multiply(2, 3) === 6` and an edge case (e.g. `multiply(-2, 3) === -6`).
5. Run the verify contract (`build`/`test`/`lint`/`typecheck`) once it exists; ensure green.
6. Update `ai/status.md` to move Phase 2.1 to Done and set the next task.

## Requirements covered

- § build-plan.md "2.1 Plan-as-spec artifact" — "Plan agent writes a spec with a **'Requirements covered'** section pointing to PRD passages, commits it to `issue-{id}`. AC: spec file present on branch; covered-requirements section non-empty." This issue is the direct test of that capability: it produces the spec on `issue-2` with a non-empty covered-requirements section.
- § ADR-0001 §4 step 3 "Plan drafting (auto)" — "a plan agent drafts an implementation spec against the issue + the path-scoped PRD, including a **'Requirements covered'** section pointing to the specific PRD passages it implements. The spec is committed to a deterministic branch `issue-{id}`, an evolving PR is opened." This spec follows that exact shape (deterministic `issue-2` branch, evolving PR, spec-before-code).
- § ADR-0001 §1 "Context & problem" — "implementation was missing PRD requirements because there was **no traceability** between specs and outputs. Closing that gap is a first-class concern." The "Requirements covered" section here is the traceability artifact that closes that gap.
- § CLAUDE.md "Conventions" — "No `any`. Prefer `unknown` + narrowing" and "TypeScript, ESM" govern the `multiply` implementation and its test.

> Note: This pipeline (tool) repo has no `docs/prd.md`; per ADR-0001 §3.1 the PRD lives in the *consuming* repo. The governing requirements for this bootstrap task are therefore `docs/build-plan.md`, `docs/adr/0001-...md`, and `CLAUDE.md`, cited above.
