# Spec: issue-18 — Add multiply utility function

## Summary

This issue adds a `multiply(a: number, b: number): number` function to `src/utils.ts` that returns the product `a * b`, along with at least two unit tests covering its behavior. The function is a simple arithmetic utility, typed without `any`, following the ESM + TypeScript conventions declared in CLAUDE.md. It also serves as a concrete regression test for the pipeline's plan-draft → implement → verify flow.

## Acceptance criteria

- `src/utils.ts` exports `multiply(a: number, b: number): number` that returns `a * b`.
- The function uses no `any`; parameter and return types are explicit.
- At least two unit tests exist in `src/__tests__/utils.test.ts` covering `multiply`.
- All tests pass (`npm run test` green).
- The implementation compiles without errors (`npm run typecheck`).

## Implementation plan

1. Add `export function multiply(a: number, b: number): number { return a * b; }` to `src/utils.ts`.
2. Add a `describe("multiply", ...)` block in `src/__tests__/utils.test.ts` with at least two cases: a normal product (e.g. `multiply(2, 3) === 6`) and an edge case (e.g. negative operand `multiply(-2, 3) === -6`).
3. Run `npm run test` and `npm run typecheck` to confirm green.
4. Update `ai/status.md` to move this task to Done and set the next task.

## Requirements covered

- § build-plan.md "Phase 2 — Plan-as-spec artifact" §2.1 — "Plan agent writes spec with 'Requirements covered' section, commits to `issue-{id}`. AC: spec file present; covered-requirements non-empty." This spec is the required artifact for issue-18, produced before any code commits, satisfying that AC.
- § ADR-0001 §4 step 3 "Plan drafting (auto)" — "a plan agent drafts an implementation spec against the issue + the path-scoped PRD, including a **'Requirements covered'** section pointing to the specific PRD passages it implements. The spec is committed to a deterministic branch `issue-{id}`, an evolving PR is opened." This spec follows that exact shape on branch `issue-18`.
- § CLAUDE.md "Conventions" — "No `any`. Prefer `unknown` + narrowing" and "TypeScript, ESM (`type: module`)" directly govern the `multiply` signature and module format used in the implementation.

> Note: This pipeline (tool) repo has no `docs/prd.md`; per ADR-0001 §3.1 the PRD lives in the *consuming* repo. The governing requirements for this bootstrap task are therefore `docs/build-plan.md`, `docs/adr/0001-...md`, and `CLAUDE.md`, cited above.
