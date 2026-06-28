import { resolve } from "node:path";
import { LABELS } from "./labels.js";

export type ModelAssignments = {
  readonly planner: string;
  readonly planDrafter: string;
  readonly implementer: string;
  readonly reviewer: string;
  readonly verifier: string;
};

export type LabelNames = {
  readonly ready: string;
  readonly readyToPlan: string;
  readonly awaitingPlanApproval: string;
  readonly planApproved: string;
  readonly verifying: string;
  readonly awaitingMerge: string;
  readonly needsHuman: string;
  readonly redispatch: string;
};

export type PipelineConfig = {
  readonly K: number;
  readonly pollIntervalMs: number;
  readonly prdPath: string;
  readonly selfHeal: boolean;
  readonly selfHealBudget: number;
  readonly redispatch: boolean;
  readonly models: ModelAssignments;
  readonly labels: LabelNames;
};

export type ConfigOverrides = {
  readonly K?: number;
  readonly pollIntervalMs?: number;
  readonly prdPath?: string;
  readonly selfHeal?: boolean;
  readonly selfHealBudget?: number;
  readonly redispatch?: boolean;
  readonly models?: Partial<ModelAssignments>;
  readonly labels?: Partial<LabelNames>;
};

export const DEFAULT_CONFIG: PipelineConfig = {
  K: 1,
  pollIntervalMs: 30_000,
  prdPath: "docs/PRD.md",
  selfHeal: false,
  selfHealBudget: 1,
  redispatch: false,
  models: {
    planner: "claude-sonnet-4-6",
    planDrafter: "claude-sonnet-4-6",
    implementer: "claude-sonnet-4-6",
    reviewer: "claude-sonnet-4-6",
    verifier: "claude-sonnet-4-6",
  },
  labels: {
    ready: LABELS.READY,
    readyToPlan: LABELS.READY_TO_PLAN,
    awaitingPlanApproval: LABELS.AWAITING_PLAN_APPROVAL,
    planApproved: LABELS.PLAN_APPROVED,
    verifying: LABELS.VERIFYING,
    awaitingMerge: LABELS.AWAITING_MERGE,
    needsHuman: LABELS.NEEDS_HUMAN,
    redispatch: LABELS.REDISPATCH,
  },
};

/** Type helper for user-authored pipeline.config.ts files. */
export function defineConfig(overrides: ConfigOverrides): ConfigOverrides {
  return overrides;
}

export function mergeConfig(overrides: ConfigOverrides): PipelineConfig {
  return {
    ...DEFAULT_CONFIG,
    ...overrides,
    models: { ...DEFAULT_CONFIG.models, ...overrides.models },
    labels: { ...DEFAULT_CONFIG.labels, ...overrides.labels },
  };
}

export async function loadConfig(configPath?: string): Promise<PipelineConfig> {
  const filePath =
    configPath !== undefined
      ? resolve(configPath)
      : resolve(process.cwd(), "pipeline.config.ts");
  try {
    const mod = await import(filePath);
    const overrides: ConfigOverrides = mod.default ?? mod;
    return mergeConfig(overrides);
  } catch {
    return DEFAULT_CONFIG;
  }
}
