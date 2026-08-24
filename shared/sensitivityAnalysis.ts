import type { CityGraph, EpidemicParameters, InterventionBudget, StrategyName, SymptomEvidence } from "./epidemic";
import { runFairStrategyComparison } from "./interventions";

export const SENSITIVITY_PARAMETERS = ["transmissionRate", "recoveryRate", "mortalityRate"] as const;
export type SensitivityParameter = (typeof SENSITIVITY_PARAMETERS)[number];

export type SensitivityPoint = {
  value: number;
  label: string;
  winningStrategy: StrategyName;
  strategyFinalInfections: Record<StrategyName, number>;
  strategyModeledDeaths: Record<StrategyName, number>;
};

const ranges: Record<SensitivityParameter, { minimum: number; maximum: number; delta: number; precision: number }> = {
  transmissionRate: { minimum: 0.05, maximum: 0.8, delta: 0.05, precision: 2 },
  recoveryRate: { minimum: 0.01, maximum: 0.25, delta: 0.02, precision: 2 },
  mortalityRate: { minimum: 0, maximum: 0.08, delta: 0.005, precision: 3 },
};

const clamp = (value: number, minimum: number, maximum: number) => Math.max(minimum, Math.min(maximum, value));

export function sensitivityValues(parameter: SensitivityParameter, currentValue: number) {
  const range = ranges[parameter];
  return Array.from({ length: 7 }, (_, index) => {
    const offset = index - 3;
    return Number(clamp(currentValue + offset * range.delta, range.minimum, range.maximum).toFixed(range.precision));
  });
}

export type SensitivityAnalysisInput = {
  graph: CityGraph;
  parameters: EpidemicParameters;
  budget: InterventionBudget;
  evidence?: SymptomEvidence[];
  parameter: SensitivityParameter;
};

/** Computes one fair comparison point, allowing UI callers to schedule a long sweep incrementally. */
export function buildSensitivityPoint(input: SensitivityAnalysisInput, value: number): SensitivityPoint {
  const parameters = { ...input.parameters, [input.parameter]: value };
  const comparison = runFairStrategyComparison({
    id: `sensitivity-${input.parameter}-${value}`,
    title: `${input.graph.name} sensitivity analysis`,
    graph: input.graph,
    parameters,
    budget: input.budget,
    evidence: input.evidence,
  });
  const strategyFinalInfections = {} as Record<StrategyName, number>;
  const strategyModeledDeaths = {} as Record<StrategyName, number>;
  comparison.outcomes.forEach(outcome => {
    strategyFinalInfections[outcome.strategy] = outcome.finalInfectedPopulation;
    strategyModeledDeaths[outcome.strategy] = outcome.finalMortalityPopulation;
  });
  return {
    value,
    label: `${Math.round(value * 100)}%`,
    winningStrategy: comparison.winningStrategy,
    strategyFinalInfections,
    strategyModeledDeaths,
  };
}

/** Runs the same city, seed, initial infections, and budget at nearby values of one assumption. */
export function buildSensitivityAnalysis(input: SensitivityAnalysisInput): SensitivityPoint[] {
  return sensitivityValues(input.parameter, input.parameters[input.parameter]).map(value => buildSensitivityPoint(input, value));
}
