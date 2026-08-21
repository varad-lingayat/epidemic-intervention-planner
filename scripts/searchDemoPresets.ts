import { importOpenStreetMapRoadNetwork } from "../server/osmImport";
import type { EpidemicParameters, InterventionBudget, StrategyName } from "../shared/epidemic";
import { runFairStrategyComparison } from "../shared/interventions";

const TARGETS: StrategyName[] = ["dijkstra_blocking"];
const config = {
  placeName: "Shoreditch, London — street network",
  centerLat: 51.5246,
  centerLng: -0.0784,
  radiusKm: 0.06,
  maxNodes: 250,
  includeFootways: false,
};

console.error("Loading the bounded real-road graph…");
const graph = await importOpenStreetMapRoadNetwork(config);
console.error(`Loaded ${graph.nodes.length} real road junctions and ${graph.edges.length} road links.`);
const populationNodes = graph.nodes.filter(node => node.population > 0).sort((a, b) => b.population - a.population || a.id.localeCompare(b.id));
const anchors = Array.from(new Set([...populationNodes.slice(0, 5), ...populationNodes.slice(-5)].map(node => node.id))).slice(0, 10);
const seedSets = [
  ...anchors.map(id => [id]),
  ...anchors.slice(0, 5).map((id, index) => [id, anchors[(index + 5) % anchors.length]!]),
  ...anchors.slice(0, 3).map((id, index) => [id, anchors[(index + 3) % anchors.length]!, anchors[(index + 7) % anchors.length]!]),
];
const parameterSets = [
  [0.18, 0.06, 0.006, 16], [0.26, 0.08, 0.012, 20], [0.34, 0.07, 0.018, 24],
  [0.42, 0.1, 0.026, 28], [0.5, 0.12, 0.034, 30],
] as const;
const budgets: InterventionBudget[] = [
  { maxRoadClosures: 0, maxQuarantinedNodes: 1, maxQuarantinedPopulation: 1800 },
  { maxRoadClosures: 1, maxQuarantinedNodes: 1, maxQuarantinedPopulation: 1800 },
  { maxRoadClosures: 1, maxQuarantinedNodes: 2, maxQuarantinedPopulation: 3000 },
  { maxRoadClosures: 1, maxQuarantinedNodes: 0, maxQuarantinedPopulation: 0 },
  { maxRoadClosures: 2, maxQuarantinedNodes: 0, maxQuarantinedPopulation: 0 },
  { maxRoadClosures: 3, maxQuarantinedNodes: 0, maxQuarantinedPopulation: 0 },
  { maxRoadClosures: 5, maxQuarantinedNodes: 0, maxQuarantinedPopulation: 0 },
];
const simulationSeeds = [101, 733, 104729, 209759, 481516, 7919, 65537, 99991, 481516234, 998244353, 1357911, 20260820];

type Candidate = {
  target: StrategyName;
  margin: number;
  initialInfectedNodeIds: string[];
  parameters: EpidemicParameters;
  budget: InterventionBudget;
  scores: Record<StrategyName, { finalInfections: number; modeledDeaths: number }>;
};

const best = new Map<StrategyName, Candidate>();
let attempts = 0;
outer: for (const initialInfectedNodeIds of seedSets) {
  for (const [transmissionRate, recoveryRate, mortalityRate, days] of parameterSets) {
    for (const budget of budgets) {
      for (const simulationSeed of simulationSeeds) {
        attempts += 1;
        if (attempts % 20 === 0) console.error(`Evaluated ${attempts} controlled comparisons; found ${best.size}/5 strict winners.`);
        const parameters: EpidemicParameters = { transmissionRate, recoveryRate, mortalityRate, days, initialInfectedNodeIds, simulationSeed };
        const comparison = runFairStrategyComparison({ id: `demo-search-${attempts}`, title: "Demo preset search", graph, parameters, budget, evidence: [] });
        const outcomes = [...comparison.outcomes].sort((left, right) => left.finalInfectedPopulation - right.finalInfectedPopulation || left.finalMortalityPopulation - right.finalMortalityPopulation);
        const winner = outcomes[0]!;
        const runnerUp = outcomes[1]!;
        const margin = (runnerUp.finalInfectedPopulation - winner.finalInfectedPopulation) * 10_000 + (runnerUp.finalMortalityPopulation - winner.finalMortalityPopulation);
        if (margin <= 0) continue;
        const candidate: Candidate = {
          target: winner.strategy,
          margin,
          initialInfectedNodeIds,
          parameters,
          budget,
          scores: Object.fromEntries(comparison.outcomes.map(outcome => [outcome.strategy, { finalInfections: outcome.finalInfectedPopulation, modeledDeaths: outcome.finalMortalityPopulation }])) as Candidate["scores"],
        };
        const existing = best.get(winner.strategy);
        if (!existing || candidate.margin > existing.margin) best.set(winner.strategy, candidate);
        if (TARGETS.every(target => best.has(target)) || attempts >= 420) break outer;
      }
    }
  }
}

console.error(`Search complete after ${attempts} comparisons; found ${TARGETS.filter(target => best.has(target)).length}/${TARGETS.length} requested strict winners.`);
console.log(JSON.stringify({ config, graphSummary: { nodeCount: graph.nodes.length, edgeCount: graph.edges.length }, attempts, found: TARGETS.map(target => best.get(target) ?? null) }, null, 2));
