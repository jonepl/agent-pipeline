# Spec: issue-27 — Add subtract utility function

## Summary

This issue adds a `subtract(a, b)` function to `src/utils.ts` that returns `a - b`, along with at least two unit tests covering it. It follows the same pattern already established by `multiply` and `divide` in that module — a typed, no-`any`, ESM-exported pure function with tests in `src/__tests__/utils.test.ts`. The change is small and self-contained, and serves as another live exercise of the Phase 2.1 plan-as-spec capability: a spec is drafted and committed on the deterministic `issue-27` branch before any implementation code lands.

## Acceptance criteria

- `src/utils.ts` exports a `subtract(a: number, b: number): number` function that returns `a - b`.
- The function is typed with no use of `any` (per CLAUDE.md conventions) and is written in ESM style.
- At least two unit tests exist in `src/__tests__/utils.test.ts` covering `subtract`, including a basic case and at least one edge case (e.g. negative operands or zero).
- The spec file exists on the `issue-27` branch at `docs/specs/issue-27.md` before any implementation commit.
- A draft PR exists for the `issue-27` branch with the spec committed first.

## Implementation plan

1. Draft this spec and commit it to `issue-27` (`spec: draft spec for issue-27`), satisfying the Phase 2.1 artifact requirement before any code.
2. Open (or reuse) a draft PR for `issue-27` so the spec is reviewable first.
3. After plan approval: add `export function subtract(a: number, b: number): number { return a - b; }` to `src/utils.ts`.
4. Add at least two unit tests in `src/__tests__/utils.test.ts` — one asserting `subtract(5, 3) === 2`, one covering an edge case (e.g. `subtract(-2, 3) === -5`).
5. Run the verify contract (`npm run build`, `npm run test`, `npm run lint`, `npm run typecheck`) and ensure all pass.
6. Update `ai/status.md` to reflect the task as done and set the next task.

## Requirements covered

- § build-plan.md "2.1 Plan-as-spec artifact" — "Plan agent writes a spec with a **'Requirements covered'** section pointing to PRD passages, commits it to `issue-{id}`. AC: spec file present on branch; covered-requirements section non-empty." This issue produces the spec on `issue-27` before code, directly validating that the plan-drafting step works for a new utility function addition.
- § CLAUDE.md "Conventions" — "No `any`. Prefer `unknown` + narrowing" and "TypeScript, ESM (`'type': 'module'` when scaffolded in Phase 1)" govern the `subtract` implementation and its tests, requiring a fully typed function signature with no `any`.
- § build-plan.md "Phase 4.1 Evolving PR" — "Plan-draft step opens a PR on `issue-{id}` after committing the spec. AC: PR exists at `awaiting-plan-approval` after plan-draft runs." This spec is committed first; the draft PR follows, exercising the evolving-PR gate.

> Note: This pipeline (tool) repo has no `docs/prd.md`; per ADR-0001 §3.1 the PRD lives in the *consuming* repo. The governing requirements for this bootstrap task are therefore `docs/build-plan.md`, `docs/adr/0001-...md`, and `CLAUDE.md`, cited above.
