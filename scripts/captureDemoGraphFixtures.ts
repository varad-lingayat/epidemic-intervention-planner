import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { DEMONSTRATION_PRESETS } from "../shared/demoPresets";
import { importOpenStreetMapRoadNetwork } from "../server/osmImport";

const fixtures = [
  { name: "shoreditch-demo-graph.json", map: DEMONSTRATION_PRESETS.find(preset => preset.map.placeName.startsWith("Shoreditch"))!.map },
  { name: "east-village-demo-graph.json", map: DEMONSTRATION_PRESETS.find(preset => preset.map.placeName.startsWith("East Village"))!.map },
];
const fixtureDir = resolve(import.meta.dirname, "..", "server", "fixtures");

await mkdir(fixtureDir, { recursive: true });
for (const fixture of fixtures) {
  const graph = await importOpenStreetMapRoadNetwork(fixture.map);
  await writeFile(resolve(fixtureDir, fixture.name), JSON.stringify(graph), "utf8");
  console.error(`Captured ${fixture.name}: ${graph.nodes.length} nodes, ${graph.edges.length} edges`);
}
