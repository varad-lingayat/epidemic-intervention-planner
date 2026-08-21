import type { CityEdge, CityGraph, CityNode, OpenStreetMapImportConfig } from "../shared/epidemic";

type OverpassElement =
  | { type: "node"; id: number; lat: number; lon: number; tags?: Record<string, string> }
  | { type: "way"; id: number; nodes: number[]; tags?: Record<string, string> };

type OverpassResponse = { elements?: OverpassElement[] };

export class OsmImportError extends Error {
  constructor(
    message: string,
    public readonly code: "INVALID_AREA" | "UPSTREAM_UNAVAILABLE" | "OVERSIZED_NETWORK" | "EMPTY_NETWORK",
  ) {
    super(message);
    this.name = "OsmImportError";
  }
}

type CachedGraph = { graph: CityGraph; expiresAt: number };
const graphCache = new Map<string, CachedGraph>();
const CACHE_TTL_MS = 15 * 60 * 1000;
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
] as const;

const clamp = (value: number, lower: number, upper: number) => Math.max(lower, Math.min(upper, value));

function normaliseConfig(config: OpenStreetMapImportConfig): OpenStreetMapImportConfig {
  return {
    ...config,
    placeName: config.placeName.trim().slice(0, 80) || "Selected OpenStreetMap area",
    centerLat: clamp(config.centerLat, -85, 85),
    centerLng: clamp(config.centerLng, -180, 180),
    radiusKm: clamp(config.radiusKm, 0.05, 1.5),
    maxNodes: Math.floor(clamp(config.maxNodes, 20, 320)),
  };
}

function cacheKey(config: OpenStreetMapImportConfig) {
  return [
    config.centerLat.toFixed(4),
    config.centerLng.toFixed(4),
    config.radiusKm.toFixed(2),
    config.maxNodes,
    config.includeFootways,
  ].join(":");
}

function haversineKm(first: { lat: number; lng: number }, second: { lat: number; lng: number }) {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(second.lat - first.lat);
  const deltaLng = toRadians(second.lng - first.lng);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(first.lat)) * Math.cos(toRadians(second.lat)) * Math.sin(deltaLng / 2) ** 2;
  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function roadClass(highway?: string): CityEdge["roadClass"] {
  if (["motorway", "trunk", "primary"].includes(highway ?? "")) return "primary";
  if (["secondary", "tertiary"].includes(highway ?? "")) return "secondary";
  if (["footway", "path", "pedestrian", "cycleway"].includes(highway ?? "")) return "footway";
  if (["residential", "unclassified", "service", "living_street"].includes(highway ?? "")) return "local";
  return "unknown";
}

function roadAttributes(highway?: string) {
  const kind = roadClass(highway);
  if (kind === "primary") return { transmissionProbability: 0.061, capacity: 150 };
  if (kind === "secondary") return { transmissionProbability: 0.048, capacity: 105 };
  if (kind === "local") return { transmissionProbability: 0.034, capacity: 65 };
  if (kind === "footway") return { transmissionProbability: 0.016, capacity: 18 };
  return { transmissionProbability: 0.025, capacity: 40 };
}

function buildOverpassQuery(config: OpenStreetMapImportConfig) {
  const radiusMetres = Math.round(config.radiusKm * 1000);
  const highwayTypes = config.includeFootways
    ? "primary|secondary|tertiary|residential|unclassified|service|living_street|footway|pedestrian|path|cycleway"
    : "primary|secondary|tertiary|residential|unclassified|service|living_street";
  return `[out:json][timeout:25];way(around:${radiusMetres},${config.centerLat},${config.centerLng})[highway~"^(${highwayTypes})$"];out body;>;out skel qt;`;
}

function buildOsmMapUrl(config: OpenStreetMapImportConfig) {
  const latitudeOffset = config.radiusKm / 111.32;
  const longitudeOffset = config.radiusKm / Math.max(111.32 * Math.cos((config.centerLat * Math.PI) / 180), 0.2);
  const west = (config.centerLng - longitudeOffset).toFixed(6);
  const south = (config.centerLat - latitudeOffset).toFixed(6);
  const east = (config.centerLng + longitudeOffset).toFixed(6);
  const north = (config.centerLat + latitudeOffset).toFixed(6);
  return `https://api.openstreetmap.org/api/0.6/map?bbox=${west},${south},${east},${north}`;
}

