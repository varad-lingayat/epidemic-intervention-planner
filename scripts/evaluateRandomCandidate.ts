import { importOpenStreetMapRoadNetwork } from "../server/osmImport";
import { runFairStrategyComparison } from "../shared/interventions";

const graph = await importOpenStreetMapRoadNetwork({ placeName: "East Village, New York — street grid", centerLat: 40.7287, centerLng: -73.9892, radiusKm: 0.06, maxNodes: 250, includeFootways: false });
const source = graph.nodes.filter(node => node.population > 0).sort((a, b) => b.population - a.population)[0]?.id;
if (!source) throw new Error("No population-bearing source node is available.");
const comparison = runFairStrategyComparison({
  id: "random-candidate", title: "Random candidate", graph,
  parameters: { transmissionRate: 0.34, recoveryRate: 0.08, mortalityRate: 0.012, days: 24, initialInfectedNodeIds: [source], simulationSeed: 126 },
  budget: { maxRoadClosures: 1, maxQuarantinedNodes: 0, maxQuarantinedPopulation: 0 },
});
console.log(JSON.stringify({ source, winnerStatus: comparison.winnerStatus, leadingStrategies: comparison.leadingStrategies, outcomes: comparison.outcomes.map(outcome => ({ strategy: outcome.strategy, finalInfections: outcome.finalInfectedPopulation, deaths: outcome.finalMortalityPopulation, actions: outcome.actions })) }, null, 2));
