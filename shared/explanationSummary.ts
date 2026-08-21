import type { InterventionAction, ScenarioComparison, StrategyName } from "./epidemic";

export type ExplanationScenarioSummary = {
  scenarioName: string;
  graph: { name: string; source: string; locations: number; roads: number };
  fairConditions: {
    initialInfectionLocations: string[];
    transmissionRate: number;
    recoveryRate: number;
    mortalityRate: number;
    simulationDays: number;
    seed: number;
    interventionBudget: ScenarioComparison["fairness"]["interventionBudget"];
  };
  winningStrategy: StrategyName;
  strategyOutcomes: Array<{
    strategy: StrategyName;
    finalInfections: number;
    modeledDeaths: number;
    peakInfections: number;
    peakDay: number;
    containmentRatePercent: number;
  }>;
  selectedActions: Array<{ kind: InterventionAction["kind"]; target: string; reason: string }>;
  highestRiskLocations: Array<{ location: string; posteriorRiskPercent: number; reason: string }>;
  scenarioModelNote: string;
};

function actionTargetLabel(action: InterventionAction, comparison: ScenarioComparison) {
  const nodeLabel = (nodeId: string) => comparison.graph.nodes.find(node => node.id === nodeId)?.label ?? nodeId;
  if (action.kind === "close_road") {
    const edge = comparison.graph.edges.find(candidate => candidate.id === action.edgeId);
    return edge?.label ?? (edge ? `${nodeLabel(edge.source)} to ${nodeLabel(edge.target)}` : action.edgeId);
  }
  if (action.kind === "quarantine_node") return nodeLabel(action.nodeId);
  return `Block ${action.blockId}`;
}

/**
 * Reduces the complete simulation (graph geometry and daily timelines included) to the
 * exact evidence required for a plain-English explanation. This keeps the protected
 * request small and means the language model never receives unnecessary raw state data.
 */
export function compactScenarioForExplanation(comparison: ScenarioComparison): ExplanationScenarioSummary {
  const winner = comparison.outcomes.find(outcome => outcome.strategy === comparison.winningStrategy) ?? comparison.outcomes[0];
  const nodeLabel = (nodeId: string) => comparison.graph.nodes.find(node => node.id === nodeId)?.label ?? nodeId;

  return {
    scenarioName: comparison.title,
    graph: {
      name: comparison.graph.name,
      source: comparison.graph.source,
      locations: comparison.graph.nodes.length,
      roads: comparison.graph.edges.length,
    },
    fairConditions: {
      initialInfectionLocations: comparison.fairness.initialInfectedNodeIds.map(nodeLabel),
      transmissionRate: comparison.fairness.epidemicParameters.transmissionRate,
      recoveryRate: comparison.fairness.epidemicParameters.recoveryRate,
      mortalityRate: comparison.fairness.epidemicParameters.mortalityRate,
      simulationDays: comparison.fairness.epidemicParameters.days,
      seed: comparison.fairness.randomSeed,
      interventionBudget: comparison.fairness.interventionBudget,
    },
    winningStrategy: comparison.winningStrategy,
    strategyOutcomes: comparison.outcomes.map(outcome => ({
      strategy: outcome.strategy,
      finalInfections: outcome.finalInfectedPopulation,
      modeledDeaths: outcome.finalMortalityPopulation,
      peakInfections: outcome.peakInfected,
      peakDay: outcome.peakInfectedDay,
      containmentRatePercent: Math.round(outcome.containmentRate * 100),
    })),
    selectedActions: (winner?.actions ?? []).slice(0, 6).map(action => ({
      kind: action.kind,
      target: actionTargetLabel(action, comparison),
      reason: action.reason.slice(0, 360),
    })),
    highestRiskLocations: (winner?.hotspotScores ?? []).slice(0, 4).map(score => ({
      location: nodeLabel(score.nodeId),
      posteriorRiskPercent: Math.round(score.posteriorProbability * 100),
      reason: score.explanation.slice(0, 360),
    })),
    scenarioModelNote: comparison.disclaimer,
  };
}
