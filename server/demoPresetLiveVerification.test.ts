import { describe, expect, it } from "vitest";
import { DEMONSTRATION_PRESETS } from "../shared/demoPresets";
import { runFairStrategyComparison } from "../shared/interventions";
import { importOpenStreetMapRoadNetwork } from "./osmImport";

const VERIFY_LIVE_PRESETS = process.env.VERIFY_LIVE_DEMO_PRESETS === "1";

describe.skipIf(!VERIFY_LIVE_PRESETS)("live curated demonstration verification", () => {
  it("reproduces every claimed unique strategy leader on its bounded real-road graph", async () => {
    const graphByMap = new Map<string, Awaited<ReturnType<typeof importOpenStreetMapRoadNetwork>>>();
    for (const preset of DEMONSTRATION_PRESETS) {
      const key = JSON.stringify(preset.map);
      let graph = graphByMap.get(key);
      if (!graph) {
        graph = await importOpenStreetMapRoadNetwork(preset.map);
        graphByMap.set(key, graph);
      }
      expect(graph.nodes.some(node => node.id === preset.parameters.initialInfectedNodeIds[0])).toBe(true);
      const comparison = runFairStrategyComparison({ id: preset.id, title: preset.title, graph, parameters: preset.parameters, budget: preset.budget, evidence: [] });
      const leader = comparison.outcomes.find(outcome => outcome.strategy === preset.winner)!;
      expect(comparison.winnerStatus).toBe("unique");
      expect(comparison.winningStrategy).toBe(preset.winner);
      expect(leader.finalInfectedPopulation).toBe(preset.verification.finalInfections);
      expect(leader.finalMortalityPopulation).toBe(preset.verification.modeledDeaths);
    }
  }, 120_000);
});
