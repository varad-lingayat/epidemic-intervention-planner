import type { EpidemicParameters, InterventionBudget, StrategyName } from "./epidemic";

export type DemoMapConfig = {
  placeName: string;
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  maxNodes: number;
  includeFootways: boolean;
};

export type DemonstrationPreset = {
  id: string;
  title: string;
  winner: StrategyName;
  map: DemoMapConfig;
  parameters: EpidemicParameters;
  budget: InterventionBudget;
  narrative: string;
  teachingPoint: string;
  verification: { finalInfections: number; modeledDeaths: number };
};

const eastVillage: DemoMapConfig = { placeName: "East Village, New York — street grid", centerLat: 40.7287, centerLng: -73.9892, radiusKm: 0.06, maxNodes: 250, includeFootways: false };
const shoreditch: DemoMapConfig = { placeName: "Shoreditch, London — street network", centerLat: 51.5246, centerLng: -0.0784, radiusKm: 0.06, maxNodes: 250, includeFootways: false };

/**
 * Curated, deterministic scenarios searched against the bounded OSM graph.
 * They demonstrate contextual algorithm performance, not universal superiority.
 */
export const DEMONSTRATION_PRESETS: DemonstrationPreset[] = [
  {
    id: "random-chance-alignment", title: "01 · Chance alignment", winner: "random", map: shoreditch,
    parameters: { transmissionRate: 0.22, recoveryRate: 0.06, mortalityRate: 0.006, days: 16, initialInfectedNodeIds: ["osm-node-1762163972"], simulationSeed: 28 },
    budget: { maxRoadClosures: 1, maxQuarantinedNodes: 0, maxQuarantinedPopulation: 0 },
    narrative: "A one-road response happens to select a useful corridor in this seed. Random wins only by a modeled mortality tie-break—not because random selection is generally preferable.",
    teachingPoint: "A baseline can occasionally look strong by chance; repeatable comparison and explicit tie handling prevent overclaiming.", verification: { finalInfections: 3264, modeledDeaths: 140 },
  },
  {
    id: "highest-degree-hub", title: "02 · Hub protection", winner: "highest_degree", map: eastVillage,
    parameters: { transmissionRate: 0.18, recoveryRate: 0.06, mortalityRate: 0.006, days: 16, initialInfectedNodeIds: ["osm-node-1103732192"], simulationSeed: 998244353 },
    budget: { maxRoadClosures: 1, maxQuarantinedNodes: 0, maxQuarantinedPopulation: 0 },
    narrative: "With only one corridor closure available, the local high-degree connection is the most effective modeled containment point.",
    teachingPoint: "Degree works well when preventing contact at a highly connected hub dominates the outcome.", verification: { finalInfections: 7037, modeledDeaths: 167 },
  },
  {
    id: "betweenness-bridge", title: "03 · Bridge containment", winner: "betweenness_centrality", map: eastVillage,
    parameters: { transmissionRate: 0.26, recoveryRate: 0.08, mortalityRate: 0.012, days: 20, initialInfectedNodeIds: ["osm-node-1103732192"], simulationSeed: 101 },
    budget: { maxRoadClosures: 1, maxQuarantinedNodes: 0, maxQuarantinedPopulation: 0 },
    narrative: "A bridge-like road sits on many shortest routes, so prioritizing central passage is more useful than simply selecting the nearest hub.",
    teachingPoint: "Betweenness targets flow between regions, not merely the number of direct neighbours.", verification: { finalInfections: 14402, modeledDeaths: 932 },
  },
  {
    id: "dijkstra-route-block", title: "04 · Likely-route blocking", winner: "dijkstra_blocking", map: shoreditch,
    parameters: { transmissionRate: 0.18, recoveryRate: 0.06, mortalityRate: 0.006, days: 16, initialInfectedNodeIds: ["osm-node-1812313884"], simulationSeed: 101 },
    budget: { maxRoadClosures: 0, maxQuarantinedNodes: 1, maxQuarantinedPopulation: 1800 },
    narrative: "The single available location quarantine lies on repeatedly likely source-to-destination routes, sharply reducing modeled spread.",
    teachingPoint: "Dijkstra Blocking focuses on plausible transmission paths from the source to major destinations.", verification: { finalInfections: 12, modeledDeaths: 1 },
  },
  {
    id: "min-cut-separation", title: "05 · Minimum cut", winner: "max_flow_min_cut", map: eastVillage,
    parameters: { transmissionRate: 0.18, recoveryRate: 0.06, mortalityRate: 0.006, days: 16, initialInfectedNodeIds: ["osm-node-1103732192"], simulationSeed: 20260820 },
    budget: { maxRoadClosures: 2, maxQuarantinedNodes: 0, maxQuarantinedPopulation: 0 },
    narrative: "Two road closures can sever a low-capacity separation between the outbreak source and major destinations.",
    teachingPoint: "Max-Flow/Min-Cut is most compelling when a small cut can isolate a source region under a strict road budget.", verification: { finalInfections: 7087, modeledDeaths: 147 },
  },
];

export const DEMONSTRATION_ORDER: StrategyName[] = ["random", "highest_degree", "betweenness_centrality", "dijkstra_blocking", "max_flow_min_cut"];

export function adjacentDemoPresetIndex(activeIndex: number, direction: "previous" | "next") {
  const total = DEMONSTRATION_PRESETS.length;
  if (!total) return 0;
  return direction === "previous" ? (activeIndex - 1 + total) % total : (activeIndex + 1) % total;
}

export function demonstrationControlTargets(activeIndex: number) {
  return {
    load: activeIndex,
    previous: adjacentDemoPresetIndex(activeIndex, "previous"),
    next: adjacentDemoPresetIndex(activeIndex, "next"),
  };
}

export function createDemonstrationController(activeIndex: number, onLoad: (index: number) => void, onClose: () => void) {
  const targets = demonstrationControlTargets(activeIndex);
  return {
    loadCurrent: () => onLoad(targets.load),
    loadPrevious: () => onLoad(targets.previous),
    loadNext: () => onLoad(targets.next),
    close: () => onClose(),
  };
}
