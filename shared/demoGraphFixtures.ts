import eastVillageFixture from "./fixtures/east-village-demo-graph.json";
import shoreditchFixture from "./fixtures/shoreditch-demo-graph.json";
import type { DemonstrationPreset } from "./demoPresets";
import type { CityGraph } from "./epidemic";

const fixtureByPresetId: Record<string, CityGraph> = {
  "random-chance-alignment": shoreditchFixture as CityGraph,
  "highest-degree-hub": eastVillageFixture as CityGraph,
  "betweenness-bridge": eastVillageFixture as CityGraph,
  "dijkstra-route-block": shoreditchFixture as CityGraph,
  "min-cut-separation": eastVillageFixture as CityGraph,
};

/**
 * Returns a fresh copy of a verified, bounded real-road graph for a curated
 * teaching scenario. This avoids network variability and keeps demos usable
 * in the Windows portable application without OpenStreetMap access.
 */
export function getDemonstrationGraphFixture(preset: Pick<DemonstrationPreset, "id">): CityGraph {
  const fixture = fixtureByPresetId[preset.id];
  if (!fixture) {
    throw new Error(`No bundled graph fixture is available for demonstration preset '${preset.id}'.`);
  }
  return structuredClone(fixture);
}

