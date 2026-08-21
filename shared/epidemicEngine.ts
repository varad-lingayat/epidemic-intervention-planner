import type {
  CityEdge,
  CityGraph,
  CityNode,
  EpidemicParameters,
  EpidemicState,
  NodeEpidemicSnapshot,
  NodePopulationCounts,
  PopulationMetrics,
  SimulationSnapshot,
  SyntheticCityConfig,
} from "./epidemic";

export type SimulationModifiers = {
  closedEdgeIds?: Iterable<string>;
  quarantinedNodeIds?: Iterable<string>;
};

const DEFAULT_CITY_CONFIG: SyntheticCityConfig = {
  name: "Asterhaven",
  seed: 20260820,
  districtCount: 4,
  blocksPerDistrict: 4,
  homesPerBlock: 4,
  schoolCount: 3,
  hospitalCount: 2,
  officeCount: 4,
  roadDensity: 0.32,
  minTransmissionProbability: 0.012,
  maxTransmissionProbability: 0.054,
};

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.max(minimum, Math.min(maximum, value));

const pointDistance = (a: CityNode["position"], b: CityNode["position"]) =>
  Math.hypot(a.x - b.x, a.y - b.y);

function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function keyedUnitRandom(seed: number, key: string, index: number) {
  const input = `${seed}|${key}|${index}`;
  let hash = 2166136261;
  for (let character = 0; character < input.length; character += 1) {
    hash ^= input.charCodeAt(character);
    hash = Math.imul(hash, 16777619);
  }
  hash += hash << 13;
  hash ^= hash >>> 7;
  hash += hash << 3;
  hash ^= hash >>> 17;
  hash += hash << 5;
  return (hash >>> 0) / 4294967296;
}

function sampleBinomial(count: number, probability: number, seed: number, key: string) {
  const boundedProbability = clamp(probability, 0, 1);
  let selected = 0;
  for (let index = 0; index < count; index += 1) {
    if (keyedUnitRandom(seed, key, index) < boundedProbability) selected += 1;
  }
  return selected;
}

function roadClassForDistance(distance: number): CityEdge["roadClass"] {
  if (distance > 28) return "primary";
  if (distance > 16) return "secondary";
  return "local";
}

function roadCapacity(roadClass: CityEdge["roadClass"]) {
  if (roadClass === "primary") return 1200;
  if (roadClass === "secondary") return 700;
  if (roadClass === "local") return 250;
  return 80;
}

function createRoad(
  id: string,
  source: CityNode,
  target: CityNode,
  random: () => number,
  config: Pick<SyntheticCityConfig, "minTransmissionProbability" | "maxTransmissionProbability">,
): CityEdge {
  const distance = pointDistance(source.position, target.position);
  const roadClass = roadClassForDistance(distance);
  return {
    id,
    source: source.id,
    target: target.id,
    label: `${source.label} — ${target.label}`,
    distanceKm: Math.max(0.12, Number((distance / 9.5).toFixed(2))),
    transmissionProbability: Number(
      (
        clamp(config.minTransmissionProbability, 0, 1) +
        random() *
          Math.max(
            0,
            clamp(config.maxTransmissionProbability, 0, 1) -
              clamp(config.minTransmissionProbability, 0, 1),
          )
      ).toFixed(3),
    ),
    capacity: roadCapacity(roadClass),
    roadClass,
  };
}

/**
 * Produces a small, connected, reproducible city graph. Facility populations are
 * deliberately synthetic so experiments can be repeated without implying real
 * demographic or epidemiological data.
 */
