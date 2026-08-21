import { describe, expect, it } from "vitest";
import { adjacentDemoPresetIndex, createDemonstrationController, demonstrationControlTargets, DEMONSTRATION_ORDER, DEMONSTRATION_PRESETS } from "../shared/demoPresets";

describe("guided demonstration presets", () => {
  it("contains one transparent teaching scenario for each implemented strategy", () => {
    expect(DEMONSTRATION_PRESETS).toHaveLength(5);
    expect(DEMONSTRATION_PRESETS.map(preset => preset.winner)).toEqual(DEMONSTRATION_ORDER);
    expect(new Set(DEMONSTRATION_PRESETS.map(preset => preset.winner)).size).toBe(5);
  });

  it("keeps each real-road import bounded and every preset reproducible", () => {
    DEMONSTRATION_PRESETS.forEach(preset => {
      expect(preset.map.radiusKm).toBeGreaterThan(0);
      expect(preset.map.radiusKm).toBeLessThanOrEqual(0.1);
      expect(preset.map.maxNodes).toBeLessThanOrEqual(320);
      expect(preset.parameters.initialInfectedNodeIds).toHaveLength(1);
      expect(preset.parameters.simulationSeed).toBeGreaterThan(0);
      expect(preset.budget.maxRoadClosures + preset.budget.maxQuarantinedNodes).toBeGreaterThan(0);
      expect(preset.narrative.length).toBeGreaterThan(80);
      expect(preset.teachingPoint.length).toBeGreaterThan(60);
    });
  });

  it("provides predictable previous and next controls for the guided demonstration", () => {
    expect(adjacentDemoPresetIndex(0, "previous")).toBe(DEMONSTRATION_PRESETS.length - 1);
    expect(adjacentDemoPresetIndex(DEMONSTRATION_PRESETS.length - 1, "next")).toBe(0);
    expect(adjacentDemoPresetIndex(2, "previous")).toBe(1);
    expect(adjacentDemoPresetIndex(2, "next")).toBe(3);
    expect(demonstrationControlTargets(0)).toEqual({ load: 0, previous: DEMONSTRATION_PRESETS.length - 1, next: 1 });
    expect(demonstrationControlTargets(DEMONSTRATION_PRESETS.length - 1)).toEqual({ load: DEMONSTRATION_PRESETS.length - 1, previous: DEMONSTRATION_PRESETS.length - 2, next: 0 });
  });

  it("wires load, next, previous, and close interactions to the expected callbacks", () => {
    const loaded: number[] = [];
    let closed = 0;
    const controller = createDemonstrationController(0, index => loaded.push(index), () => { closed += 1; });
    controller.loadCurrent(); controller.loadPrevious(); controller.loadNext(); controller.close();
    expect(loaded).toEqual([0, DEMONSTRATION_PRESETS.length - 1, 1]);
    expect(closed).toBe(1);
  });
});
