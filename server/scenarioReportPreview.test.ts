import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ScenarioReportPreview } from "../client/src/components/ScenarioReportPreview";
import { createSyntheticCityGraph } from "../shared/epidemicEngine";
import { runFairStrategyComparison, starterRecommendations } from "../shared/interventions";

describe("persisted shared report rendering", () => {
  it("renders every required export and public-share section from a report payload", () => {
    const graph = createSyntheticCityGraph({
      name: "Persisted payload city",
      seed: 411,
      districtCount: 2,
      blocksPerDistrict: 2,
      homesPerBlock: 2,
      schoolCount: 1,
      hospitalCount: 1,
      officeCount: 1,
    });
    const initialInfectedNodeId = graph.nodes.find(node => node.population > 0)?.id ?? "";
    const comparison = runFairStrategyComparison({
      id: "persisted-shared-report",
      title: "Persisted shared report",
      graph,
      parameters: {
        transmissionRate: 0.34,
        recoveryRate: 0.08,
        mortalityRate: 0.012,
        days: 12,
        initialInfectedNodeIds: [initialInfectedNodeId],
        simulationSeed: 91,
      },
      budget: { maxRoadClosures: 2, maxQuarantinedNodes: 1, maxQuarantinedPopulation: 400 },
    });
    const recommendations = starterRecommendations(comparison);
    const explanation = "This persisted explanation summarizes the selected strategy in plain English.";
    const markup = renderToStaticMarkup(
      ScenarioReportPreview({
        id: "shared-report-content",
        title: "Persisted shared report",
        payload: { comparison, recommendations, plainEnglishExplanation: explanation },
      }),
    );

    [
      "scenario-configuration",
      "graph-snapshot",
      "plain-english-explanation",
      "selected-interventions",
      "comparison-charts",
      "recommendations",
    ].forEach(section => expect(markup).toContain(`data-report-section=\"${section}\"`));
    expect(markup).toContain(graph.name);
    expect(markup).toContain(explanation);
    expect(markup).toContain("Selected intervention actions");
    expect(markup).toContain("Active infections by day");
    expect(markup).toContain(recommendations[0]!.targetLabel);
  });
});
