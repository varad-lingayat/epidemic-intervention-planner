import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { DEMONSTRATION_PRESETS } from "../shared/demoPresets";
import type { CityGraph } from "../shared/epidemic";
import { runFairStrategyComparison } from "../shared/interventions";

const fixtureForPreset = (placeName: string) => placeName.startsWith("Shoreditch") ? "shoreditch-demo-graph.json" : "east-village-demo-graph.json";

async function loadFixture(fileName: string) {
  const content = await readFile(resolve(import.meta.dirname, "fixtures", fileName), "utf8");
  return JSON.parse(content) as CityGraph;
}

describe("offline curated demonstration reproduction", () => {
  it("reproduces every claimed leader and metric on the persisted bounded real-road graph fixture", async () => {
    const graphs = new Map<string, CityGraph>();
    for (const preset of DEMONSTRATION_PRESETS) {
      const fixtureName = fixtureForPreset(preset.map.placeName);
      let graph = graphs.get(fixtureName);
      if (!graph) {
        graph = await loadFixture(fixtureName);
        graphs.set(fixtureName, graph);
      }
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
