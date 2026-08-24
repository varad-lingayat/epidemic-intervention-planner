import type { EpidemicParameters, InterventionBudget, ScenarioComparison, StrategyOutcome, SyntheticCityConfig } from "./epidemic";
import { createSyntheticCityGraph } from "./epidemicEngine";
import { runFairStrategyComparison } from "./interventions";

export const STANDARD_SYNTHETIC_SETTINGS: SyntheticCityConfig = {
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
};

export const STANDARD_INTERVENTION_BUDGET: InterventionBudget = {
  maxRoadClosures: 4,
  maxQuarantinedNodes: 3,
  maxQuarantinedPopulation: 1100,
};

export const STANDARD_REAL_ROAD_CONFIG = {
  placeName: "Bandra West, Mumbai",
  centerLat: 19.0596,
  centerLng: 72.8295,
  radiusKm: 0.1,
  maxNodes: 240,
  includeFootways: false,
};

function buildStandardPresentationScenario() {
  const graph = createSyntheticCityGraph(STANDARD_SYNTHETIC_SETTINGS);
  const initialNodeId = graph.nodes.find(node => node.population > 0)?.id ?? graph.nodes[0]?.id ?? "";
  const parameters: EpidemicParameters = {
    transmissionRate: 0.34,
    recoveryRate: 0.08,
    mortalityRate: 0.012,
    days: 28,
    initialInfectedNodeIds: [initialNodeId],
    simulationSeed: 481516,
  };
  const comparison = runFairStrategyComparison({
    id: "standard-asterhaven-presentation",
    title: "Asterhaven intervention comparison",
    graph,
    parameters,
    budget: STANDARD_INTERVENTION_BUDGET,
    evidence: [],
  });
  return { graph, parameters, budget: STANDARD_INTERVENTION_BUDGET, comparison };
}

let standardPresentationScenario: ReturnType<typeof buildStandardPresentationScenario> | undefined;

/**
 * Builds the deterministic teaching scenario once per renderer/server process.
 * The graph and comparison are immutable inputs in the workspace, so reuse avoids
 * repeating five simulations during initial render and ordinary Reset actions.
 */
export function createStandardPresentationScenario() {
  standardPresentationScenario ??= buildStandardPresentationScenario();
  return standardPresentationScenario;
}

/** The exact values restored by the visible workspace Reset control. */
export function createStandardWorkspaceResetState() {
  const standard = createStandardPresentationScenario();
  return {
    ...standard,
    cityMode: "synthetic" as const,
    syntheticSettings: STANDARD_SYNTHETIC_SETTINGS,
    realConfig: STANDARD_REAL_ROAD_CONFIG,
    symptomEvidence: [] as const,
    symptomaticPeople: 0,
    evidenceStrength: 0.72,
    day: 0,
    playing: false,
    networkMode: "2d" as const,
    expandedNetwork: false,
    manualActions: [] as const,
    manualOutcome: undefined,
    plainEnglishExplanation: undefined,
    shareUrl: undefined,
    demoOpen: false,
    demoIndex: 0,
    view: "setup" as const,
  };
}

const csvCell = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;

const actionSummary = (outcome: StrategyOutcome) => outcome.actions.length
  ? outcome.actions.map(action => action.kind === "close_road" ? `Close road ${action.edgeId}` : action.kind === "quarantine_node" ? `Quarantine ${action.nodeId}` : `Isolate ${action.nodeIds.join(" + ")}`).join("; ")
  : "No selected action";

export function buildStrategyComparisonCsv(comparison: ScenarioComparison) {
  const header = ["scenario_title", "strategy", "leadership_status", "final_cases", "recovered", "modeled_deaths", "peak_active_cases", "peak_day", "containment_percent", "roads_closed", "locations_quarantined", "population_quarantined", "selected_actions"];
  const leaderSet = new Set(comparison.leadingStrategies ?? [comparison.winningStrategy]);
  const rows = comparison.outcomes.map(outcome => [
    comparison.title,
    outcome.strategy,
    leaderSet.has(outcome.strategy) ? comparison.winnerStatus === "tied" ? "tied_lead" : "winner" : "not_leading",
    outcome.finalInfectedPopulation,
    outcome.timeline.at(-1)?.metrics.recovered ?? 0,
    outcome.finalMortalityPopulation,
    outcome.peakInfected,
    outcome.peakInfectedDay,
    Math.round(outcome.containmentRate * 100),
    outcome.budgetUse.closedRoads,
    outcome.budgetUse.quarantinedNodes,
    outcome.budgetUse.quarantinedPopulation,
    actionSummary(outcome),
  ].map(csvCell).join(","));
  return [header.map(csvCell).join(","), ...rows].join("\n");
}

export function downloadStrategyComparisonCsv(filename: string, comparison: ScenarioComparison, doc: Document = document, urlApi: Pick<typeof URL, "createObjectURL" | "revokeObjectURL"> = URL) {
  const blob = new Blob([buildStrategyComparisonCsv(comparison)], { type: "text/csv;charset=utf-8" });
  const url = urlApi.createObjectURL(blob);
  const link = doc.createElement("a");
  link.href = url;
  link.download = filename;
  doc.body.appendChild(link);
  link.click();
  link.remove();
  urlApi.revokeObjectURL(url);
}

export const PRESENTER_NOTES = [
  "Open with the fairness rule: every method receives the same graph, seed, starting infection, epidemic assumptions, and intervention budget.",
  "Use Configure to name the assumptions, then use Explore network to point out graph nodes, edges, road closures, and manual what-if actions.",
  "Enter symptom evidence for a location to demonstrate Bayesian hotspot scoring: the score updates a model priority from symptoms and connected-neighbour context; it is not a diagnosis or confirmed infection probability.",
  "Use View outcomes for the day-by-day SIR timeline. Emphasize that the displayed counts are academic projections, not real public-health forecasts.",
  "Use Compare to show final modeled cases, recoveries, deaths, peak infections, and budget use. If the leader is tied, say so rather than claiming a unique winner.",
  "Use Sensitivity to show which assumptions move the result. Then use Demonstration Mode to load the five verified teaching contrasts, one for each strategy.",
] as const;
