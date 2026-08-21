import { importOpenStreetMapRoadNetwork } from "../server/osmImport";
import { runFairStrategyComparison } from "../shared/interventions";

const graph = await importOpenStreetMapRoadNetwork({ placeName: "East Village, New York — street grid", centerLat: 40.7287, centerLng: -73.9892, radiusKm: 0.06, maxNodes: 250, includeFootways: false });
const source = graph.nodes.filter(node => node.population > 0).sort((a, b) => b.population - a.population)[0]?.id;
if (!source) throw new Error("No population-bearing source node is available.");
const candidates = [126, 445, 669, 838, 1149, 1247, 1504, 1584, 1603, 1747, 2029, 2130];
const results = candidates.map(simulationSeed => {
  const comparison = runFairStrategyComparison({ id: `random-${simulationSeed}`, title: "Random candidate", graph, parameters: { transmissionRate: 0.34, recoveryRate: 0.08, mortalityRate: 0.012, days: 24, initialInfectedNodeIds: [source], simulationSeed }, budget: { maxRoadClosures: 3, maxQuarantinedNodes: 0, maxQuarantinedPopulation: 0 } });
  return { simulationSeed, winnerStatus: comparison.winnerStatus, leadingStrategies: comparison.leadingStrategies, scores: Object.fromEntries(comparison.outcomes.map(outcome => [outcome.strategy, outcome.finalInfectedPopulation])) };
});
console.log(JSON.stringify({ source, results }, null, 2));
