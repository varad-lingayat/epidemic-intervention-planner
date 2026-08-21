import { describe, expect, it } from "vitest";
import { fetchOverpassPayload, normalizeOverpassNetwork, OsmImportError, parseOsmMapXml } from "./osmImport";
import { runFairStrategyComparison } from "../shared/interventions";

const payload = {
  elements: [
    { type: "node" as const, id: 1, lat: 19.073, lon: 72.88 },
    { type: "node" as const, id: 2, lat: 19.0732, lon: 72.8803 },
    { type: "node" as const, id: 3, lat: 19.0734, lon: 72.8806 },
    { type: "node" as const, id: 4, lat: 19.0736, lon: 72.8809 },
    { type: "node" as const, id: 5, lat: 19.0738, lon: 72.8812 },
    { type: "node" as const, id: 6, lat: 19.074, lon: 72.8815 },
    { type: "node" as const, id: 7, lat: 19.0742, lon: 72.8818 },
    { type: "node" as const, id: 8, lat: 19.0744, lon: 72.8821 },
    { type: "node" as const, id: 9, lat: 19.0746, lon: 72.8824 },
    { type: "way" as const, id: 100, nodes: [1, 2, 3, 4, 5], tags: { highway: "primary", name: "Sample Avenue" } },
    { type: "way" as const, id: 101, nodes: [5, 6, 7, 8, 9], tags: { highway: "residential" } },
    { type: "way" as const, id: 102, nodes: [2, 5, 8], tags: { highway: "secondary" } },
  ],
};

describe("OpenStreetMap road-network normalization", () => {
  it("parses a bounded official OSM map-data XML response into the common node and way contract", () => {
    const parsed = parseOsmMapXml(`<?xml version="1.0"?><osm><node id="1" lat="51.5" lon="-0.1"/><node id="2" lat="51.5001" lon="-0.1001"/><way id="41"><nd ref="1"/><nd ref="2"/><tag k="highway" v="residential"/><tag k="name" v="Example &amp; Road"/></way></osm>`);
    expect(parsed.elements).toEqual([
      { type: "node", id: 1, lat: 51.5, lon: -0.1 },
      { type: "node", id: 2, lat: 51.5001, lon: -0.1001 },
      { type: "way", id: 41, nodes: [1, 2], tags: { highway: "residential", name: "Example & Road" } },
    ]);
  });

  it("falls back to a second public Overpass endpoint after a temporary primary failure", async () => {
    const calls: string[] = [];
    const fetchMock = async (input: RequestInfo | URL) => {
      calls.push(String(input));
      if (calls.length === 1) return new Response("busy", { status: 429 });
      return new Response(JSON.stringify({ elements: [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    };

    await expect(fetchOverpassPayload("[out:json];", fetchMock as typeof fetch, ["https://primary.example/api", "https://secondary.example/api"])).resolves.toEqual({ elements: [] });
    expect(calls).toEqual(["https://primary.example/api", "https://secondary.example/api"]);
  });

  it("converts bounded OSM ways into a graph with real geometry and explicit model proxies", () => {
    const graph = normalizeOverpassNetwork(payload, {
      placeName: "Sample district",
      centerLat: 19.074,
      centerLng: 72.881,
      radiusKm: 0.5,
      maxNodes: 20,
      includeFootways: false,
    });

    expect(graph.source).toBe("openstreetmap");
    expect(graph.nodes).toHaveLength(9);
    expect(graph.edges.length).toBeGreaterThanOrEqual(8);
    expect(graph.nodes.every(node => node.facilityType === "intersection" && node.population > 0)).toBe(true);
    expect(graph.nodes.every(node => node.position.lat !== undefined && node.position.lng !== undefined)).toBe(true);
    expect(graph.edges.some(edge => edge.roadClass === "primary" && edge.openStreetMapWayId === 100)).toBe(true);
    expect(graph.attribution).toContain("OpenStreetMap");
  });

  it("clips full way geometry outside the requested neighborhood before enforcing the graph-size cap", () => {
    const boundedNodeCount = 9;
    const distantNodeCount = 300;
    const boundedPayload = {
      elements: [
        ...Array.from({ length: boundedNodeCount }, (_, index) => ({ type: "node" as const, id: index + 1, lat: 19.074 + index * 0.0001, lon: 72.881 + index * 0.0001 })),
        ...Array.from({ length: distantNodeCount }, (_, index) => ({ type: "node" as const, id: boundedNodeCount + index + 1, lat: 19.2 + index * 0.0001, lon: 73.1 })),
        { type: "way" as const, id: 810, nodes: Array.from({ length: boundedNodeCount + distantNodeCount }, (_, index) => index + 1), tags: { highway: "residential" } },
      ],
    };

    const graph = normalizeOverpassNetwork(boundedPayload, {
      placeName: "Bounded geometry",
      centerLat: 19.074,
      centerLng: 72.881,
      radiusKm: 0.2,
      maxNodes: 20,
      includeFootways: false,
    });

    expect(graph.nodes).toHaveLength(boundedNodeCount);
    expect(graph.edges).toHaveLength(boundedNodeCount - 1);
  });

  it("uses the normalized real-city graph in the same five-strategy comparison engine", () => {
    const graph = normalizeOverpassNetwork(payload, {
      placeName: "Sample district",
      centerLat: 19.074,
      centerLng: 72.881,
      radiusKm: 0.5,
      maxNodes: 20,
      includeFootways: false,
    });
    const comparison = runFairStrategyComparison({
      id: "osm-comparison",
      title: "OSM comparison",
      graph,
      parameters: {
        transmissionRate: 0.36,
        recoveryRate: 0.08,
        mortalityRate: 0.01,
        days: 8,
        initialInfectedNodeIds: ["osm-node-1"],
        simulationSeed: 99,
      },
      budget: { maxRoadClosures: 2, maxQuarantinedNodes: 1, maxQuarantinedPopulation: 200 },
    });

    expect(comparison.outcomes).toHaveLength(5);
    expect(comparison.fairness.graphId).toMatch(/^osm-/);
    expect(comparison.fairness.graphFingerprint).not.toHaveLength(0);
  });

  it("reports an actionable error rather than silently truncating an oversized road network", () => {
    const oversizedPayload = {
      elements: [
        ...Array.from({ length: 21 }, (_, index) => ({
          type: "node" as const,
          id: index + 1,
          lat: 19.07 + index * 0.0001,
          lon: 72.88 + index * 0.0001,
        })),
        {
          type: "way" as const,
          id: 300,
          nodes: Array.from({ length: 21 }, (_, index) => index + 1),
          tags: { highway: "residential" },
        },
      ],
    };

    try {
      normalizeOverpassNetwork(oversizedPayload, {
        placeName: "Oversized district",
        centerLat: 19.071,
        centerLng: 72.881,
        radiusKm: 0.5,
        maxNodes: 20,
        includeFootways: false,
      });
      throw new Error("Expected an oversized-network error");
    } catch (error) {
      expect(error).toBeInstanceOf(OsmImportError);
      expect((error as OsmImportError).code).toBe("OVERSIZED_NETWORK");
      expect((error as Error).message).toContain("smaller neighborhood");
    }
  });
});
