import { describe, expect, it } from "vitest";
import { getDemonstrationGraphFixture } from "../shared/demoGraphFixtures";
import { DEMONSTRATION_PRESETS } from "../shared/demoPresets";

describe("bundled demonstration graph fixtures", () => {
  it("supplies every curated preset without requesting a live map", () => {
    for (const preset of DEMONSTRATION_PRESETS) {
      const graph = getDemonstrationGraphFixture(preset);
      expect(graph.nodes.length).toBeGreaterThan(0);
      expect(graph.edges.length).toBeGreaterThan(0);
      expect(graph.nodes.some(node => node.id === preset.parameters.initialInfectedNodeIds[0])).toBe(true);
    }
  });

  it("returns a fresh graph copy for every load", () => {
    const preset = DEMONSTRATION_PRESETS[0]!;
    const first = getDemonstrationGraphFixture(preset);
    const second = getDemonstrationGraphFixture(preset);
    first.name = "changed locally";

    expect(second.name).not.toBe("changed locally");
  });
});

