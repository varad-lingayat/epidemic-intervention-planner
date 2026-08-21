import { importOpenStreetMapRoadNetwork } from "../server/osmImport";

const candidates = [
  { placeName: "Bandra West, Mumbai — compact", centerLat: 19.0596, centerLng: 72.8295, radiusKm: 0.05, maxNodes: 90, includeFootways: false },
  { placeName: "Bandra West, Mumbai — neighborhood", centerLat: 19.0596, centerLng: 72.8295, radiusKm: 0.08, maxNodes: 180, includeFootways: false },
  { placeName: "Bandra West, Mumbai — connected streets", centerLat: 19.0596, centerLng: 72.8295, radiusKm: 0.1, maxNodes: 260, includeFootways: false },
  { placeName: "Bandra West, Mumbai — walkable grid", centerLat: 19.0596, centerLng: 72.8295, radiusKm: 0.07, maxNodes: 220, includeFootways: true },
  { placeName: "East Village, New York — street grid", centerLat: 40.7287, centerLng: -73.9892, radiusKm: 0.06, maxNodes: 250, includeFootways: false },
  { placeName: "Indiranagar, Bengaluru — street network", centerLat: 12.9718, centerLng: 77.6409, radiusKm: 0.07, maxNodes: 250, includeFootways: false },
  { placeName: "Shoreditch, London — street network", centerLat: 51.5246, centerLng: -0.0784, radiusKm: 0.06, maxNodes: 250, includeFootways: false },
];

for (const config of candidates) {
  try {
    const graph = await importOpenStreetMapRoadNetwork(config);
    const adjacency = new Map(graph.nodes.map(node => [node.id, [] as string[]]));
    graph.edges.forEach(edge => { adjacency.get(edge.source)?.push(edge.target); adjacency.get(edge.target)?.push(edge.source); });
    const visited = new Set<string>();
    let components = 0;
    adjacency.forEach((_, start) => {
      if (visited.has(start)) return;
      components += 1;
      const queue = [start]; visited.add(start);
      while (queue.length) adjacency.get(queue.shift()!)?.forEach(next => { if (!visited.has(next)) { visited.add(next); queue.push(next); } });
    });
    const degree = [...adjacency.values()].map(neighbours => neighbours.length);
    console.log(JSON.stringify({ config, nodes: graph.nodes.length, edges: graph.edges.length, components, maxDegree: Math.max(...degree), avgDegree: Number((degree.reduce((sum, value) => sum + value, 0) / degree.length).toFixed(2)) }));
  } catch (error) {
    console.log(JSON.stringify({ config, error: error instanceof Error ? error.message : String(error) }));
  }
}