export function createSyntheticCityGraph(
  overrides: Partial<SyntheticCityConfig> = {},
): CityGraph {
  const config = { ...DEFAULT_CITY_CONFIG, ...overrides };
  const random = seededRandom(config.seed);
  const nodes: CityNode[] = [];
  const edges: CityEdge[] = [];
  const edgeKeys = new Set<string>();
  const districtHubs: CityNode[] = [];
  const intersections: CityNode[] = [];
  const columns = Math.ceil(Math.sqrt(config.districtCount));

  const addNode = (node: CityNode) => {
    nodes.push(node);
    return node;
  };

  const addRoad = (source: CityNode, target: CityNode) => {
    if (source.id === target.id) return;
    const key = [source.id, target.id].sort().join("::");
    if (edgeKeys.has(key)) return;
    edgeKeys.add(key);
    edges.push(createRoad(`road-${edges.length + 1}`, source, target, random, config));
  };

  for (let districtIndex = 0; districtIndex < config.districtCount; districtIndex += 1) {
    const column = districtIndex % columns;
    const row = Math.floor(districtIndex / columns);
    const districtId = `district-${districtIndex + 1}`;
    const centerX = 24 + column * 72;
    const centerY = 24 + row * 72;
    const hub = addNode({
      id: `${districtId}-hub`,
      label: `District ${districtIndex + 1} Hub`,
      position: { x: centerX, y: centerY },
      facilityType: "transit",
      population: 0,
      districtId,
      metadata: { role: "district_connector" },
    });
    districtHubs.push(hub);

    for (let blockIndex = 0; blockIndex < config.blocksPerDistrict; blockIndex += 1) {
      const angle = (Math.PI * 2 * blockIndex) / config.blocksPerDistrict;
      const blockId = `${districtId}-block-${blockIndex + 1}`;
      const blockCenter = {
        x: centerX + Math.cos(angle) * 23,
        y: centerY + Math.sin(angle) * 23,
      };
      const intersection = addNode({
        id: `${blockId}-intersection`,
        label: `Block ${districtIndex + 1}.${blockIndex + 1} Junction`,
        position: blockCenter,
        facilityType: "intersection",
        population: 0,
        blockId,
        districtId,
      });
      intersections.push(intersection);
      addRoad(hub, intersection);

      for (let homeIndex = 0; homeIndex < config.homesPerBlock; homeIndex += 1) {
        const homeAngle = (Math.PI * 2 * homeIndex) / config.homesPerBlock + random() * 0.22;
        const home = addNode({
          id: `${blockId}-home-${homeIndex + 1}`,
          label: `Residence ${districtIndex + 1}.${blockIndex + 1}.${homeIndex + 1}`,
          position: {
            x: blockCenter.x + Math.cos(homeAngle) * (5 + random() * 5),
            y: blockCenter.y + Math.sin(homeAngle) * (5 + random() * 5),
          },
          facilityType: "home",
          population: 70 + Math.floor(random() * 150),
          blockId,
          districtId,
        });
        addRoad(intersection, home);
      }
    }
  }

  districtHubs.forEach((hub, index) => {
    const next = districtHubs[(index + 1) % districtHubs.length];
    if (next) addRoad(hub, next);
  });

  intersections.forEach((intersection, index) => {
    const next = intersections[(index + 1) % intersections.length];
    if (next) addRoad(intersection, next);
  });

  const nearestIntersections = (position: CityNode["position"], count: number) =>
    [...intersections]
      .sort((left, right) => pointDistance(left.position, position) - pointDistance(right.position, position))
      .slice(0, count);

  const addFacility = (
    facilityType: "school" | "hospital" | "office",
    index: number,
    population: number,
  ) => {
    const districtIndex = Math.floor(random() * config.districtCount);
    const hub = districtHubs[districtIndex] ?? districtHubs[0];
    const facility = addNode({
      id: `${facilityType}-${index + 1}`,
      label: `${facilityType.charAt(0).toUpperCase()}${facilityType.slice(1)} ${index + 1}`,
      position: {
        x: hub.position.x + (random() - 0.5) * 34,
        y: hub.position.y + (random() - 0.5) * 34,
      },
      facilityType,
      population: Math.round(population * (0.8 + random() * 0.4)),
      districtId: hub.districtId,
    });
    nearestIntersections(facility.position, 2).forEach(intersection => addRoad(facility, intersection));
  };

  for (let index = 0; index < config.schoolCount; index += 1) addFacility("school", index, 520);
  for (let index = 0; index < config.hospitalCount; index += 1) addFacility("hospital", index, 260);
  for (let index = 0; index < config.officeCount; index += 1) addFacility("office", index, 410);

  const extraRoads = Math.round(intersections.length * clamp(config.roadDensity, 0, 1));
  for (let index = 0; index < extraRoads; index += 1) {
    const source = intersections[Math.floor(random() * intersections.length)];
    const target = intersections[Math.floor(random() * intersections.length)];
    if (source && target) addRoad(source, target);
  }

  return {
    id: `synthetic-${config.seed}-${config.districtCount}-${config.blocksPerDistrict}`,
    name: config.name,
    source: "synthetic",
    nodes,
    edges,
    createdAt: config.seed,
    attribution: "Synthetic graph generated for repeatable academic simulation.",
  };
}

