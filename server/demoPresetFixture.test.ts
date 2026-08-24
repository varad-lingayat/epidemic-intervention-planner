import { describe, expect, it } from "vitest";
import { DEMONSTRATION_PRESETS } from "../shared/demoPresets";
import { getDemonstrationGraphFixture } from "../shared/demoGraphFixtures";
import { runFairStrategyComparison } from "../shared/interventions";

describe("offline curated demonstration reproduction", () => {
  it("reproduces every claimed leader and metric on the persisted bounded real-road graph fixture", async () => {
    for (const preset of DEMONSTRATION_PRESETS) {
      const graph = getDemonstrationGraphFixture(preset);
      expect(graph.nodes.some(node => node.id === preset.parameters.initialInfectedNodeIds[0])).toBe(true);
      const comparison = runFairStrategyComparison({ id: preset.id, title: preset.title, graph, parameters: preset.parameters, budget: preset.budget, evidence: [] });
      const leader = comparison.outcomes.find(outcome => outcome.strategy === preset.winner)!;
      expect(comparison.winnerStatus).toBe("unique");
      expect(comparison.winningStrategy).toBe(preset.winner);
      expect(leader.finalInfectedPopulation).toBe(preset.verification.finalInfections);
      expect(leader.finalMortalityPopulation).toBe(preset.verification.modeledDeaths);
    }
  });
});
