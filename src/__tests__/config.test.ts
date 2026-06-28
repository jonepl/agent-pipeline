import { describe, it, expect } from "vitest";
import { DEFAULT_CONFIG, mergeConfig, loadConfig } from "../config.js";
import { LABELS } from "../labels.js";

describe("DEFAULT_CONFIG", () => {
  it("has K=1", () => {
    expect(DEFAULT_CONFIG.K).toBe(1);
  });

  it("has pollIntervalMs=30000", () => {
    expect(DEFAULT_CONFIG.pollIntervalMs).toBe(30_000);
  });

  it("has selfHeal=false", () => {
    expect(DEFAULT_CONFIG.selfHeal).toBe(false);
  });

  it("has selfHealBudget=1", () => {
    expect(DEFAULT_CONFIG.selfHealBudget).toBe(1);
  });

  it("has redispatch=false", () => {
    expect(DEFAULT_CONFIG.redispatch).toBe(false);
  });

  it("uses LABELS constants for label names", () => {
    expect(DEFAULT_CONFIG.labels.ready).toBe(LABELS.READY);
    expect(DEFAULT_CONFIG.labels.planApproved).toBe(LABELS.PLAN_APPROVED);
    expect(DEFAULT_CONFIG.labels.needsHuman).toBe(LABELS.NEEDS_HUMAN);
  });
});

describe("mergeConfig", () => {
  it("overrides K without affecting other top-level fields", () => {
    const config = mergeConfig({ K: 5 });
    expect(config.K).toBe(5);
    expect(config.pollIntervalMs).toBe(DEFAULT_CONFIG.pollIntervalMs);
    expect(config.selfHeal).toBe(DEFAULT_CONFIG.selfHeal);
  });

  it("deep-merges models — partial override preserves unspecified roles", () => {
    const config = mergeConfig({ models: { planner: "claude-opus-4-8" } });
    expect(config.models.planner).toBe("claude-opus-4-8");
    expect(config.models.implementer).toBe(DEFAULT_CONFIG.models.implementer);
    expect(config.models.reviewer).toBe(DEFAULT_CONFIG.models.reviewer);
  });

  it("deep-merges labels — partial override preserves unspecified names", () => {
    const config = mergeConfig({ labels: { ready: "custom-ready" } });
    expect(config.labels.ready).toBe("custom-ready");
    expect(config.labels.planApproved).toBe(DEFAULT_CONFIG.labels.planApproved);
    expect(config.labels.needsHuman).toBe(DEFAULT_CONFIG.labels.needsHuman);
  });

  it("with empty overrides returns DEFAULT_CONFIG values", () => {
    const config = mergeConfig({});
    expect(config).toEqual(DEFAULT_CONFIG);
  });
});

describe("loadConfig", () => {
  it("returns DEFAULT_CONFIG when the config file does not exist", async () => {
    const config = await loadConfig("/nonexistent/path/pipeline.config.ts");
    expect(config).toEqual(DEFAULT_CONFIG);
  });
});
