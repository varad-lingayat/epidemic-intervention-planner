import type {
  ActionableRecommendation,
  BayesianHotspotScore,
  BudgetUse,
  CityEdge,
  CityGraph,
  CityNode,
  EpidemicParameters,
  FairComparisonMetadata,
  InterventionAction,
  InterventionBudget,
  NodeEpidemicSnapshot,
  ScenarioComparison,
  StrategyName,
  StrategyOutcome,
  SymptomEvidence,
} from "./epidemic";
import { graphFingerprint, runDiscreteTimeSIR } from "./epidemicEngine";

type InterventionPlan = {
  strategy: StrategyName;
  actions: InterventionAction[];
  budgetUse: BudgetUse;
  rationale: string;
};

type StrategyPlanningInput = {
  graph: CityGraph;
  parameters: EpidemicParameters;
  budget: InterventionBudget;
};

const strategyOrder: StrategyName[] = [
  "random",
  "highest_degree",
  "betweenness_centrality",
  "dijkstra_blocking",
  "max_flow_min_cut",
];

const clamp = (value: number, lower: number, upper: number) => Math.max(lower, Math.min(upper, value));

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

function shuffle<T>(values: T[], random: () => number) {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex]!, copy[index]!];
  }
  return copy;
}

function byId<T extends { id: string }>(values: T[]) {
  return new Map(values.map(value => [value.id, value]));
}

function adjacency(graph: CityGraph) {
  const map = new Map<string, Array<{ nodeId: string; edge: CityEdge }>>();
  graph.nodes.forEach(node => map.set(node.id, []));
  graph.edges.forEach(edge => {
    map.get(edge.source)?.push({ nodeId: edge.target, edge });
    map.get(edge.target)?.push({ nodeId: edge.source, edge });
  });
  return map;
}

function selectNodeActions(
  graph: CityGraph,
  orderedNodeIds: string[],
  budget: InterventionBudget,
  reason: (node: CityNode) => string,
) {
  const nodeMap = byId(graph.nodes);
  const actions: InterventionAction[] = [];
  let population = 0;
  for (const nodeId of orderedNodeIds) {
    if (actions.length >= budget.maxQuarantinedNodes) break;
    const node = nodeMap.get(nodeId);
    if (!node || node.population <= 0) continue;
    if (population + node.population > budget.maxQuarantinedPopulation) continue;
    population += node.population;
    actions.push({ kind: "quarantine_node", nodeId, reason: reason(node) });
  }
  return actions;
}

function selectEdgeActions(
  graph: CityGraph,
  orderedEdgeIds: string[],
  budget: InterventionBudget,
  reason: (edge: CityEdge) => string,
) {
  const edgeMap = byId(graph.edges);
  const actions: InterventionAction[] = [];
  for (const edgeId of orderedEdgeIds) {
    if (actions.length >= budget.maxRoadClosures) break;
    const edge = edgeMap.get(edgeId);
    if (!edge) continue;
    actions.push({ kind: "close_road", edgeId, reason: reason(edge) });
  }
  return actions;
}

function budgetUse(graph: CityGraph, actions: InterventionAction[]): BudgetUse {
  const nodeMap = byId(graph.nodes);
  const quarantinedNodeIds = new Set(
    actions.flatMap(action =>
      action.kind === "quarantine_node" ? [action.nodeId] : action.kind === "isolate_block" ? action.nodeIds : [],
    ),
  );
  return {
    closedRoads: actions.filter(action => action.kind === "close_road").length,
    quarantinedNodes: quarantinedNodeIds.size,
    quarantinedPopulation: Array.from(quarantinedNodeIds).reduce(
      (sum, nodeId) => sum + (nodeMap.get(nodeId)?.population ?? 0),
      0,
    ),
  };
}

function degreeScores(graph: CityGraph) {
  const scores = new Map(graph.nodes.map(node => [node.id, 0]));
  graph.edges.forEach(edge => {
    scores.set(edge.source, (scores.get(edge.source) ?? 0) + 1);
    scores.set(edge.target, (scores.get(edge.target) ?? 0) + 1);
  });
  return scores;
}

function edgeScoresFromNodeScores(graph: CityGraph, scores: Map<string, number>) {
  return [...graph.edges]
    .map(edge => ({ edge, score: (scores.get(edge.source) ?? 0) + (scores.get(edge.target) ?? 0) }))
    .sort((left, right) => right.score - left.score)
    .map(item => item.edge.id);
}

