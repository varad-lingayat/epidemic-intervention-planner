import { describe, expect, it } from "vitest";
import { toggleInitialInfectionSeed } from "../shared/initialInfectionSelection";
import { createSyntheticCityGraph } from "../shared/epidemicEngine";
import { runFairStrategyComparison } from "../shared/interventions";

describe("initial infection selection", () => {
  it("selects, deselects, preserves one seed, and enforces the three-seed cap", () => {
    const selected = toggleInitialInfectionSeed(["home-a"], "school-a");
    expect(selected).toMatchObject({ initialInfectedNodeIds: ["home-a", "school-a"], changed: true, reason: "selected" });

    const deselected = toggleInitialInfectionSeed(selected.initialInfectedNodeIds, "school-a");
    expect(deselected).toMatchObject({ initialInfectedNodeIds: ["home-a"], changed: true, reason: "deselected" });

    const minimum = toggleInitialInfectionSeed(["home-a"], "home-a");
    expect(minimum).toMatchObject({ initialInfectedNodeIds: ["home-a"], changed: false, reason: "minimum" });

    const maximum = toggleInitialInfectionSeed(["home-a", "school-a", "office-a"], "hospital-a");
    expect(maximum).toMatchObject({ initialInfectedNodeIds: ["home-a", "school-a", "office-a"], changed: false, reason: "maximum" });
  });

  it("propagates a selected multi-seed set unchanged to every fair strategy", () => {
    const graph = createSyntheticCityGraph({
      name: "Selection verification city",
      seed: 47291,
      districtCount: 2,
      blocksPerDistrict: 2,
      homesPerBlock: 2,
      schoolCount: 1,
      hospitalCount: 1,
      officeCount: 1,
      roadDensity: 0.35,
      minTransmissionProbability: 0.012,
      maxTransmissionProbability: 0.054,
    });
    const selectedIds = graph.nodes.filter(node => node.population > 0).slice(0, 3).map(node => node.id);
    const comparison = runFairStrategyComparison({
      id: "initial-seed-verification",
      title: "Initial seed verification",
      graph,
      parameters: {
        transmissionRate: 0.34,
        recoveryRate: 0.08,
        mortalityRate: 0.012,
        days: 18,
        simulationSeed: 481516,
        initialInfectedNodeIds: selectedIds,
      },
      budget: { maxRoadClosures: 3, maxQuarantinedNodes: 2, maxQuarantinedPopulation: 900 },
    });

    expect(comparison.fairness.initialInfectedNodeIds).toEqual(selectedIds);
    expect(comparison.outcomes).toHaveLength(5);
  });
});
