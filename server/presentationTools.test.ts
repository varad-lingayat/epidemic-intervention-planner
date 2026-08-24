import { describe, expect, it } from "vitest";
import { buildStrategyComparisonCsv, createStandardPresentationScenario, createStandardWorkspaceResetState, STANDARD_INTERVENTION_BUDGET, STANDARD_REAL_ROAD_CONFIG, STANDARD_SYNTHETIC_SETTINGS } from "../shared/presentationTools";

describe("presentation finishing tools", () => {
  it("restores the deterministic standard teaching scenario without temporary actions or evidence", () => {
    const standard = createStandardPresentationScenario();
    expect(standard.graph.name).toBe(STANDARD_SYNTHETIC_SETTINGS.name);
    expect(standard.parameters.initialInfectedNodeIds).toHaveLength(1);
    expect(standard.comparison.evidence).toEqual([]);
    expect(standard.budget).toEqual(STANDARD_INTERVENTION_BUDGET);
  });

  it("reuses the immutable standard scenario instead of rerunning five strategies for every startup or reset", () => {
    const first = createStandardPresentationScenario();
    const second = createStandardPresentationScenario();
    expect(second).toBe(first);
    expect(second.comparison).toBe(first.comparison);
  });

  it("exports each fair strategy with metrics, budget use, and selected actions", () => {
    const csv = buildStrategyComparisonCsv(createStandardPresentationScenario().comparison);
    expect(csv.split("\n")).toHaveLength(6);
    expect(csv).toContain('"strategy"');
    expect(csv).toContain('"selected_actions"');
    expect(csv).toContain('"highest_degree"');
  });

  it("returns the exact state consumed by the Home workspace Reset action", () => {
    const reset = createStandardWorkspaceResetState();
    expect(reset.cityMode).toBe("synthetic");
    expect(reset.syntheticSettings).toEqual(STANDARD_SYNTHETIC_SETTINGS);
    expect(reset.realConfig).toEqual(STANDARD_REAL_ROAD_CONFIG);
    expect(reset.graph.name).toBe("Asterhaven");
    expect(reset.symptomEvidence).toEqual([]);
    expect(reset.manualActions).toEqual([]);
    expect(reset.manualOutcome).toBeUndefined();
    expect(reset.plainEnglishExplanation).toBeUndefined();
    expect(reset.shareUrl).toBeUndefined();
    expect(reset.demoOpen).toBe(false);
    expect(reset.demoIndex).toBe(0);
    expect(reset.view).toBe("setup");
    expect(reset.networkMode).toBe("2d");
    expect(reset.day).toBe(0);
    expect(reset.playing).toBe(false);
  });
});
