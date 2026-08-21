import { describe, expect, it } from "vitest";
import { createSyntheticCityGraph } from "../shared/epidemicEngine";
import { runFairStrategyComparison } from "../shared/interventions";
import { compactScenarioForExplanation } from "../shared/explanationSummary";
import { buildDecisionExplanationPrompt, fallbackDecisionExplanation } from "./decisionExplanation";

describe("decision explanation preparation", () => {
  const graph = createSyntheticCityGraph({
    name: "Explanation Fixture",
    seed: 88,
    districtCount: 2,
    blocksPerDistrict: 2,
    homesPerBlock: 2,
    schoolCount: 1,
    hospitalCount: 1,
    officeCount: 1,
    roadDensity: 0.35,
    minTransmissionProbability: 0.012,
    maxTransmissionProbability: 0.03,
  });
  const firstPopulationNode = graph.nodes.find(node => node.population > 0)?.id ?? graph.nodes[0]!.id;
  const comparison = runFairStrategyComparison({
    id: "explanation-fixture",
    title: "Explanation fixture scenario",
    graph,
    parameters: {
      transmissionRate: 0.25,
      recoveryRate: 0.1,
      mortalityRate: 0.01,
      days: 10,
      initialInfectedNodeIds: [firstPopulationNode],
      simulationSeed: 99,
    },
    budget: { maxRoadClosures: 2, maxQuarantinedNodes: 2, maxQuarantinedPopulation: 800 },
  });

  it("supplies the fair-comparison metrics and selected strategy to the model prompt", () => {
    const prompt = buildDecisionExplanationPrompt(compactScenarioForExplanation(comparison));

    expect(prompt).toContain("same graph, parameters, starting locations, random seed");
    expect(prompt).toContain("winningStrategy");
    expect(prompt).toContain("highestRiskLocations");
  });

  it("keeps deterministic fallback language explicitly scoped to an academic scenario model", () => {
    const fallback = fallbackDecisionExplanation(compactScenarioForExplanation(comparison));

    expect(fallback).toContain("academic scenario-model output");
    expect(fallback).toContain("not a public-health forecast");
    expect(fallback).toContain("modeled deaths");
  });

  it("reduces the full graph and timeline payload to a small explanation-only summary", () => {
    const compact = compactScenarioForExplanation(comparison);
    const compactJson = JSON.stringify(compact);
    const fullJson = JSON.stringify(comparison);

    expect(compactJson.length).toBeLessThan(60_000);
    expect(compactJson.length).toBeLessThan(fullJson.length);
    expect(compact).toMatchObject({
      graph: { locations: graph.nodes.length, roads: graph.edges.length },
      winningStrategy: comparison.winningStrategy,
    });
    expect(compact).not.toHaveProperty("timeline");
  });
});
