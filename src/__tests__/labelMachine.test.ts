import { describe, it, expect } from "vitest";
import { LABELS } from "../labels.js";
import {
  TRANSITIONS,
  applyTransition,
  parkIssue,
  resumeFromPark,
} from "../labelMachine.js";

describe("TRANSITIONS (state machine definition)", () => {
  it("each 'from' label triggers exactly one transition — single trigger per state", () => {
    const fromLabels = TRANSITIONS.map((t) => t.from);
    expect(fromLabels.length).toBe(new Set(fromLabels).size);
  });

  it("each 'to' label is reached from exactly one source — no double-dispatch", () => {
    const toLabels = TRANSITIONS.map((t) => t.to);
    expect(toLabels.length).toBe(new Set(toLabels).size);
  });

  it("covers the full happy-path chain in order", () => {
    const chain: string[] = [
      LABELS.READY,
      LABELS.READY_TO_PLAN,
      LABELS.AWAITING_PLAN_APPROVAL,
      LABELS.PLAN_APPROVED,
      LABELS.VERIFYING,
      LABELS.AWAITING_MERGE,
    ];
    for (let i = 0; i < chain.length - 1; i++) {
      const t = TRANSITIONS.find((t) => t.from === chain[i]);
      expect(t?.to).toBe(chain[i + 1]);
    }
  });

  it("every transition has a non-empty trigger description", () => {
    for (const t of TRANSITIONS) {
      expect(t.trigger.length).toBeGreaterThan(0);
    }
  });
});

describe("applyTransition", () => {
  it("removes the 'from' label and adds the 'to' label", () => {
    const { labels, changed } = applyTransition(
      ["ready"],
      LABELS.READY,
      LABELS.READY_TO_PLAN,
    );
    expect(labels).toEqual(["ready-to-plan"]);
    expect(changed).toBe(true);
  });

  it("preserves unrelated labels during a transition", () => {
    const { labels } = applyTransition(
      ["ready", "some-other-label"],
      LABELS.READY,
      LABELS.READY_TO_PLAN,
    );
    expect(labels).toContain("ready-to-plan");
    expect(labels).toContain("some-other-label");
    expect(labels).not.toContain("ready");
  });

  it("is idempotent — applying the same transition twice produces no change on the second call", () => {
    const first = applyTransition(["ready"], LABELS.READY, LABELS.READY_TO_PLAN);
    const second = applyTransition(
      first.labels,
      LABELS.READY,
      LABELS.READY_TO_PLAN,
    );
    expect(second.changed).toBe(false);
    expect(second.labels).toEqual(first.labels);
  });

  it("is a no-op when the issue is not in the expected 'from' state", () => {
    const { labels, changed } = applyTransition(
      ["awaiting-plan-approval"],
      LABELS.READY,
      LABELS.READY_TO_PLAN,
    );
    expect(changed).toBe(false);
    expect(labels).toEqual(["awaiting-plan-approval"]);
  });

  it("is a no-op when the target label is already present", () => {
    const { changed } = applyTransition(
      ["ready-to-plan"],
      LABELS.READY,
      LABELS.READY_TO_PLAN,
    );
    expect(changed).toBe(false);
  });
});

describe("parkIssue", () => {
  it("adds needs-human to a live issue", () => {
    const { labels, changed } = parkIssue(["plan-approved"]);
    expect(labels).toContain(LABELS.NEEDS_HUMAN);
    expect(labels).toContain("plan-approved");
    expect(changed).toBe(true);
  });

  it("is idempotent — parking an already-parked issue is a no-op", () => {
    const { changed } = parkIssue(["plan-approved", LABELS.NEEDS_HUMAN]);
    expect(changed).toBe(false);
  });
});

describe("resumeFromPark", () => {
  it("removes needs-human while preserving the current pipeline state", () => {
    const { labels, changed } = resumeFromPark([
      "plan-approved",
      LABELS.NEEDS_HUMAN,
    ]);
    expect(labels).not.toContain(LABELS.NEEDS_HUMAN);
    expect(labels).toContain("plan-approved");
    expect(changed).toBe(true);
  });

  it("is idempotent — resuming an issue that is not parked is a no-op", () => {
    const { changed } = resumeFromPark(["plan-approved"]);
    expect(changed).toBe(false);
  });
});
