#!/usr/bin/env bash
# Creates (or updates) all pipeline labels in the GitHub repo.
# Safe to re-run: --force overwrites existing labels with the same name.
set -euo pipefail

REPO="${GH_REPO:-$(gh repo view --json nameWithOwner -q .nameWithOwner)}"

gh label create "ready"                  --description "Issue is ready for the pipeline to pick up"     --color "0E8A16" --repo "$REPO" --force
gh label create "ready-to-plan"          --description "Coder agent finished; planner agent should run" --color "1D76DB" --repo "$REPO" --force
gh label create "awaiting-plan-approval" --description "Plan posted; waiting for human approval"        --color "E4E669" --repo "$REPO" --force
gh label create "plan-approved"          --description "Human approved the plan; coder may proceed"     --color "0075CA" --repo "$REPO" --force
gh label create "verifying"              --description "Coder done; verifier agent running"             --color "E99695" --repo "$REPO" --force
gh label create "awaiting-merge"         --description "PR passed verification; waiting for merge"      --color "BFD4F2" --repo "$REPO" --force
gh label create "needs-human"            --description "Pipeline stalled; human intervention required"  --color "D93F0B" --repo "$REPO" --force
gh label create "redispatch"             --description "Retry: re-queue issue through the pipeline"     --color "F9D0C4" --repo "$REPO" --force

echo "All 8 labels created/updated in $REPO."