function initialCounts(node: CityNode, initialInfected: Set<string>): NodePopulationCounts {
  const initialCases = initialInfected.has(node.id) ? Math.min(12, node.population) : 0;
  return {
    susceptible: Math.max(0, node.population - initialCases),
    infected: initialCases,
    recovered: 0,
    deceased: 0,
  };
}

function stateForCounts(counts: NodePopulationCounts, quarantined: boolean): EpidemicState {
  if (quarantined) return "quarantined";
  if (counts.infected > 0) return "infected";
  if (counts.deceased > 0 && counts.susceptible === 0 && counts.recovered === 0) return "deceased";
  if (counts.recovered > 0 && counts.susceptible === 0) return "recovered";
  return "susceptible";
}

export function summarizePopulation(
  nodeStates: Record<string, NodeEpidemicSnapshot>,
  graph: CityGraph,
  quarantinedNodeIds: Set<string>,
): PopulationMetrics {
  const metrics: PopulationMetrics = {
    susceptible: 0,
    infected: 0,
    recovered: 0,
    deceased: 0,
    quarantined: 0,
    cumulativeInfected: 0,
  };

  graph.nodes.forEach(node => {
    const counts = nodeStates[node.id]?.counts;
    if (!counts) return;
    metrics.susceptible += counts.susceptible;
    metrics.infected += counts.infected;
    metrics.recovered += counts.recovered;
    metrics.deceased += counts.deceased;
    metrics.cumulativeInfected += node.population - counts.susceptible;
    if (quarantinedNodeIds.has(node.id)) metrics.quarantined += node.population;
  });

  return metrics;
}

/**
 * Runs a discrete-time network SIR simulation. A keyed pseudo-random stream is
 * used instead of a sequential one, which ensures a given node/day/event uses
 * the same random trials in every strategy comparison.
 */
