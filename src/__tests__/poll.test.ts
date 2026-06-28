import { describe, it, expect } from "vitest";
import {
  tick,
  startPoll,
  type GhIssue,
  type GhIssueWithLabels,
  type PollDeps,
} from "../poll.js";
import { DEFAULT_CONFIG } from "../config.js";

function makeDeps(overrides: Partial<PollDeps> = {}): PollDeps {
  return {
    listReadyIssues: async () => [],
    listInFlightIssues: async () => [],
    deriveUnblocked: async (issues) => issues,
    dispatch: async () => {},
    dispatchImplement: async () => {},
    dispatchVerify: async () => {},
    isPrMerged: async () => false,
    closeIssue: async () => {},
    log: () => {},
    sleep: async () => {},
    ...overrides,
  };
}

const issue = (n: number): GhIssue => ({ number: n, title: `Issue ${n}` });
const withLabels = (n: number, labels: string[] = []): GhIssueWithLabels => ({
  number: n,
  title: `Issue ${n}`,
  labels,
});

describe("tick", () => {
  it("logs 'unblocked=none' when there are no ready issues", async () => {
    const messages: string[] = [];
    await tick(DEFAULT_CONFIG, makeDeps({ log: (m) => messages.push(m) }));
    expect(messages[0]).toContain("unblocked=none");
  });

  it("logs issue numbers in the unblocked set", async () => {
    const messages: string[] = [];
    const cfg = { ...DEFAULT_CONFIG, K: 2 };
    await tick(
      cfg,
      makeDeps({
        listReadyIssues: async () => [issue(1), issue(2)],
        log: (m) => messages.push(m),
      }),
    );
    expect(messages[0]).toContain("#1");
    expect(messages[0]).toContain("#2");
  });

  it("dispatches each unblocked issue", async () => {
    const dispatched: GhIssue[] = [];
    const cfg = { ...DEFAULT_CONFIG, K: 2 };
    await tick(
      cfg,
      makeDeps({
        listReadyIssues: async () => [issue(1), issue(2)],
        dispatch: async (i) => { dispatched.push(i); },
      }),
    );
    expect(dispatched.map((i) => i.number)).toEqual([1, 2]);
  });

  it("caps dispatched issues at K when more ready issues exist than K", async () => {
    const dispatched: GhIssue[] = [];
    const cfg = { ...DEFAULT_CONFIG, K: 2 };
    await tick(
      cfg,
      makeDeps({
        listReadyIssues: async () => [issue(1), issue(2), issue(3)],
        dispatch: async (i) => { dispatched.push(i); },
      }),
    );
    expect(dispatched).toHaveLength(2);
  });

  it("caps dispatched issues at K minus in-flight", async () => {
    const dispatched: GhIssue[] = [];
    const cfg = { ...DEFAULT_CONFIG, K: 3 };
    await tick(
      cfg,
      makeDeps({
        listReadyIssues: async () => [issue(1), issue(2), issue(3)],
        listInFlightIssues: async () => [withLabels(100), withLabels(101)],
        dispatch: async (i) => { dispatched.push(i); },
      }),
    );
    expect(dispatched).toHaveLength(1);
  });

  it("dispatches nothing when in-flight equals K", async () => {
    const dispatched: GhIssue[] = [];
    const cfg = { ...DEFAULT_CONFIG, K: 2 };
    await tick(
      cfg,
      makeDeps({
        listReadyIssues: async () => [issue(1), issue(2)],
        listInFlightIssues: async () => [withLabels(100), withLabels(101)],
        dispatch: async (i) => { dispatched.push(i); },
      }),
    );
    expect(dispatched).toHaveLength(0);
  });

  it("dispatches only what deriveUnblocked returns, ignoring other ready issues", async () => {
    const dispatched: GhIssue[] = [];
    await tick(
      DEFAULT_CONFIG,
      makeDeps({
        listReadyIssues: async () => [issue(1), issue(2), issue(3)],
        deriveUnblocked: async () => [issue(2)],
        dispatch: async (i) => { dispatched.push(i); },
      }),
    );
    expect(dispatched).toHaveLength(1);
    expect(dispatched[0]?.number).toBe(2);
  });
});

