import type { StrategyName } from "../shared/epidemic";
import type { ExplanationScenarioSummary } from "../shared/explanationSummary";

function strategyLabel(strategy: StrategyName) {
  return {
    random: "random selection",
    highest_degree: "highest-degree selection",
    betweenness_centrality: "betweenness-centrality selection",
    dijkstra_blocking: "Dijkstra path blocking",
    max_flow_min_cut: "max-flow/min-cut separation",
  }[strategy];
}

export function buildDecisionExplanationPrompt(summary: ExplanationScenarioSummary) {
  return JSON.stringify({
    scenarioName: summary.scenarioName,
    graph: summary.graph,
    winningStrategy: strategyLabel(summary.winningStrategy),
    selectionRule: "The displayed winner is selected by lower final infections, then lower modeled deaths, using the same graph, parameters, starting locations, random seed, duration, and intervention budget for every strategy.",
    fairConditions: summary.fairConditions,
    winningActions: summary.selectedActions,
    allStrategyOutcomes: summary.strategyOutcomes.map(outcome => ({
      strategy: strategyLabel(outcome.strategy),
      finalInfections: outcome.finalInfections,
      modeledDeaths: outcome.modeledDeaths,
      peakInfections: outcome.peakInfections,
      containmentRatePercent: outcome.containmentRatePercent,
    })),
    highestRiskLocations: summary.highestRiskLocations,
    disclaimer: summary.scenarioModelNote,
  });
}

export function fallbackDecisionExplanation(summary: ExplanationScenarioSummary) {
  const winner = summary.strategyOutcomes.find(outcome => outcome.strategy === summary.winningStrategy) ?? summary.strategyOutcomes[0];
  if (!winner) return "No completed strategy outcome is available for this scenario.";

  return `${strategyLabel(winner.strategy)} produced the lowest final infection total in this simulated comparison while respecting the same intervention budget used by every other strategy. Its result reflects ${winner.finalInfections.toLocaleString()} modeled final infections, ${winner.modeledDeaths.toLocaleString()} modeled deaths, and a peak of ${winner.peakInfections.toLocaleString()} active infections on day ${winner.peakDay}.

The proposed actions prioritize the road links and locations that the selected graph method treated as the most important connectors or exposure points. The Bayesian hotspot scores are supporting risk indicators based on the scenario inputs and neighboring network states; they are not clinical diagnoses.

This is an academic scenario-model output, not a public-health forecast or operational instruction. Real intervention decisions require validated local data, public-health expertise, legal authority, and equity review.`;
}