/**
 * Updates location-level risk with a simple, inspectable Bayes rule. The prior
 * combines network exposure and the simulator's current probability. Symptom
 * evidence then supplies stated positive and false-positive likelihoods.
 */
export function scoreBayesianHotspots(
  graph: CityGraph,
  nodeStates: Record<string, NodeEpidemicSnapshot>,
  evidence: SymptomEvidence[] = [],
): BayesianHotspotScore[] {
  const nodeMap = byId(graph.nodes);
  const evidenceByNode = new Map(evidence.map(item => [item.nodeId, item]));
  const neighbours = adjacency(graph);
  const scores = graph.nodes
    .filter(node => node.population > 0)
    .map(node => {
      const state = nodeStates[node.id];
      const neighbourExposure = (neighbours.get(node.id) ?? []).reduce((total, neighbour) => {
        const neighbouringNode = nodeMap.get(neighbour.nodeId);
        const neighbouringState = nodeStates[neighbour.nodeId];
        if (!neighbouringNode || !neighbouringState || neighbouringNode.population === 0) return total;
        return total + neighbour.edge.transmissionProbability * (neighbouringState.counts.infected / neighbouringNode.population);
      }, 0);
      const priorProbability = clamp(
        0.015 + (state?.infectionProbability ?? 0) * 0.55 + neighbourExposure * 0.65,
        0.001,
        0.97,
      );
      const symptomEvidence = evidenceByNode.get(node.id);
      const symptomRatio = symptomEvidence
        ? clamp(symptomEvidence.symptomaticPeople / Math.max(1, symptomEvidence.observedPopulation), 0, 1)
        : 0;
      const evidenceStrength = symptomEvidence ? clamp(symptomEvidence.evidenceStrength, 0, 1) : 0;
      const likelihood = clamp(0.18 + symptomRatio * 0.65 * evidenceStrength, 0.05, 0.96);
      const falsePositiveLikelihood = clamp(0.04 + symptomRatio * 0.12 * evidenceStrength, 0.01, 0.42);
      const numerator = likelihood * priorProbability;
      const posteriorProbability = numerator / (numerator + falsePositiveLikelihood * (1 - priorProbability));
      return {
        nodeId: node.id,
        priorProbability,
        likelihood,
        posteriorProbability: clamp(posteriorProbability, 0, 1),
        rank: 0,
        explanation: symptomEvidence
          ? `Posterior combines local symptom evidence (${symptomEvidence.symptomaticPeople}/${symptomEvidence.observedPopulation}) with modeled network exposure.`
          : "Posterior is based on modeled exposure from connected locations; no symptom evidence was supplied.",
      } satisfies BayesianHotspotScore;
    })
    .sort((left, right) => right.posteriorProbability - left.posteriorProbability);

  return scores.map((score, index) => ({ ...score, rank: index + 1 }));
}

/** Brandes' algorithm for unweighted node betweenness centrality. */
function betweennessScores(graph: CityGraph) {
  const neighbours = adjacency(graph);
  const scores = new Map(graph.nodes.map(node => [node.id, 0]));
  graph.nodes.forEach(source => {
    const stack: string[] = [];
    const predecessors = new Map(graph.nodes.map(node => [node.id, [] as string[]]));
    const paths = new Map(graph.nodes.map(node => [node.id, 0]));
    const distance = new Map(graph.nodes.map(node => [node.id, -1]));
    paths.set(source.id, 1);
    distance.set(source.id, 0);
    const queue = [source.id];

    while (queue.length > 0) {
      const current = queue.shift()!;
      stack.push(current);
      neighbours.get(current)?.forEach(({ nodeId }) => {
        if ((distance.get(nodeId) ?? -1) < 0) {
          queue.push(nodeId);
          distance.set(nodeId, (distance.get(current) ?? 0) + 1);
        }
        if ((distance.get(nodeId) ?? -1) === (distance.get(current) ?? 0) + 1) {
          paths.set(nodeId, (paths.get(nodeId) ?? 0) + (paths.get(current) ?? 0));
          predecessors.get(nodeId)?.push(current);
        }
      });
    }

    const dependency = new Map(graph.nodes.map(node => [node.id, 0]));
    while (stack.length > 0) {
      const current = stack.pop()!;
      predecessors.get(current)?.forEach(predecessor => {
        const pathCount = paths.get(current) ?? 1;
        const contribution =
          ((paths.get(predecessor) ?? 0) / pathCount) * (1 + (dependency.get(current) ?? 0));
        dependency.set(predecessor, (dependency.get(predecessor) ?? 0) + contribution);
      });
      if (current !== source.id) {
        scores.set(current, (scores.get(current) ?? 0) + (dependency.get(current) ?? 0));
      }
    }
  });
  graph.nodes.forEach(node => scores.set(node.id, (scores.get(node.id) ?? 0) / 2));
  return scores;
}

