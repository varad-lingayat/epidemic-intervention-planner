import { describe, expect, it } from "vitest";
import { createSyntheticCityGraph } from "../shared/epidemicEngine";
import { buildSensitivityAnalysis, sensitivityValues } from "../shared/sensitivityAnalysis";

describe("sensitivity analysis", () => {
  const graph = createSyntheticCityGraph({
    seed: 924, districtCount: 2, blocksPerDistrict: 2, homesPerBlock: 2,
    schoolCount: 1, hospitalCount: 1, officeCount: 1, roadDensity: 0.32,
    minTransmissionProbability: 0.01, maxTransmissionProbability: 0.04, name: "Sensitivity fixture",
  });
  const parameters = {
    transmissionRate: 0.34, recoveryRate: 0.08, mortalityRate: 0.012, days: 10,
    initialInfectedNodeIds: [graph.nodes.find(node => node.population > 0)!.id], simulationSeed: 902,
  };
  const budget = { maxRoadClosures: 2, maxQuarantinedNodes: 2, maxQuarantinedPopulation: 800 };

  it("creates a bounded, ordered sweep around the active assumption", () => {
    const values = sensitivityValues("transmissionRate", parameters.transmissionRate);
    expect(values).toHaveLength(7);
    expect(values[3]).toBe(parameters.transmissionRate);
    expect(values.every(value => value >= 0.05 && value <= 0.8)).toBe(true);
  });

  it("returns an outcome for all five strategies at every sweep point", () => {
    const result = buildSensitivityAnalysis({ graph, parameters, budget, parameter: "recoveryRate" });
    expect(result).toHaveLength(7);
    result.forEach(point => {
      expect(Object.keys(point.strategyFinalInfections)).toHaveLength(5);
      expect(point.winningStrategy).toBeDefined();
    });
  });
});