function decodeXml(value: string) {
  return value.replaceAll("&amp;", "&").replaceAll("&quot;", '"').replaceAll("&apos;", "'").replaceAll("&lt;", "<").replaceAll("&gt;", ">");
}

function readXmlAttributes(fragment: string) {
  const attributes: Record<string, string> = {};
  Array.from(fragment.matchAll(/([\w:.-]+)="([^"]*)"/g)).forEach(match => {
    attributes[match[1]!] = decodeXml(match[2]!);
  });
  return attributes;
}

/** Parses the small, bounded XML payload from the official OSM map endpoint into the common graph contract. */
export function parseOsmMapXml(xml: string): OverpassResponse {
  const elements: OverpassElement[] = [];
  Array.from(xml.matchAll(/<node\b([^>]*)\/>/g)).forEach(match => {
    const attributes = readXmlAttributes(match[1]!);
    const id = Number(attributes.id);
    const lat = Number(attributes.lat);
    const lon = Number(attributes.lon);
    if (Number.isFinite(id) && Number.isFinite(lat) && Number.isFinite(lon)) elements.push({ type: "node", id, lat, lon });
  });
  Array.from(xml.matchAll(/<way\b([^>]*)>([\s\S]*?)<\/way>/g)).forEach(match => {
    const attributes = readXmlAttributes(match[1]!);
    const id = Number(attributes.id);
    if (!Number.isFinite(id)) return;
    const body = match[2]!;
    const nodes = Array.from(body.matchAll(/<nd\b[^>]*\bref="(\d+)"[^>]*\/>/g)).map(reference => Number(reference[1]!)).filter(Number.isFinite);
    const tags: Record<string, string> = {};
    Array.from(body.matchAll(/<tag\b([^>]*)\/>/g)).forEach(tag => {
      const tagAttributes = readXmlAttributes(tag[1]!);
      if (tagAttributes.k && tagAttributes.v) tags[tagAttributes.k] = tagAttributes.v;
    });
    elements.push({ type: "way", id, nodes, tags });
  });
  return { elements };
}

/** Uses one bounded attempt per public interpreter, avoiding aggressive retries against a rate-limited service. */
export async function fetchOverpassPayload(
  query: string,
  fetchImplementation: typeof fetch = fetch,
  endpoints: readonly string[] = OVERPASS_ENDPOINTS,
  outerSignal?: AbortSignal,
): Promise<OverpassResponse> {
  let lastFailure = "no response";
  for (const endpoint of endpoints) {
    if (outerSignal?.aborted) break;
    const controller = new AbortController();
    const onOuterAbort = () => controller.abort();
    outerSignal?.addEventListener("abort", onOuterAbort, { once: true });
    const endpointTimeout = setTimeout(() => controller.abort(), 8_000);
    try {
      const response = await fetchImplementation(endpoint, {
        method: "POST",
        headers: { "content-type": "text/plain;charset=UTF-8", accept: "application/json" },
        body: query,
        signal: controller.signal,
      });
      if (!response.ok) {
        lastFailure = `${new URL(endpoint).hostname} returned HTTP ${response.status}`;
        continue;
      }
      return (await response.json()) as OverpassResponse;
    } catch (error) {
      lastFailure = error instanceof Error ? error.message : "network failure";
    } finally {
      clearTimeout(endpointTimeout);
      outerSignal?.removeEventListener("abort", onOuterAbort);
    }
  }
  throw new OsmImportError(
    `OpenStreetMap data is temporarily unavailable or rate-limited (${lastFailure}). Please wait a moment and try a smaller area.`,
    "UPSTREAM_UNAVAILABLE",
  );
}