function dijkstraPath(graph: CityGraph, sourceId: string, targetId: string) {
  const neighbours = adjacency(graph);
  const distances = new Map(graph.nodes.map(node => [node.id, Number.POSITIVE_INFINITY]));
  const previous = new Map<string, { nodeId: string; edgeId: string }>();
  const unvisited = new Set(graph.nodes.map(node => node.id));
  distances.set(sourceId, 0);

  while (unvisited.size > 0) {
    let current: string | undefined;
    let lowest = Number.POSITIVE_INFINITY;
    unvisited.forEach(nodeId => {
      const candidate = distances.get(nodeId) ?? Number.POSITIVE_INFINITY;
      if (candidate < lowest) {
        lowest = candidate;
        current = nodeId;
      }
    });
    if (!current || current === targetId || lowest === Number.POSITIVE_INFINITY) break;
    unvisited.delete(current);
    neighbours.get(current)?.forEach(({ nodeId, edge }) => {
      if (!unvisited.has(nodeId)) return;
      const probability = clamp(edge.transmissionProbability, 0.0001, 0.9999);
      const weight = -Math.log(probability);
      const candidate = lowest + weight;
      if (candidate < (distances.get(nodeId) ?? Number.POSITIVE_INFINITY)) {
        distances.set(nodeId, candidate);
        previous.set(nodeId, { nodeId: current!, edgeId: edge.id });
      }
    });
  }

  const edgeIds: string[] = [];
  let current = targetId;
  while (current !== sourceId) {
    const step = previous.get(current);
    if (!step) return [];
    edgeIds.unshift(step.edgeId);
    current = step.nodeId;
  }
  return edgeIds;
}

function dijkstraCandidates(graph: CityGraph, infectedNodeIds: string[]) {
  const targets = [...graph.nodes]
    .filter(node => node.population > 0 && !infectedNodeIds.includes(node.id))
    .sort((left, right) => right.population - left.population)
    .slice(0, 5);
  const edgeCounts = new Map<string, number>();
  infectedNodeIds.forEach(sourceId => {
    targets.forEach(target => {
      dijkstraPath(graph, sourceId, target.id).forEach(edgeId => {
        edgeCounts.set(edgeId, (edgeCounts.get(edgeId) ?? 0) + 1);
      });
    });
  });
  const rankedEdges = Array.from(edgeCounts.entries())
    .sort((left, right) => right[1] - left[1])
    .map(([edgeId]) => edgeId);
  const edgeMap = byId(graph.edges);
  const nodeCounts = new Map<string, number>();
  rankedEdges.forEach(edgeId => {
    const edge = edgeMap.get(edgeId);
    if (!edge) return;
    nodeCounts.set(edge.source, (nodeCounts.get(edge.source) ?? 0) + 1);
    nodeCounts.set(edge.target, (nodeCounts.get(edge.target) ?? 0) + 1);
  });
  return {
    edgeIds: rankedEdges,
    nodeIds: Array.from(nodeCounts.entries())
      .sort((left, right) => right[1] - left[1])
      .map(([nodeId]) => nodeId),
  };
}

function maxFlowMinCutEdges(graph: CityGraph, sourceId: string, targetId: string) {
  const residual = new Map<string, Map<string, number>>();
  const ensure = (from: string, to: string, capacity: number) => {
    if (!residual.has(from)) residual.set(from, new Map());
    residual.get(from)!.set(to, (residual.get(from)?.get(to) ?? 0) + capacity);
  };
  graph.edges.forEach(edge => {
    ensure(edge.source, edge.target, edge.capacity);
    ensure(edge.target, edge.source, edge.capacity);
  });

  while (true) {
    const parent = new Map<string, string>();
    const queue = [sourceId];
    parent.set(sourceId, "");
    while (queue.length > 0 && !parent.has(targetId)) {
      const current = queue.shift()!;
      residual.get(current)?.forEach((capacity, next) => {
        if (capacity > 0 && !parent.has(next)) {
          parent.set(next, current);
          queue.push(next);
        }
      });
    }
    if (!parent.has(targetId)) break;
    let pathCapacity = Number.POSITIVE_INFINITY;
    for (let node = targetId; node !== sourceId; node = parent.get(node)!) {
      pathCapacity = Math.min(pathCapacity, residual.get(parent.get(node)!)?.get(node) ?? 0);
    }
    for (let node = targetId; node !== sourceId; node = parent.get(node)!) {
      const previous = parent.get(node)!;
      residual.get(previous)!.set(node, (residual.get(previous)?.get(node) ?? 0) - pathCapacity);
      ensure(node, previous, pathCapacity);
    }
  }

  const reachable = new Set<string>([sourceId]);
  const queue = [sourceId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    residual.get(current)?.forEach((capacity, next) => {
      if (capacity > 0 && !reachable.has(next)) {
        reachable.add(next);
        queue.push(next);
      }
    });
  }
  return graph.edges
    .filter(edge => reachable.has(edge.source) !== reachable.has(edge.target))
    .map(edge => edge.id);
}

