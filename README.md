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

1. Install dependencies:
```bash
   npm install
```

2. Copy and fill in environment variables:
```bash
   cp .sandcastle/.env.example .sandcastle/.env
   # Fill in CLAUDE_CODE_OAUTH_TOKEN and GH_HOST=github.com
```

3. Build the Docker image (required before running the pipeline locally):
```bash
   npx sandcastle docker build-image
```

4. Create the required GitHub labels in the repo (idempotent — safe to re-run):
```bash
   bash scripts/create-labels.sh
```

## Usage (Mode A — local)

```bash
npx tsx .sandcastle/main.mts
```

Reads open `ready`-labeled issues from this repo's GitHub Issues, 
derives the dependency graph, and runs the pipeline locally.