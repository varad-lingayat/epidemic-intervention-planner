import { describe, expect, it } from "vitest";
import type { CityGraph } from "../shared/epidemic";
import { createSyntheticCityGraph, runDiscreteTimeSIR } from "../shared/epidemicEngine";

const parameters = {
  transmissionRate: 0.42,
  recoveryRate: 0.08,
  mortalityRate: 0.01,
  days: 12,
  initialInfectedNodeIds: ["district-1-block-1-home-1"],
  simulationSeed: 715,
};

describe("synthetic city graph", () => {
  it("generates the same graph for the same seed", () => {
    const first = createSyntheticCityGraph({ seed: 42, districtCount: 3 });
    const second = createSyntheticCityGraph({ seed: 42, districtCount: 3 });

    expect(first.nodes).toEqual(second.nodes);
    expect(first.edges).toEqual(second.edges);
    expect(first.nodes.some(node => node.facilityType === "hospital")).toBe(true);
    expect(first.edges.length).toBeGreaterThan(first.nodes.length - 1);
  });

  it("honors the configured transmission-probability range", () => {
    const graph = createSyntheticCityGraph({
      seed: 93,
      minTransmissionProbability: 0.071,
      maxTransmissionProbability: 0.071,
    });

    expect(graph.edges).not.toHaveLength(0);
    expect(graph.edges.every(edge => edge.transmissionProbability === 0.071)).toBe(true);
  });
});

describe("discrete-time network SIR simulation", () => {
  it("is deterministic when graph, parameters, and modifiers are identical", () => {
    const graph = createSyntheticCityGraph({ seed: 81 });
    const first = runDiscreteTimeSIR(graph, parameters);
    const second = runDiscreteTimeSIR(graph, parameters);

    expect(first).toEqual(second);
    expect(first).toHaveLength(parameters.days + 1);
  });

  it("preserves population across every simulated day", () => {
    const graph = createSyntheticCityGraph({ seed: 91 });
    const totalPopulation = graph.nodes.reduce((sum, node) => sum + node.population, 0);
    const timeline = runDiscreteTimeSIR(graph, parameters);

    timeline.forEach(snapshot => {
      const { susceptible, infected, recovered, deceased } = snapshot.metrics;
      expect(susceptible + infected + recovered + deceased).toBe(totalPopulation);
    });
  });

  it("keeps a quarantined initial outbreak from infecting neighboring locations", () => {
    const graph = createSyntheticCityGraph({ seed: 107 });
    const uncontained = runDiscreteTimeSIR(graph, parameters);
    const contained = runDiscreteTimeSIR(graph, parameters, {
      quarantinedNodeIds: parameters.initialInfectedNodeIds,
    });

    const uncontainedFinal = uncontained.at(-1)?.metrics.cumulativeInfected ?? 0;
    const containedFinal = contained.at(-1)?.metrics.cumulativeInfected ?? 0;
    expect(containedFinal).toBeLessThanOrEqual(uncontainedFinal);
  });

  it("transmits across zero-population road intersections and responds to a closed connector road", () => {
    const connectorGraph: CityGraph = {
      id: "connector-regression",
      name: "Connector regression graph",
      source: "synthetic",
      createdAt: 1,
      attribution: "Test graph",
      nodes: [
        { id: "source", label: "Source residence", position: { x: 0, y: 0 }, facilityType: "home", population: 1 },
        { id: "junction", label: "Road junction", position: { x: 10, y: 0 }, facilityType: "intersection", population: 0 },
        { id: "target", label: "Target residence", position: { x: 20, y: 0 }, facilityType: "home", population: 100 },
      ],
      edges: [
        { id: "source-junction", source: "source", target: "junction", label: "Source to junction", distanceKm: 1, transmissionProbability: 1, capacity: 100, roadClass: "local" },
        { id: "junction-target", source: "junction", target: "target", label: "Junction to target", distanceKm: 1, transmissionProbability: 1, capacity: 100, roadClass: "local" },
      ],
    };
    const connectorParameters = {
      transmissionRate: 1,
      recoveryRate: 0,
      mortalityRate: 0,
      days: 1,
      initialInfectedNodeIds: ["source"],
      simulationSeed: 8,
    };

    const openNetwork = runDiscreteTimeSIR(connectorGraph, connectorParameters);
    const blockedNetwork = runDiscreteTimeSIR(connectorGraph, connectorParameters, {
      closedEdgeIds: ["junction-target"],
    });

    expect(openNetwork.at(-1)?.nodeStates.target?.counts.infected).toBeGreaterThan(0);
    expect(blockedNetwork.at(-1)?.nodeStates.target?.counts.infected).toBe(0);
  });
});
