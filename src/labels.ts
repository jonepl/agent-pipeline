export const LABELS = {
  READY: "ready",
  READY_TO_PLAN: "ready-to-plan",
  AWAITING_PLAN_APPROVAL: "awaiting-plan-approval",
  PLAN_APPROVED: "plan-approved",
  VERIFYING: "verifying",
  AWAITING_MERGE: "awaiting-merge",
  NEEDS_HUMAN: "needs-human",
  REDISPATCH: "redispatch",
} as const;

export type Label = (typeof LABELS)[keyof typeof LABELS];
