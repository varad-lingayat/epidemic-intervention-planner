import { describe, expect, it } from "vitest";
import { createSyntheticCityGraph } from "../shared/epidemicEngine";
import { runFairStrategyComparison, runManualInterventionScenario, scoreBayesianHotspots, starterRecommendations } from "../shared/interventions";

const graph = createSyntheticCityGraph({
  seed: 122,
  districtCount: 2,
  blocksPerDistrict: 3,
  homesPerBlock: 2,
  schoolCount: 1,
  hospitalCount: 1,
  officeCount: 1,
});

const input = {
  id: "comparison-test",
  title: "Fair comparison test",
  graph,
  parameters: {
    transmissionRate: 0.48,
    recoveryRate: 0.08,
    mortalityRate: 0.01,
    days: 10,
    initialInfectedNodeIds: ["district-1-block-1-home-1"],
    simulationSeed: 899,
  },
  budget: {
    maxRoadClosures: 2,
    maxQuarantinedNodes: 1,
    maxQuarantinedPopulation: 400,
  },
};

describe("fair intervention comparison", () => {
  it("runs all five strategies under one identical comparison protocol", () => {
    const comparison = runFairStrategyComparison(input);

    expect(comparison.outcomes.map(outcome => outcome.strategy)).toEqual([
      "random",
      "highest_degree",
      "betweenness_centrality",
      "dijkstra_blocking",
      "max_flow_min_cut",
    ]);
    expect(comparison.fairness.graphId).toBe(graph.id);
    expect(comparison.fairness.randomSeed).toBe(input.parameters.simulationSeed);
    expect(comparison.fairness.deterministicTrialMethod).toBe("keyed_hash");
  });

  it("enforces the same intervention budget for every strategy", () => {
    const comparison = runFairStrategyComparison(input);

    comparison.outcomes.forEach(outcome => {
      expect(outcome.budgetUse.closedRoads).toBeLessThanOrEqual(input.budget.maxRoadClosures);
      expect(outcome.budgetUse.quarantinedNodes).toBeLessThanOrEqual(input.budget.maxQuarantinedNodes);
      expect(outcome.budgetUse.quarantinedPopulation).toBeLessThanOrEqual(
        input.budget.maxQuarantinedPopulation,
      );
      expect(outcome.timeline).toHaveLength(input.parameters.days + 1);
    });
  });

  it("recalculates a user-selected road closure using the same epidemic assumptions", () => {
    const edgeId = graph.edges[0]!.id;
    const manual = runManualInterventionScenario({
      graph,
      parameters: input.parameters,
      actions: [{ kind: "close_road", edgeId, reason: "Interactive exploration selection." }],
    });

    expect(manual.actions).toEqual([{ kind: "close_road", edgeId, reason: "Interactive exploration selection." }]);
    expect(manual.timeline).toHaveLength(input.parameters.days + 1);
    expect(manual.budgetUse.closedRoads).toBe(1);
    expect(manual.finalMetrics.cumulativeInfected).toBeGreaterThanOrEqual(0);
  });

  it("recalculates a user-selected populated location quarantine under the same assumptions", () => {
    const node = graph.nodes.find(candidate => candidate.population > 0)!;
    const manual = runManualInterventionScenario({
      graph,
      parameters: input.parameters,
      actions: [{ kind: "quarantine_node", nodeId: node.id, reason: "Interactive exploration selection." }],
    });

    expect(manual.actions).toEqual([{ kind: "quarantine_node", nodeId: node.id, reason: "Interactive exploration selection." }]);
    expect(manual.timeline).toHaveLength(input.parameters.days + 1);
    expect(manual.budgetUse.quarantinedNodes).toBe(1);
    expect(manual.budgetUse.quarantinedPopulation).toBe(node.population);
  });

  it("keeps a zero-population road-only graph stable for an empty manual action plan", () => {
    const roadOnlyGraph = {
      ...graph,
      nodes: graph.nodes.map(node => ({ ...node, population: 0 })),
    };
    const manual = runManualInterventionScenario({
      graph: roadOnlyGraph,
      parameters: { ...input.parameters, initialInfectedNodeIds: [roadOnlyGraph.nodes[0]!.id] },
      actions: [],
    });

    expect(manual.budgetUse.quarantinedNodes).toBe(0);
    expect(manual.timeline).toHaveLength(input.parameters.days + 1);
    expect(manual.finalMetrics.cumulativeInfected).toBe(0);
  });

  it("selects interventions deterministically for a repeated scenario", () => {
    const first = runFairStrategyComparison(input);
    const second = runFairStrategyComparison(input);

    expect(first.outcomes.map(outcome => outcome.actions)).toEqual(
      second.outcomes.map(outcome => outcome.actions),
    );
    expect(first.outcomes.map(outcome => outcome.finalMetrics)).toEqual(
      second.outcomes.map(outcome => outcome.finalMetrics),
    );
    expect(first.winnerStatus).toBe(second.winnerStatus);
    expect(first.leadingStrategies).toEqual(second.leadingStrategies);
    expect(first.leadingStrategies).toContain(first.winningStrategy);
  });

  it("reports tied leadership instead of presenting the order-default strategy as a unique winner", () => {
    const tiedComparison = runFairStrategyComparison({
      ...input,
      parameters: { ...input.parameters, transmissionRate: 0, mortalityRate: 0, days: 3 },
      budget: { maxRoadClosures: 0, maxQuarantinedNodes: 0, maxQuarantinedPopulation: 0 },
    });

    expect(tiedComparison.winnerStatus).toBe("tied");
    expect(tiedComparison.leadingStrategies).toHaveLength(5);
    expect(tiedComparison.leadingStrategies).toContain("random");
  });

  it("ranks bounded Bayesian hotspot risks and incorporates symptom evidence", () => {
    const comparison = runFairStrategyComparison(input);
    const nodeStates = comparison.outcomes[0]!.timeline.at(-1)!.nodeStates;
    const targetId = "district-1-block-1-home-2";
    const withoutEvidence = scoreBayesianHotspots(graph, nodeStates);
    const withEvidence = scoreBayesianHotspots(graph, nodeStates, [
      {
        nodeId: targetId,
        symptomaticPeople: 12,
        observedPopulation: 15,
        evidenceStrength: 1,
      },
    ]);

    const priorScore = withoutEvidence.find(score => score.nodeId === targetId)!;
    const evidenceScore = withEvidence.find(score => score.nodeId === targetId)!;
    expect(evidenceScore.posteriorProbability).toBeGreaterThan(priorScore.posteriorProbability);
    expect(withEvidence.every(score => score.posteriorProbability >= 0 && score.posteriorProbability <= 1)).toBe(true);
    expect(withEvidence.map(score => score.rank)).toEqual(withEvidence.map((_, index) => index + 1));
    const scorableLocationCount = graph.nodes.filter(node => node.population > 0).length;
    expect(comparison.outcomes.every(outcome => outcome.hotspotScores.length === scorableLocationCount)).toBe(true);
  });

  it("turns the winning strategy into complete actionable recommendations", () => {
    const comparison = runFairStrategyComparison(input);
    const recommendations = starterRecommendations(comparison);

    expect(recommendations.length).toBeGreaterThan(0);
    expect(recommendations.map(recommendation => recommendation.priority)).toEqual(
      recommendations.map((_, index) => index + 1),
    );
    recommendations.forEach(recommendation => {
      expect(["close_road", "quarantine_building", "isolate_block", "deploy_testing"]).toContain(recommendation.action);
      expect(recommendation.targetId).not.toHaveLength(0);
      expect(recommendation.targetLabel).not.toHaveLength(0);
      expect(recommendation.rationale.length).toBeGreaterThan(20);
      expect(recommendation.budgetCost).not.toHaveLength(0);
      expect(recommendation.expectedImpact).toContain("stated budget");
      expect(recommendation.supportingStrategy).toBe(comparison.winningStrategy);

      if (recommendation.action === "close_road") {
        expect(graph.edges.some(edge => edge.id === recommendation.targetId)).toBe(true);
      } else {
        expect(graph.nodes.some(node => node.id === recommendation.targetId)).toBe(true);
      }
    });
  });

  it("produces non-trivial and distinguishable outcomes for the dashboard default scenario", () => {
    const defaultGraph = createSyntheticCityGraph({
      name: "Asterhaven",
      seed: 20260820,
      districtCount: 3,
      blocksPerDistrict: 3,
      homesPerBlock: 3,
      schoolCount: 2,
      hospitalCount: 1,
      officeCount: 3,
      roadDensity: 0.32,
      minTransmissionProbability: 0.012,
      maxTransmissionProbability: 0.054,
    });
    const initialNodeId = defaultGraph.nodes.find(node => node.population > 0)?.id ?? "";
    const comparison = runFairStrategyComparison({
      id: "default-dashboard-scenario",
      title: "Asterhaven intervention comparison",
      graph: defaultGraph,
      parameters: {
        transmissionRate: 0.34,
        recoveryRate: 0.08,
        mortalityRate: 0.012,
        days: 28,
        initialInfectedNodeIds: [initialNodeId],
        simulationSeed: 481516,
      },
      budget: { maxRoadClosures: 4, maxQuarantinedNodes: 3, maxQuarantinedPopulation: 1100 },
    });
    const finalCases = comparison.outcomes.map(outcome => outcome.finalInfectedPopulation);
    const initialCases = comparison.outcomes[0]!.timeline[0]!.metrics.cumulativeInfected;

    expect(Math.max(...finalCases)).toBeGreaterThan(initialCases);
    expect(new Set(finalCases).size).toBeGreaterThan(1);
  });
});
