# Agent Pipeline — Claude Code Guide

## What this repo is

The shared **pipeline tool**: orchestration logic, prompt templates, GitHub state-machine helpers, Sandcastle wrappers, and reusable GitHub Actions workflows. It is consumed by project repos (e.g. Rental Buddy) — it is not a project repo itself.

Read the ADR before touching orchestration logic: `docs/adr/0001-multi-agent-pipeline-architecture.md`
Read the build plan for sequenced tasks: `docs/build-plan.md`
Read current phase status: `ai/status.md`

## Repo layout

```
docs/adr/           Architecture decision records
docs/build-plan.md  Ordered, verifiable task list
ai/rules.md         Implementation rules for agents working in this repo
ai/status.md        Current phase, done, and next task
src/                Source (TypeScript) — grows in Phase 1+
.sandcastle/        Sandcastle template files (adapted per build-plan phases)
```

## Verify contract

No build/test scripts exist yet (Phase 0). When they do, they will be declared here and in the project scripts:

```
npm run build       tsc --noEmit
npm run test        vitest run
npm run lint        eslint src
npm run typecheck   tsc --noEmit
```

Run all four before committing once they exist. These are the commands agents use as the regression floor.

## Conventions

- TypeScript, ESM (`"type": "module"` when scaffolded in Phase 1).
- No `any`. Prefer `unknown` + narrowing.
- No barrel `index.ts` re-exports until there is a genuine public API surface.
- Commit messages: `<scope>: <imperative summary>` — no ticket prefixes needed for pipeline-repo work.
- Do not commit secrets, tokens, or `.env` files.

## Working on a build-plan task

1. Read `ai/status.md` to confirm which task is active.
2. Read the relevant build-plan section for acceptance criteria.
3. Implement the task; satisfy the AC.
4. Update `ai/status.md` (move the task to Done, set Next task).
5. Stop and report — human reviews before the next task starts.
