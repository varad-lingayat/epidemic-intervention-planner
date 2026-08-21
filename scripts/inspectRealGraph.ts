import { importOpenStreetMapRoadNetwork } from "../server/osmImport";
import { runFairStrategyComparison } from "../shared/interventions";

const graph = await importOpenStreetMapRoadNetwork({
  placeName: "Shoreditch, London — street network", centerLat: 51.5246, centerLng: -0.0784, radiusKm: 0.06, maxNodes: 250, includeFootways: false,
});
const initial = graph.nodes.sort((a, b) => b.population - a.population)[0]!;
const comparison = runFairStrategyComparison({
  id: "diagnostic", title: "diagnostic", graph,
  parameters: { transmissionRate: 0.48, recoveryRate: 0.08, mortalityRate: 0.012, days: 32, initialInfectedNodeIds: [initial.id], simulationSeed: 481516234 },
  budget: { maxRoadClosures: 1, maxQuarantinedNodes: 0, maxQuarantinedPopulation: 0 }, evidence: [],
});
console.log(JSON.stringify({
  graph: { nodes: graph.nodes.length, edges: graph.edges.length, highestPopulationNode: initial.id, maxDegree: Math.max(...graph.nodes.map(node => Number(node.metadata?.roadDegree ?? 0))) },
  outcomes: comparison.outcomes.map(outcome => ({ strategy: outcome.strategy, finalInfections: outcome.finalInfectedPopulation, deaths: outcome.finalMortalityPopulation, actions: outcome.actions })),
}, null, 2));
