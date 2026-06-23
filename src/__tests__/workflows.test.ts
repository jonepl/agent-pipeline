import { readFile } from "node:fs/promises";
import { describe, it, expect } from "vitest";
import { TRANSITIONS } from "../labelMachine.js";
import { LABELS } from "../labels.js";

// Map each happy-path 'from' label to the workflow file that must trigger on it.
const LABEL_TO_WORKFLOW: Record<string, string> = {
  [LABELS.READY]: ".github/workflows/derive-graph.yml",
  [LABELS.READY_TO_PLAN]: ".github/workflows/draft-plan.yml",
  [LABELS.PLAN_APPROVED]: ".github/workflows/implement.yml",
  [LABELS.VERIFYING]: ".github/workflows/verify.yml",
};

async function readWorkflow(path: string): Promise<string> {
  return readFile(path, "utf-8");
}

describe("GitHub Actions workflows", () => {
  describe("each workflow triggers on exactly the label that starts its transition", () => {
    for (const [label, workflowPath] of Object.entries(LABEL_TO_WORKFLOW)) {
      it(`${workflowPath} triggers on '${label}'`, async () => {
        const content = await readWorkflow(workflowPath);
        expect(content).toContain(label);
      });
    }
  });

  describe("trigger labels are a subset of the TRANSITIONS 'from' labels (no orphan workflows)", () => {
    it("every workflow trigger label exists in the TRANSITIONS table", () => {
      const fromLabels = new Set(TRANSITIONS.map((t) => t.from));
      for (const label of Object.keys(LABEL_TO_WORKFLOW)) {
        expect(fromLabels.has(label as typeof LABELS[keyof typeof LABELS])).toBe(true);
      }
    });
  });

  describe("each workflow advances to the correct target label", () => {
    it("draft-plan.yml contains awaiting-plan-approval", async () => {
      const content = await readWorkflow(".github/workflows/draft-plan.yml");
      expect(content).toContain(LABELS.AWAITING_PLAN_APPROVAL);
    });

    it("implement.yml contains verifying", async () => {
      const content = await readWorkflow(".github/workflows/implement.yml");
      expect(content).toContain(LABELS.VERIFYING);
    });

    it("verify.yml contains awaiting-merge", async () => {
      const content = await readWorkflow(".github/workflows/verify.yml");
      expect(content).toContain(LABELS.AWAITING_MERGE);
    });
  });

  describe("every workflow parks the issue on failure", () => {
    for (const workflowPath of Object.values(LABEL_TO_WORKFLOW)) {
      it(`${workflowPath} adds needs-human on failure`, async () => {
        const content = await readWorkflow(workflowPath);
        expect(content).toContain(LABELS.NEEDS_HUMAN);
      });
    }
  });
});