function minCutCandidates(graph: CityGraph, infectedNodeIds: string[]) {
  const source = infectedNodeIds.find(nodeId => graph.nodes.some(node => node.id === nodeId));
  const target = [...graph.nodes]
    .filter(node => node.id !== source && node.population > 0)
    .sort((left, right) => {
      const hospitalPriority = Number(right.facilityType === "hospital") - Number(left.facilityType === "hospital");
      return hospitalPriority || right.population - left.population;
    })[0];
  if (!source || !target) return { edgeIds: [] as string[], nodeIds: [] as string[] };
  const edgeIds = maxFlowMinCutEdges(graph, source, target.id);
  const edgeMap = byId(graph.edges);
  const nodeIds = edgeIds.flatMap(edgeId => {
    const edge = edgeMap.get(edgeId);
    return edge ? [edge.source, edge.target] : [];
  });
  return { edgeIds, nodeIds: Array.from(new Set(nodeIds)) };
}

function planForStrategy(input: StrategyPlanningInput, strategy: StrategyName): InterventionPlan {
  const { graph, parameters, budget } = input;
  let nodeCandidates: string[] = [];
  let edgeCandidates: string[] = [];
  let rationale = "";
  if (strategy === "random") {
    const random = seededRandom(parameters.simulationSeed + 101);
    nodeCandidates = shuffle(
      graph.nodes.filter(node => node.population > 0).map(node => node.id),
      random,
    );
    edgeCandidates = shuffle(graph.edges.map(edge => edge.id), random);
    rationale = "Uses a seeded random baseline so the effect of informed strategies can be compared fairly.";
  }
  if (strategy === "highest_degree") {
    const scores = degreeScores(graph);
    nodeCandidates = [...graph.nodes]
      .sort((left, right) => (scores.get(right.id) ?? 0) - (scores.get(left.id) ?? 0))
      .map(node => node.id);
    edgeCandidates = edgeScoresFromNodeScores(graph, scores);
    rationale = "Prioritizes the most connected locations and roads, which can reduce the number of network contact opportunities.";
  }
  if (strategy === "betweenness_centrality") {
    const scores = betweennessScores(graph);
    nodeCandidates = [...graph.nodes]
      .sort((left, right) => (scores.get(right.id) ?? 0) - (scores.get(left.id) ?? 0))
      .map(node => node.id);
    edgeCandidates = edgeScoresFromNodeScores(graph, scores);
    rationale = "Prioritizes bridge-like locations that frequently sit between other locations on network paths.";
  }
  if (strategy === "dijkstra_blocking") {
    const candidates = dijkstraCandidates(graph, parameters.initialInfectedNodeIds);
    nodeCandidates = candidates.nodeIds;
    edgeCandidates = candidates.edgeIds;
    rationale = "Blocks roads and locations that recur on the most likely transmission paths from initial infections to major destinations.";
  }
  if (strategy === "max_flow_min_cut") {
    const candidates = minCutCandidates(graph, parameters.initialInfectedNodeIds);
    nodeCandidates = candidates.nodeIds;
    edgeCandidates = candidates.edgeIds;
    rationale = "Targets the minimum-capacity road cut separating the outbreak source from a high-priority destination.";
  }

  const actions = [
    ...selectNodeActions(graph, nodeCandidates, budget, node => `Selected by ${strategy.replaceAll("_", " ")} prioritization at ${node.label}.`),
    ...selectEdgeActions(graph, edgeCandidates, budget, edge => `Selected by ${strategy.replaceAll("_", " ")} prioritization on ${edge.label ?? edge.id}.`),
  ];
  return { strategy, actions, budgetUse: budgetUse(graph, actions), rationale };
}

