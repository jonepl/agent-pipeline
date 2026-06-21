# Agent Pipeline

Shared multi-agent code pipeline tool. See `docs/adr/0001-multi-agent-pipeline-architecture.md` for the full design.

## Cold-start prompt

Use this when opening a new Claude Code session in this repo:

```
Read CLAUDE.md, ai/status.md, docs/build-plan.md, and docs/adr/0001-multi-agent-pipeline-architecture.md.
Then tell me the current phase and next task.
```

## Docs

- `docs/adr/0001-...` — Architecture decision record (the design)
- `docs/build-plan.md` — Ordered, verifiable task list
- `ai/status.md` — Current phase / done / next
- `ai/rules.md` — Implementation rules for agents

## Setup

```
npm install
```

Build, test, lint, and typecheck scripts are added in Phase 1.
