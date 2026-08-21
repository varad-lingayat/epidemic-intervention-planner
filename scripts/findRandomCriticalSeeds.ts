import { importOpenStreetMapRoadNetwork } from "../server/osmImport";
import { runFairStrategyComparison } from "../shared/interventions";

const config = { placeName: "East Village, New York — street grid", centerLat: 40.7287, centerLng: -73.9892, radiusKm: 0.06, maxNodes: 250, includeFootways: false };
const graph = await importOpenStreetMapRoadNetwork(config);
const source = graph.nodes.filter(node => node.population > 0).sort((a, b) => b.population - a.population)[0]?.id;
if (!source) throw new Error("No population-bearing source node is available.");
const template = { id: "seed-filter", title: "Seed filter", graph, parameters: { transmissionRate: 0.34, recoveryRate: 0.08, mortalityRate: 0.012, days: 24, initialInfectedNodeIds: [source], simulationSeed: 1 }, budget: { maxRoadClosures: 1, maxQuarantinedNodes: 0, maxQuarantinedPopulation: 0 } };
const reference = runFairStrategyComparison(template);
const critical = new Set(reference.outcomes.find(outcome => outcome.strategy === "max_flow_min_cut")?.actions.filter(action => action.kind === "close_road").map(action => action.edgeId) ?? []);

function seededRandom(seed: number) { let state = seed >>> 0; return () => { state += 0x6d2b79f5; let value = state; value = Math.imul(value ^ (value >>> 15), value | 1); value ^= value + Math.imul(value ^ (value >>> 7), value | 61); return ((value ^ (value >>> 14)) >>> 0) / 4294967296; }; }
function shuffle<T>(values: T[], random: () => number) { const copy = [...values]; for (let index = copy.length - 1; index > 0; index -= 1) { const randomIndex = Math.floor(random() * (index + 1)); [copy[index], copy[randomIndex]] = [copy[randomIndex]!, copy[index]!]; } return copy; }

const populationIds = graph.nodes.filter(node => node.population > 0).map(node => node.id);
const edgeIds = graph.edges.map(edge => edge.id);
const candidates: number[] = [];
for (let seed = 1; seed <= 200000 && candidates.length < 64; seed += 1) {
  const random = seededRandom(seed + 101);
  shuffle(populationIds, random);
  const selectedRoad = shuffle(edgeIds, random)[0];
  if (selectedRoad && critical.has(selectedRoad)) candidates.push(seed);
}
console.log(JSON.stringify({ config, source, criticalRoadIds: [...critical], candidates }, null, 2));