export async function fetchOsmMapPayload(
  config: OpenStreetMapImportConfig,
  fetchImplementation: typeof fetch = fetch,
  signal?: AbortSignal,
): Promise<OverpassResponse> {
  try {
    const response = await fetchImplementation(buildOsmMapUrl(config), {
      headers: { accept: "application/osm+xml, text/xml;q=0.9" },
      signal,
    });
    if (!response.ok) throw new OsmImportError(`The official OpenStreetMap map service returned HTTP ${response.status}.`, "UPSTREAM_UNAVAILABLE");
    return parseOsmMapXml(await response.text());
  } catch (error) {
    if (error instanceof OsmImportError) throw error;
    throw new OsmImportError("OpenStreetMap road data is temporarily unavailable. Please wait a moment and try the selected area again.", "UPSTREAM_UNAVAILABLE");
  }
}

/** Converts raw OSM ways and nodes to a small graph suitable for interactive classroom-scale simulations. */
export function normalizeOverpassNetwork(payload: OverpassResponse, inputConfig: OpenStreetMapImportConfig): CityGraph {
  const config = normaliseConfig(inputConfig);
  const elements = payload.elements ?? [];
  const osmNodes = new Map<number, Extract<OverpassElement, { type: "node" }>>();
  const osmWays: Extract<OverpassElement, { type: "way" }>[] = [];
  elements.forEach(element => {
    if (element.type === "node") osmNodes.set(element.id, element);
    if (element.type === "way") osmWays.push(element);
  });

  // Both Overpass and the official map endpoint can include the complete geometry of a
  // way that crosses the requested boundary. Keep only geometry within the selected
  // neighborhood before applying the interactive graph-size safeguard.
  const isWithinRequestedArea = (nodeId: number) => {
    const node = osmNodes.get(nodeId);
    return Boolean(node && haversineKm({ lat: node.lat, lng: node.lon }, { lat: config.centerLat, lng: config.centerLng }) <= config.radiusKm * 1.02);
  };
  const boundedWays = osmWays
    .map(way => ({ ...way, nodes: way.nodes.filter(isWithinRequestedArea) }))
    .filter(way => way.nodes.length >= 2);

  const candidateIds = new Set<number>();
  boundedWays.forEach(way => way.nodes.forEach(nodeId => candidateIds.add(nodeId)));
  if (candidateIds.size > config.maxNodes) {
    throw new OsmImportError(
      `The selected area contains ${candidateIds.size} road intersections, which exceeds this scenario's ${config.maxNodes}-node limit. Select a smaller neighborhood or increase the graph limit deliberately.`,
      "OVERSIZED_NETWORK",
    );
  }
  const selectedNodeIds = Array.from(candidateIds)
    .map(nodeId => osmNodes.get(nodeId))
    .filter((node): node is Extract<OverpassElement, { type: "node" }> => Boolean(node))
    .sort(
      (left, right) =>
        haversineKm({ lat: left.lat, lng: left.lon }, { lat: config.centerLat, lng: config.centerLng }) -
        haversineKm({ lat: right.lat, lng: right.lon }, { lat: config.centerLat, lng: config.centerLng }),
    )
    .slice(0, config.maxNodes);
  const selectedIds = new Set(selectedNodeIds.map(node => node.id));
  const rawEdges: Array<{ sourceId: number; targetId: number; way: Extract<OverpassElement, { type: "way" }> }> = [];
  const uniqueEdges = new Set<string>();
  boundedWays.forEach(way => {
    for (let index = 0; index < way.nodes.length - 1; index += 1) {
      const sourceId = way.nodes[index]!;
      const targetId = way.nodes[index + 1]!;
      if (!selectedIds.has(sourceId) || !selectedIds.has(targetId) || sourceId === targetId) continue;
      const edgeKey = [Math.min(sourceId, targetId), Math.max(sourceId, targetId), way.id].join(":");
      if (uniqueEdges.has(edgeKey)) continue;
      uniqueEdges.add(edgeKey);
      rawEdges.push({ sourceId, targetId, way });
    }
  });
  if (selectedNodeIds.length < 8 || rawEdges.length < 7) {
    throw new OsmImportError(
      "The selected area did not return a sufficiently connected road network. Try a nearby or slightly larger neighborhood.",
      "EMPTY_NETWORK",
    );
  }

  const degreeById = new Map<number, number>();
  rawEdges.forEach(edge => {
    degreeById.set(edge.sourceId, (degreeById.get(edge.sourceId) ?? 0) + 1);
    degreeById.set(edge.targetId, (degreeById.get(edge.targetId) ?? 0) + 1);
  });
  const connectedNodeIds = new Set<number>();
  rawEdges.forEach(edge => {
    connectedNodeIds.add(edge.sourceId);
    connectedNodeIds.add(edge.targetId);
  });
  const connectedNodes = selectedNodeIds.filter(node => connectedNodeIds.has(node.id));
  const minLat = Math.min(...connectedNodes.map(node => node.lat));
  const maxLat = Math.max(...connectedNodes.map(node => node.lat));
  const minLng = Math.min(...connectedNodes.map(node => node.lon));
  const maxLng = Math.max(...connectedNodes.map(node => node.lon));
  const latitudeRange = Math.max(maxLat - minLat, 0.00001);
  const longitudeRange = Math.max(maxLng - minLng, 0.00001);
  const nodes: CityNode[] = connectedNodes.map(node => {
    const degree = degreeById.get(node.id) ?? 0;
    return {
      id: `osm-node-${node.id}`,
      label: `Street junction ${node.id}`,
      position: {
        x: ((node.lon - minLng) / longitudeRange) * 1000,
        y: (1 - (node.lat - minLat) / latitudeRange) * 1000,
        lat: node.lat,
        lng: node.lon,
      },
      facilityType: "intersection",
      // OSM roads do not provide occupancy at junctions. This is an explicit, configurable simulation proxy, not census data.
      population: 45 + degree * 28,
      openStreetMapId: node.id,
      metadata: { modeledPopulationProxy: true, roadDegree: degree },
    };
  });
  const edges: CityEdge[] = rawEdges.map((edge, index) => {
    const source = osmNodes.get(edge.sourceId)!;
    const target = osmNodes.get(edge.targetId)!;
    const attributes = roadAttributes(edge.way.tags?.highway);
    return {
      id: `osm-edge-${edge.way.id}-${index + 1}`,
      source: `osm-node-${edge.sourceId}`,
      target: `osm-node-${edge.targetId}`,
      label: edge.way.tags?.name ?? edge.way.tags?.highway ?? `OSM way ${edge.way.id}`,
      distanceKm: Math.max(0.01, haversineKm({ lat: source.lat, lng: source.lon }, { lat: target.lat, lng: target.lon })),
      transmissionProbability: attributes.transmissionProbability,
      capacity: attributes.capacity,
      roadClass: roadClass(edge.way.tags?.highway),
      openStreetMapWayId: edge.way.id,
      metadata: { highway: edge.way.tags?.highway ?? "unknown", oneway: edge.way.tags?.oneway === "yes" },
    };
  });
  return {
    id: `osm-${cacheKey(config)}`,
    name: `${config.placeName} road network`,
    source: "openstreetmap",
    nodes,
    edges,
    createdAt: Date.now(),
    bounds: { north: maxLat, south: minLat, east: maxLng, west: minLng },
    attribution: "© OpenStreetMap contributors. Road geometry is real; modeled location populations and epidemiological parameters are synthetic scenario inputs.",
  };
}

export async function importOpenStreetMapRoadNetwork(inputConfig: OpenStreetMapImportConfig): Promise<CityGraph> {
  const config = normaliseConfig(inputConfig);
  const key = cacheKey(config);
  const cached = graphCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.graph;
  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), 28_000);
  try {
    let payload: OverpassResponse;
    try {
      payload = await fetchOverpassPayload(buildOverpassQuery(config), fetch, OVERPASS_ENDPOINTS, abortController.signal);
    } catch {
      payload = await fetchOsmMapPayload(config, fetch, abortController.signal);
    }
    const graph = normalizeOverpassNetwork(payload, config);
    graphCache.set(key, { graph, expiresAt: Date.now() + CACHE_TTL_MS });
    return graph;
  } catch (error) {
    if (error instanceof OsmImportError) throw error;
    throw new OsmImportError(
      "The road-network import timed out. Select a smaller neighborhood and try again.",
      "UPSTREAM_UNAVAILABLE",
    );
  } finally {
    clearTimeout(timeout);
  }
}
