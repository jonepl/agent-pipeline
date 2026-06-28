import { execSync } from "node:child_process";
import type { PipelineConfig } from "./config.js";

export type GhIssue = {
  readonly number: number;
  readonly title: string;
};

export type GhIssueWithLabels = GhIssue & {
  readonly labels: readonly string[];
};

export type PollDeps = {
  readonly listReadyIssues: (label: string) => Promise<GhIssue[]>;
  readonly listInFlightIssues: () => Promise<GhIssueWithLabels[]>;
  readonly deriveUnblocked: (issues: GhIssue[]) => Promise<GhIssue[]>;
  readonly dispatch: (issue: GhIssue) => Promise<void>;
  readonly dispatchImplement: (issue: GhIssue) => Promise<void>;
  readonly dispatchVerify: (issue: GhIssue) => Promise<void>;
  readonly isPrMerged: (issue: GhIssue) => Promise<boolean>;
  readonly closeIssue: (issue: GhIssue) => Promise<void>;
  readonly log: (msg: string) => void;
  readonly sleep: (ms: number) => Promise<void>;
};

export type PollHandle = {
  readonly stop: () => void;
  readonly done: Promise<void>;
};

function ghListReady(label: string): Promise<GhIssue[]> {
  const raw = execSync(
    `gh issue list --label "${label}" --state open --json number,title`,
    { encoding: "utf8" },
  );
  return Promise.resolve(JSON.parse(raw) as GhIssue[]);
}

function ghListInFlight(
  inFlightLabels: ReadonlySet<string>,
): Promise<GhIssueWithLabels[]> {
  const raw = execSync(
    `gh issue list --state open --json number,title,labels`,
    { encoding: "utf8" },
  );
  const all = JSON.parse(raw) as Array<{
    number: number;
    title: string;
    labels: Array<{ name: string }>;
  }>;
  return Promise.resolve(
    all
      .filter((i) => i.labels.some((l) => inFlightLabels.has(l.name)))
      .map((i) => ({
        number: i.number,
        title: i.title,
        labels: i.labels.map((l) => l.name),
      })),
  );
}

function ghIsPrMerged(issue: GhIssue): Promise<boolean> {
  const raw = execSync(
    `gh pr list --head "issue-${issue.number}" --state merged --json number`,
    { encoding: "utf8" },
  );
  const prs = JSON.parse(raw) as unknown[];
  return Promise.resolve(prs.length > 0);
}

function ghCloseIssue(issue: GhIssue): Promise<void> {
  execSync(`gh issue close ${issue.number}`);
  return Promise.resolve();
}

function makeDefaultDeps(config: PipelineConfig): PollDeps {
  const inFlightLabels = new Set([
    config.labels.readyToPlan,
    config.labels.awaitingPlanApproval,
    config.labels.planApproved,
    config.labels.verifying,
    config.labels.awaitingMerge,
  ]);

  return {
    listReadyIssues: ghListReady,
    listInFlightIssues: () => ghListInFlight(inFlightLabels),
    deriveUnblocked: (issues) => Promise.resolve(issues),
    dispatch: () => Promise.resolve(),
    // Phase 3.4 (entrypoint) wires real agent calls here.
    dispatchImplement: (issue) => {
      console.log(`[poll] plan-approved gate: #${issue.number} queued for implement`);
      return Promise.resolve();
    },
    dispatchVerify: (issue) => {
      console.log(`[poll] verifying gate: #${issue.number} queued for verify`);
      return Promise.resolve();
    },
    isPrMerged: ghIsPrMerged,
    closeIssue: ghCloseIssue,
    log: console.log,
    sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
  };
}

export async function tick(config: PipelineConfig, deps: PollDeps): Promise<void> {
  const ready = await deps.listReadyIssues(config.labels.ready);
  const unblocked = await deps.deriveUnblocked(ready);
  const inFlightIssues = await deps.listInFlightIssues();
  const slots = Math.max(0, config.K - inFlightIssues.length);
  const toDispatch = unblocked.slice(0, slots);

  const unblockedLabel =
    toDispatch.map((i) => `#${i.number}`).join(", ") || "none";
  deps.log(
    `[poll] ready=${ready.length} in-flight=${inFlightIssues.length} unblocked=${unblockedLabel}`,
  );

  for (const issue of toDispatch) {
    await deps.dispatch(issue);
  }

  for (const issue of inFlightIssues) {
    if (
      issue.labels.includes(config.labels.awaitingPlanApproval) &&
      issue.labels.includes(config.labels.planApproved)
    ) {
      deps.log(`[poll] gate: plan-approved on #${issue.number} — dispatching implement`);
      await deps.dispatchImplement(issue);
    } else if (issue.labels.includes(config.labels.verifying)) {
      deps.log(`[poll] gate: verifying on #${issue.number} — dispatching verify`);
      await deps.dispatchVerify(issue);
    } else if (await deps.isPrMerged(issue)) {
      deps.log(`[poll] gate: PR merged for #${issue.number} — closing issue`);
      await deps.closeIssue(issue);
    }
  }
}

export function startPoll(
  config: PipelineConfig,
  deps: PollDeps = makeDefaultDeps(config),
): PollHandle {
  let running = true;

  const done = (async () => {
    while (running) {
      await tick(config, deps);
      if (running) {
        await deps.sleep(config.pollIntervalMs);
      }
    }
  })();

  return {
    stop: () => {
      running = false;
    },
    done,
  };
}