function networkComponentCount(graph: CityGraph, actions: InterventionAction[]) {
  const removedNodes = new Set(actions.flatMap(action => (action.kind === "quarantine_node" ? [action.nodeId] : [])));
  const removedEdges = new Set(actions.flatMap(action => (action.kind === "close_road" ? [action.edgeId] : [])));
  const neighbours = adjacency({
    ...graph,
    nodes: graph.nodes.filter(node => !removedNodes.has(node.id)),
    edges: graph.edges.filter(edge => !removedEdges.has(edge.id) && !removedNodes.has(edge.source) && !removedNodes.has(edge.target)),
  });
  const visited = new Set<string>();
  let components = 0;
  neighbours.forEach((_, start) => {
    if (visited.has(start)) return;
    components += 1;
    const queue = [start];
    visited.add(start);
    while (queue.length > 0) {
      const current = queue.shift()!;
      neighbours.get(current)?.forEach(({ nodeId }) => {
        if (!visited.has(nodeId)) {
          visited.add(nodeId);
          queue.push(nodeId);
        }
      });
    }
  });
  return components;
}

function outcomeFromPlan(
  graph: CityGraph,
  parameters: EpidemicParameters,
  plan: InterventionPlan,
  baselineCumulativeInfected: number,
  evidence: SymptomEvidence[],
): StrategyOutcome {
  const closedEdgeIds = plan.actions.flatMap(action => (action.kind === "close_road" ? [action.edgeId] : []));
  const quarantinedNodeIds = plan.actions.flatMap(action =>
    action.kind === "quarantine_node" ? [action.nodeId] : action.kind === "isolate_block" ? action.nodeIds : [],
  );
  const timeline = runDiscreteTimeSIR(graph, parameters, { closedEdgeIds, quarantinedNodeIds });
  const finalMetrics = timeline.at(-1)!.metrics;
  const peak = timeline.reduce(
    (peakSnapshot, snapshot) => (snapshot.metrics.infected > peakSnapshot.metrics.infected ? snapshot : peakSnapshot),
    timeline[0]!,
  );
  const finalInfectedDay = [...timeline].reverse().find(snapshot => snapshot.metrics.infected > 0)?.day ?? 0;
  const containmentRate =
    baselineCumulativeInfected === 0
      ? 0
      : clamp((baselineCumulativeInfected - finalMetrics.cumulativeInfected) / baselineCumulativeInfected, 0, 1);
  const hotspotScores = scoreBayesianHotspots(graph, timeline.at(-1)!.nodeStates, evidence);
  return {
    strategy: plan.strategy,
    actions: plan.actions,
    budgetUse: plan.budgetUse,
    timeline,
    hotspotScores,
    finalMetrics,
    peakInfected: peak.metrics.infected,
    peakInfectedDay: peak.day,
    outbreakDurationDays: finalInfectedDay,
    finalInfectedPopulation: finalMetrics.cumulativeInfected,
    finalMortalityPopulation: finalMetrics.deceased,
    containmentRate,
    networkComponentsAfterIntervention: networkComponentCount(graph, plan.actions),
    shortRationale: plan.rationale,
  };
}

export type ManualInterventionOutcome = Omit<StrategyOutcome, "strategy">;

/**
 * Runs a user-selected set of closures and quarantines against the same graph and
 * epidemic assumptions. It is intentionally separate from the five-way fair
 * comparison, which remains unchanged and algorithm-selected.
 */
export function runManualInterventionScenario(input: {
  graph: CityGraph;
  parameters: EpidemicParameters;
  actions: InterventionAction[];
  evidence?: SymptomEvidence[];
}) : ManualInterventionOutcome {
  const baseline = runDiscreteTimeSIR(input.graph, input.parameters);
  const baselineCumulativeInfected = baseline.at(-1)?.metrics.cumulativeInfected ?? 0;
  const outcome = outcomeFromPlan(
    input.graph,
    input.parameters,
    {
      strategy: "random",
      actions: input.actions,
      budgetUse: budgetUse(input.graph, input.actions),
      rationale: "User-selected interactive intervention plan.",
    },
    baselineCumulativeInfected,
    input.evidence ?? [],
  );
  const { strategy: _strategy, ...manualOutcome } = outcome;
  return manualOutcome;
}