describe("tick — gate checks", () => {
  it("dispatches implement when issue has both awaiting-plan-approval and plan-approved", async () => {
    let implemented: GhIssue | undefined;
    await tick(
      DEFAULT_CONFIG,
      makeDeps({
        listInFlightIssues: async () => [
          withLabels(5, [
            DEFAULT_CONFIG.labels.awaitingPlanApproval,
            DEFAULT_CONFIG.labels.planApproved,
          ]),
        ],
        dispatchImplement: async (i) => { implemented = i; },
      }),
    );
    expect(implemented?.number).toBe(5);
  });

  it("does not dispatch implement when plan-approved label is absent", async () => {
    let implemented: GhIssue | undefined;
    await tick(
      DEFAULT_CONFIG,
      makeDeps({
        listInFlightIssues: async () => [
          withLabels(5, [DEFAULT_CONFIG.labels.awaitingPlanApproval]),
        ],
        dispatchImplement: async (i) => { implemented = i; },
      }),
    );
    expect(implemented).toBeUndefined();
  });

  it("dispatches verify when issue is labeled verifying", async () => {
    let verified: GhIssue | undefined;
    await tick(
      DEFAULT_CONFIG,
      makeDeps({
        listInFlightIssues: async () => [
          withLabels(7, [DEFAULT_CONFIG.labels.verifying]),
        ],
        dispatchVerify: async (i) => { verified = i; },
      }),
    );
    expect(verified?.number).toBe(7);
  });

  it("closes issue when its PR is merged", async () => {
    let closed: GhIssue | undefined;
    await tick(
      DEFAULT_CONFIG,
      makeDeps({
        listInFlightIssues: async () => [
          withLabels(9, [DEFAULT_CONFIG.labels.awaitingMerge]),
        ],
        isPrMerged: async () => true,
        closeIssue: async (i) => { closed = i; },
      }),
    );
    expect(closed?.number).toBe(9);
  });

  it("does not close issue when PR is not yet merged", async () => {
    let closed: GhIssue | undefined;
    await tick(
      DEFAULT_CONFIG,
      makeDeps({
        listInFlightIssues: async () => [
          withLabels(9, [DEFAULT_CONFIG.labels.awaitingMerge]),
        ],
        isPrMerged: async () => false,
        closeIssue: async (i) => { closed = i; },
      }),
    );
    expect(closed).toBeUndefined();
  });

  it("triggers no dispatch for an in-flight issue with no gate signal", async () => {
    let implemented: GhIssue | undefined;
    let verified: GhIssue | undefined;
    let closed: GhIssue | undefined;
    await tick(
      DEFAULT_CONFIG,
      makeDeps({
        listInFlightIssues: async () => [
          withLabels(3, [DEFAULT_CONFIG.labels.readyToPlan]),
        ],
        dispatchImplement: async (i) => { implemented = i; },
        dispatchVerify: async (i) => { verified = i; },
        closeIssue: async (i) => { closed = i; },
      }),
    );
    expect(implemented).toBeUndefined();
    expect(verified).toBeUndefined();
    expect(closed).toBeUndefined();
  });
});

describe("startPoll", () => {
  it("runs tick at least once on start", async () => {
    let ticks = 0;
    const handle = startPoll(
      DEFAULT_CONFIG,
      makeDeps({ listReadyIssues: async () => { ticks++; return []; } }),
    );
    handle.stop();
    await handle.done;
    expect(ticks).toBeGreaterThanOrEqual(1);
  });

  it("runs multiple cycles and resolves done cleanly after stop()", async () => {
    let cycles = 0;
    let stopFn: (() => void) | undefined;

    const handle = startPoll(
      DEFAULT_CONFIG,
      makeDeps({
        listReadyIssues: async () => { cycles++; return []; },
        sleep: async () => { if (cycles >= 3) stopFn?.(); },
      }),
    );
    stopFn = handle.stop;

    await handle.done;
    expect(cycles).toBeGreaterThanOrEqual(3);
  });
});
