import { importOpenStreetMapRoadNetwork } from "../server/osmImport";
import { runFairStrategyComparison } from "../shared/interventions";

const graph = await importOpenStreetMapRoadNetwork({ placeName: "Shoreditch, London — street network", centerLat: 51.5246, centerLng: -0.0784, radiusKm: 0.06, maxNodes: 250, includeFootways: false });
const sources = graph.nodes.filter(node => node.population > 0).sort((a, b) => b.population - a.population || a.id.localeCompare(b.id));
const sourceIds = [...sources.slice(0, 6), ...sources.slice(-6)].map(node => node.id);
const parameterSets = [
  { transmissionRate: 0.22, recoveryRate: 0.06, mortalityRate: 0.006, days: 16 },
  { transmissionRate: 0.3, recoveryRate: 0.08, mortalityRate: 0.012, days: 20 },
  { transmissionRate: 0.42, recoveryRate: 0.1, mortalityRate: 0.02, days: 24 },
] as const;
let attempts = 0;
let result: unknown = null;
outer: for (const params of parameterSets) {
  for (const sourceId of sourceIds) {
    for (let seed = 1; seed <= 120; seed += 1) {
      attempts += 1;
      const comparison = runFairStrategyComparison({ id: `random-search-${attempts}`, title: "Random baseline search", graph, parameters: { ...params, initialInfectedNodeIds: [sourceId], simulationSeed: seed }, budget: { maxRoadClosures: 1, maxQuarantinedNodes: 0, maxQuarantinedPopulation: 0 } });
      if (comparison.winnerStatus === "unique" && comparison.winningStrategy === "random") {
        result = { sourceId, parameters: { ...params, initialInfectedNodeIds: [sourceId], simulationSeed: seed }, budget: comparison.fairness.interventionBudget, outcomes: comparison.outcomes.map(outcome => ({ strategy: outcome.strategy, finalInfections: outcome.finalInfectedPopulation, deaths: outcome.finalMortalityPopulation, actions: outcome.actions })) };
        break outer;
      }
      if (attempts % 25 === 0) console.error(`Tested ${attempts} targeted random-baseline cases.`);
    }
  }
}
console.error(`Random-baseline search finished after ${attempts} comparisons.`);
console.log(JSON.stringify({ result }, null, 2));