export function runFairStrategyComparison(input: {
  id: string;
  title: string;
  graph: CityGraph;
  parameters: EpidemicParameters;
  budget: InterventionBudget;
  evidence?: SymptomEvidence[];
}) {
  const baseline = runDiscreteTimeSIR(input.graph, input.parameters);
  const baselineCumulativeInfected = baseline.at(-1)?.metrics.cumulativeInfected ?? 0;
  const outcomes = strategyOrder.map(strategy =>
    outcomeFromPlan(
      input.graph,
      input.parameters,
      planForStrategy({ graph: input.graph, parameters: input.parameters, budget: input.budget }, strategy),
      baselineCumulativeInfected,
      input.evidence ?? [],
    ),
  );
  const winningOutcome = [...outcomes].sort(
    (left, right) =>
      left.finalInfectedPopulation - right.finalInfectedPopulation ||
      left.finalMortalityPopulation - right.finalMortalityPopulation,
  )[0]!;
  const leadingStrategies = outcomes
    .filter(
      outcome =>
        outcome.finalInfectedPopulation === winningOutcome.finalInfectedPopulation &&
        outcome.finalMortalityPopulation === winningOutcome.finalMortalityPopulation,
    )
    .map(outcome => outcome.strategy);
  const fairness: FairComparisonMetadata = {
    graphId: input.graph.id,
    graphFingerprint: graphFingerprint(input.graph),
    initialInfectedNodeIds: [...input.parameters.initialInfectedNodeIds],
    interventionBudget: input.budget,
    epidemicParameters: input.parameters,
    randomSeed: input.parameters.simulationSeed,
    deterministicTrialMethod: "keyed_hash",
  };
  const comparison: ScenarioComparison = {
    id: input.id,
    title: input.title,
    graph: input.graph,
    evidence: input.evidence ?? [],
    fairness,
    outcomes,
    winningStrategy: winningOutcome.strategy,
    winnerStatus: leadingStrategies.length === 1 ? "unique" : "tied",
    leadingStrategies,
    createdAt: Date.now(),
    disclaimer:
      "Educational scenario model only. Results are synthetic projections under stated assumptions and are not public-health forecasts or operational advice.",
  };
  return comparison;
}

export function starterRecommendations(comparison: ScenarioComparison): ActionableRecommendation[] {
  const winningOutcome = comparison.outcomes.find(outcome => outcome.strategy === comparison.winningStrategy);
  const nodeMap = byId(comparison.graph.nodes);
  const edgeMap = byId(comparison.graph.edges);
  if (!winningOutcome) return [];
  return winningOutcome.actions.slice(0, 5).map((action, index) => {
    if (action.kind === "close_road") {
      const edge = edgeMap.get(action.edgeId);
      const endpointScores = [winningOutcome.hotspotScores.find(score => score.nodeId === edge?.source), winningOutcome.hotspotScores.find(score => score.nodeId === edge?.target)].filter(
        (score): score is BayesianHotspotScore => Boolean(score),
      );
      const averagePosterior = endpointScores.length
        ? endpointScores.reduce((sum, score) => sum + score.posteriorProbability, 0) / endpointScores.length
        : 0;
      return {
        priority: index + 1,
        action: "close_road",
        targetLabel: edge?.label ?? action.edgeId,
        targetId: action.edgeId,
        rationale: `${action.reason} ${endpointScores.length ? `Connected-location Bayesian posterior risk averages ${(averagePosterior * 100).toFixed(1)}%.` : "No population-bearing endpoint risk score is available."}`,
        budgetCost: "1 road closure",
        expectedImpact: `Part of the ${comparison.winningStrategy.replaceAll("_", " ")} intervention set, selected within the stated budget and scenario assumptions.`,
        supportingStrategy: comparison.winningStrategy,
      };
    }
    const node = nodeMap.get(action.kind === "quarantine_node" ? action.nodeId : action.nodeIds[0] ?? "");
    const hotspot = winningOutcome.hotspotScores.find(score => score.nodeId === node?.id);
    return {
      priority: index + 1,
      action: action.kind === "isolate_block" ? "isolate_block" : "quarantine_building",
      targetLabel: node?.label ?? "Selected location",
      targetId: node?.id ?? "unknown",
      rationale: `${action.reason} ${hotspot ? `Bayesian posterior risk: ${(hotspot.posteriorProbability * 100).toFixed(1)}%. ${hotspot.explanation}` : "No population-bearing risk score is available."}`,
      budgetCost: `${node?.population ?? 0} people within the quarantine budget`,
      expectedImpact: `Part of the ${comparison.winningStrategy.replaceAll("_", " ")} intervention set, selected within the stated budget and scenario assumptions.`,
      supportingStrategy: comparison.winningStrategy,
    };
  });
}