export function runDiscreteTimeSIR(
  graph: CityGraph,
  parameters: EpidemicParameters,
  modifiers: SimulationModifiers = {},
): SimulationSnapshot[] {
  const closedEdgeIds = new Set(modifiers.closedEdgeIds ?? []);
  const quarantinedNodeIds = new Set(modifiers.quarantinedNodeIds ?? []);
  const initialInfected = new Set(parameters.initialInfectedNodeIds);
  if (initialInfected.size === 0) {
    const fallback = [...graph.nodes].sort((a, b) => b.population - a.population)[0];
    if (fallback) initialInfected.add(fallback.id);
  }

  let nodeStates = Object.fromEntries(
    graph.nodes.map(node => {
      const counts = initialCounts(node, initialInfected);
      return [
        node.id,
        {
          state: stateForCounts(counts, quarantinedNodeIds.has(node.id)),
          infectionProbability: 0,
          hotspotScore: 0,
          counts,
        } satisfies NodeEpidemicSnapshot,
      ];
    }),
  ) as Record<string, NodeEpidemicSnapshot>;

  const timeline: SimulationSnapshot[] = [
    {
      day: 0,
      nodeStates,
      metrics: summarizePopulation(nodeStates, graph, quarantinedNodeIds),
    },
  ];

  for (let day = 1; day <= parameters.days; day += 1) {
    const infectionProbabilities: Record<string, number> = Object.fromEntries(
      graph.nodes.map(node => [node.id, 0]),
    );

    const populationByNodeId = new Map(graph.nodes.map(node => [node.id, node.population]));
    const activeEdges = graph.edges.filter(
      edge =>
        !closedEdgeIds.has(edge.id) &&
        !quarantinedNodeIds.has(edge.source) &&
        !quarantinedNodeIds.has(edge.target),
    );
    const adjacentEdges = new Map<string, typeof activeEdges>();
    activeEdges.forEach(edge => {
      adjacentEdges.set(edge.source, [...(adjacentEdges.get(edge.source) ?? []), edge]);
      adjacentEdges.set(edge.target, [...(adjacentEdges.get(edge.target) ?? []), edge]);
    });

    graph.nodes.forEach(sourceNode => {
      const sourcePopulation = populationByNodeId.get(sourceNode.id) ?? 0;
      const sourceState = nodeStates[sourceNode.id];
      if (
        sourcePopulation === 0 ||
        !sourceState ||
        sourceState.counts.infected === 0 ||
        quarantinedNodeIds.has(sourceNode.id)
      ) {
        return;
      }

      const infectiousPeople = sourceState.counts.infected;
      const connectorProbabilities = new Map<string, number>();
      const queue: Array<{ nodeId: string; probability: number }> = [{ nodeId: sourceNode.id, probability: 1 }];

      // Road junctions are zero-population movement connectors. This best-path
      // traversal preserves city-road connectivity without enumerating every
      // possible junction cycle or treating junctions as SIR populations.
      while (queue.length > 0) {
        const current = queue.shift();
        if (!current) break;
        (adjacentEdges.get(current.nodeId) ?? []).forEach(edge => {
          const nextNodeId = edge.source === current.nodeId ? edge.target : edge.source;
          if (quarantinedNodeIds.has(nextNodeId)) return;
          const perContactProbability = clamp(
            edge.transmissionProbability * parameters.transmissionRate,
            0,
            0.95,
          );
          // The chance of at least one transmission opportunity across this
          // road during the day. Each infectious resident contributes an
          // independent simplified exposure opportunity; this is a transparent
          // scenario assumption rather than a clinical forecasting model.
          const edgeProbability = 1 - (1 - perContactProbability) ** infectiousPeople;
          // A movement path crosses its road segments in sequence, so its
          // exposure likelihood is the product of its segment likelihoods.
          const pathProbability = current.probability * edgeProbability;
          const nextPopulation = populationByNodeId.get(nextNodeId) ?? 0;

          if (nextPopulation > 0) {
            if (nextNodeId !== sourceNode.id) {
              infectionProbabilities[nextNodeId] =
                1 - (1 - infectionProbabilities[nextNodeId]) * (1 - pathProbability);
            }
            return;
          }

          const currentBest = connectorProbabilities.get(nextNodeId) ?? 0;
          if (pathProbability > currentBest) {
            connectorProbabilities.set(nextNodeId, pathProbability);
            queue.push({ nodeId: nextNodeId, probability: pathProbability });
          }
        });
      }
    });

    const nextNodeStates: Record<string, NodeEpidemicSnapshot> = {};
    graph.nodes.forEach(node => {
      const previous = nodeStates[node.id];
      const infectionProbability = quarantinedNodeIds.has(node.id)
        ? 0
        : infectionProbabilities[node.id] ?? 0;
      const recoveries = sampleBinomial(
        previous.counts.infected,
        parameters.recoveryRate,
        parameters.simulationSeed,
        `recovery:${node.id}:day:${day}`,
      );
      const remainingInfected = previous.counts.infected - recoveries;
      const deaths = sampleBinomial(
        remainingInfected,
        parameters.mortalityRate,
        parameters.simulationSeed,
        `mortality:${node.id}:day:${day}`,
      );
      const newInfections = sampleBinomial(
        previous.counts.susceptible,
        infectionProbability,
        parameters.simulationSeed,
        `infection:${node.id}:day:${day}`,
      );
      const counts: NodePopulationCounts = {
        susceptible: previous.counts.susceptible - newInfections,
        infected: remainingInfected - deaths + newInfections,
        recovered: previous.counts.recovered + recoveries,
        deceased: previous.counts.deceased + deaths,
      };
      nextNodeStates[node.id] = {
        state: stateForCounts(counts, quarantinedNodeIds.has(node.id)),
        infectionProbability,
        hotspotScore: infectionProbability,
        counts,
      };
    });

    nodeStates = nextNodeStates;
    timeline.push({
      day,
      nodeStates,
      metrics: summarizePopulation(nodeStates, graph, quarantinedNodeIds),
    });
  }

  return timeline;
}

export function graphFingerprint(graph: CityGraph) {
  const signature = `${graph.nodes.map(node => node.id).sort().join(",")}|${graph.edges
    .map(edge => edge.id)
    .sort()
    .join(",")}`;
  let hash = 0;
  for (let index = 0; index < signature.length; index += 1) {
    hash = (hash << 5) - hash + signature.charCodeAt(index);
    hash |= 0;
  }
  return `g${Math.abs(hash).toString(36)}`;
}
