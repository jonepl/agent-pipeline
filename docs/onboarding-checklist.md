# Onboarding a Project to the Pipeline

Steps to adopt the pipeline in any repo (e.g. Rental Buddy). Nothing here is language-specific — the **verify contract** carries all language details.

## 1. Add the dependency (mode A — local)

- [ ] `npm i -D @you/agent-pipeline`
- [ ] Confirm `npx agent-pipeline --help` runs.

## 2. Add caller workflows (mode B — production)

- [ ] Add thin `.github/workflows/*.yml` that `uses:` the pipeline's reusable workflows (`you/agent-pipeline/.github/workflows/<phase>.yml@main`).
- [ ] Pass project config as inputs. Start pinned to `@main`; move to a tag once the tool stabilizes.

## 3. Provide the config file

One file holds the project's parameters and autonomy dial:

- [ ] `pipelineConfig`: PRD path, label names, model assignment.
- [ ] Autonomy defaults for a new project: `K = 1`, failure policy = **park**, self-heal = exceptions only (budget 1, logged), re-dispatch = **off**, coverage check = **manual at plan gate**.

## 4. Declare the verify contract

- [ ] For each subproject, declare `build` / `test` / `lint` / `typecheck` (a `verify` script or Makefile target). This is where **language specifics live** — Rust, TypeScript, anything.
- [ ] Confirm path-scoping: a change under one subproject runs only that subproject's checks.

## 5. Wire repo context

- [ ] `CLAUDE.md` at repo root; path-scoped rules via frontmatter `paths` globs (no `@`-imports of the PRD).
- [ ] PRD present at the configured path. Ensure it's readable as **prose passages** the planner can cite in "Requirements covered".
- [ ] Decide repo model: **monorepo recommended** (one queue, one graph, one merge). Polyrepo only if cross-repo features will never need coordination.

## 6. Create the label set

- [ ] `ready`, `ready-to-plan`, `awaiting-plan-approval`, `plan-approved`, `verifying`, `awaiting-merge`, `needs-human`, `redispatch`.

## 7. First run (validate the loop)

- [ ] File one small `ready` issue.
- [ ] Confirm: graph derivation → plan PR → you approve → implement → regression → review → verification → you merge → issue closes.
- [ ] Confirm a forced failure parks to `needs-human` and a hand-fix re-enters at regression.

## 8. Operate

- [ ] Your daily surface is two labels: `awaiting-plan-approval` (approve specs) and `awaiting-merge` (merge code) — reviewable from anywhere.
- [ ] Your exception surface is `needs-human`.
- [ ] Dial autonomy up (raise `K`, broaden self-heal, enable re-dispatch) only as the post-implementation outcome log shows the upstream flow is solid.
