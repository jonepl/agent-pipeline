import { type Label, LABELS } from "./labels.js";

export type Transition = {
  readonly from: Label;
  readonly to: Label;
  readonly trigger: string;
};

// Happy-path transitions for the main pipeline flow.
// Invariant: each 'from' appears exactly once — one trigger per state.
// Invariant: each 'to' appears exactly once — one path into each state.
export const TRANSITIONS: readonly Transition[] = [
  {
    from: LABELS.READY,
    to: LABELS.READY_TO_PLAN,
    trigger: "graph-derivation workflow: issue is currently unblocked",
  },
  {
    from: LABELS.READY_TO_PLAN,
    to: LABELS.AWAITING_PLAN_APPROVAL,
    trigger: "plan-draft workflow: spec committed to branch",
  },
  {
    from: LABELS.AWAITING_PLAN_APPROVAL,
    to: LABELS.PLAN_APPROVED,
    trigger: "human: applies plan-approved label",
  },
  {
    from: LABELS.PLAN_APPROVED,
    to: LABELS.VERIFYING,
    trigger: "implement workflow: code commits produced on branch",
  },
  {
    from: LABELS.VERIFYING,
    to: LABELS.AWAITING_MERGE,
    trigger: "verify workflow: verification passed",
  },
];

export type TransitionResult = {
  readonly labels: string[];
  readonly changed: boolean;
};

// Apply a state-machine transition to a label set.
// Idempotent: if the issue is already in the target state, returns changed=false.
// No-op: if the issue is not in the expected source state, returns changed=false.
export function applyTransition(
  currentLabels: readonly string[],
  from: Label,
  to: Label,
): TransitionResult {
  if (currentLabels.includes(to)) {
    return { labels: [...currentLabels], changed: false };
  }
  if (!currentLabels.includes(from)) {
    return { labels: [...currentLabels], changed: false };
  }
  return {
    labels: currentLabels.filter((l) => l !== from).concat(to),
    changed: true,
  };
}

// Add needs-human to any state (park). Idempotent.
export function parkIssue(currentLabels: readonly string[]): TransitionResult {
  if (currentLabels.includes(LABELS.NEEDS_HUMAN)) {
    return { labels: [...currentLabels], changed: false };
  }
  return { labels: [...currentLabels, LABELS.NEEDS_HUMAN], changed: true };
}

// Remove needs-human (resume). Idempotent.
export function resumeFromPark(currentLabels: readonly string[]): TransitionResult {
  if (!currentLabels.includes(LABELS.NEEDS_HUMAN)) {
    return { labels: [...currentLabels], changed: false };
  }
  return {
    labels: currentLabels.filter((l) => l !== LABELS.NEEDS_HUMAN),
    changed: true,
  };
}
