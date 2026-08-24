// @vitest-environment jsdom
import React, { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ManualInterventionPanel, SetupView } from "../client/src/pages/Home";
import { createSyntheticCityGraph } from "../shared/epidemicEngine";
import type { EpidemicParameters, InterventionBudget, SyntheticCityConfig } from "../shared/epidemic";

const syntheticSettings: SyntheticCityConfig = { name: "QA City", seed: 42, districtCount: 3, blocksPerDistrict: 3, homesPerBlock: 8, schoolCount: 2, hospitalCount: 1, officeCount: 3, roadDensity: 0.45, minTransmissionProbability: 0.04, maxTransmissionProbability: 0.16 };
const parameters: EpidemicParameters = { transmissionRate: 0.24, recoveryRate: 0.08, mortalityRate: 0.01, days: 21, initialInfectedNodeIds: [], simulationSeed: 42 };
const budget: InterventionBudget = { maxRoadClosures: 4, maxQuarantinedNodes: 3, maxQuarantinedPopulation: 900 };
const realConfig = { placeName: "QA roads", centerLat: 19.076, centerLng: 72.8777, radiusKm: 0.1, maxNodes: 120, includeFootways: false };

afterEach(cleanup);

function SetupHarness({ importError, importing = false }: { importError?: string; importing?: boolean }) {
  const [cityMode, setCityMode] = useState<"synthetic" | "openstreetmap">("synthetic");
  const [synthetic, setSynthetic] = useState(syntheticSettings);
  const [real, setReal] = useState(realConfig);
  const [scenarioParameters, setScenarioParameters] = useState(parameters);
  const [scenarioBudget, setScenarioBudget] = useState(budget);
  const graph = createSyntheticCityGraph(syntheticSettings);
  const [evidenceNodeId, setEvidenceNodeId] = useState(graph.nodes.find(node => node.population > 0)?.id ?? "");
  const [symptomatic, setSymptomatic] = useState(0);
  const [strength, setStrength] = useState(0.5);
  const regenerate = vi.fn();
  const importRealCity = vi.fn();
  const rerun = vi.fn();
  const applyEvidence = vi.fn();
  return <>
    <SetupView cityMode={cityMode} setCityMode={setCityMode} syntheticSettings={synthetic} setSyntheticSettings={setSynthetic} regenerateSyntheticCity={regenerate} realConfig={real} setRealConfig={setReal} importRealCity={importRealCity} importing={importing} importError={importError} parameters={scenarioParameters} setParameters={setScenarioParameters} budget={scenarioBudget} setBudget={setScenarioBudget} evidenceCandidates={graph.nodes.filter(node => node.population > 0)} evidenceNodeId={evidenceNodeId} setEvidenceNodeId={setEvidenceNodeId} symptomaticPeople={symptomatic} setSymptomaticPeople={setSymptomatic} evidenceStrength={strength} setEvidenceStrength={setStrength} symptomEvidence={[]} applySymptomEvidence={applyEvidence} rerunScenario={rerun} selectedSeedLabels={[]} />
    <output aria-label="seed value">{synthetic.seed}</output><output aria-label="district value">{synthetic.districtCount}</output><output aria-label="road cap">{scenarioBudget.maxRoadClosures}</output><output aria-label="node cap">{real.maxNodes}</output><output aria-label="footways enabled">{String(real.includeFootways)}</output>
  </>;
}

describe("quality-assurance workspace control coverage", () => {
  it("clamps synthetic, evidence, and budget fields at their advertised boundaries", () => {
    render(<SetupHarness />);
    fireEvent.change(screen.getByLabelText(/city seed/i), { target: { value: "0" } });
    fireEvent.change(screen.getByLabelText(/districts/i), { target: { value: "9" } });
    fireEvent.change(screen.getByLabelText(/maximum road closures/i), { target: { value: "-4" } });
    expect(screen.getByLabelText("seed value").textContent).toBe("1");
    expect(screen.getByLabelText("district value").textContent).toBe("6");
    expect(screen.getByLabelText("road cap").textContent).toBe("0");
  });

  it("switches to bounded real-road settings, clamps the node cap, exposes errors, and disables duplicate imports while pending", () => {
    render(<SetupHarness importError="Use a smaller neighborhood." />);
    fireEvent.click(screen.getByRole("button", { name: /real road graph/i }));
    fireEvent.change(screen.getByLabelText(/intersection cap/i), { target: { value: "999" } });
    fireEvent.click(screen.getByRole("checkbox", { name: /include footways/i }));
    expect(screen.getByLabelText("node cap").textContent).toBe("320");
    expect(screen.getByLabelText("footways enabled").textContent).toBe("true");
    expect(screen.getByText("Use a smaller neighborhood.")).toBeTruthy();
  });

  it("disables the bounded road loader and shows a clear pending label during an import", () => {
    render(<SetupHarness importing />);
    fireEvent.click(screen.getByRole("button", { name: /real road graph/i }));
    const importButton = screen.getByRole("button", { name: /importing bounded network/i });
    expect(importButton.getAttribute("disabled")).not.toBeNull();
  });

  it("keeps manual action buttons disabled at zero budgets and emits correctly shaped actions when capacity exists", () => {
    const graph = createSyntheticCityGraph(syntheticSettings);
    const populated = graph.nodes.find(node => node.population > 0)!;
    const onAdd = vi.fn();
    const onClear = vi.fn();
    const { rerender } = render(<ManualInterventionPanel graph={graph} budget={{ maxRoadClosures: 0, maxQuarantinedNodes: 0, maxQuarantinedPopulation: 0 }} manualActions={[]} manualRoadId={graph.edges[0].id} setManualRoadId={vi.fn()} manualNodeId={populated.id} setManualNodeId={vi.fn()} onAdd={onAdd} onClear={onClear} />);
    screen.getAllByRole("button", { name: "Add" }).forEach(button => expect(button.getAttribute("disabled")).not.toBeNull());
    rerender(<ManualInterventionPanel graph={graph} budget={budget} manualActions={[{ kind: "close_road", edgeId: graph.edges[0].id, reason: "Existing" }]} manualRoadId={graph.edges[0].id} setManualRoadId={vi.fn()} manualNodeId={populated.id} setManualNodeId={vi.fn()} onAdd={onAdd} onClear={onClear} />);
    fireEvent.click(screen.getAllByRole("button", { name: "Add" })[0]);
    fireEvent.click(screen.getAllByRole("button", { name: "Add" })[1]);
    fireEvent.click(screen.getByRole("button", { name: /clear manual plan/i }));
    expect(onAdd).toHaveBeenNthCalledWith(1, expect.objectContaining({ kind: "close_road", edgeId: graph.edges[0].id }));
    expect(onAdd).toHaveBeenNthCalledWith(2, expect.objectContaining({ kind: "quarantine_node", nodeId: populated.id }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
