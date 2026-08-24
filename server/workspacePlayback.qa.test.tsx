// @vitest-environment jsdom
import React, { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TimelineControls } from "../client/src/pages/Home";
import { SensitivityAnalysisPanel } from "../client/src/components/SensitivityAnalysisPanel";
import { createSyntheticCityGraph } from "../shared/epidemicEngine";
import type { EpidemicParameters, InterventionBudget, SyntheticCityConfig } from "../shared/epidemic";

vi.mock("recharts", () => {
  const Container = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  return { ResponsiveContainer: Container, LineChart: Container, CartesianGrid: () => null, Legend: () => null, Line: () => null, Tooltip: () => null, XAxis: () => null, YAxis: () => null };
});

const config: SyntheticCityConfig = { name: "QA City", seed: 73, districtCount: 2, blocksPerDistrict: 2, homesPerBlock: 3, schoolCount: 1, hospitalCount: 1, officeCount: 1, roadDensity: 0.45, minTransmissionProbability: 0.04, maxTransmissionProbability: 0.16 };
const parameters: EpidemicParameters = { transmissionRate: 0.24, recoveryRate: 0.08, mortalityRate: 0.01, days: 14, initialInfectedNodeIds: [], simulationSeed: 73 };
const budget: InterventionBudget = { maxRoadClosures: 3, maxQuarantinedNodes: 2, maxQuarantinedPopulation: 600 };

afterEach(cleanup);

function TimelineHarness() {
  const [day, setDay] = useState(0);
  const [playing, setPlaying] = useState(false);
  return <TimelineControls day={day} setDay={setDay} playing={playing} setPlaying={setPlaying} lastDay={6} />;
}

describe("quality-assurance playback and sensitivity coverage", () => {
  it("keeps timeline navigation inside valid day bounds and pauses on direct navigation", () => {
    render(<TimelineHarness />);
    expect(screen.getByLabelText("Previous simulation day").getAttribute("disabled")).not.toBeNull();
    fireEvent.click(screen.getByLabelText("Next simulation day"));
    expect(screen.getByText(/Day 1/)).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Play simulation timeline"));
    expect(screen.getByLabelText("Pause simulation playback")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Select simulation day"), { target: { value: "6" } });
    expect(screen.getByText(/Day 6/)).toBeTruthy();
    expect(screen.getByLabelText("Next simulation day").getAttribute("disabled")).not.toBeNull();
    expect(screen.getByLabelText("Play simulation timeline")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Restart simulation timeline"));
    expect(screen.getByText(/Day 0/)).toBeTruthy();
  });

  it("switches sensitivity parameters and keeps direct slider adjustment deterministic", () => {
    render(<SensitivityAnalysisPanel graph={createSyntheticCityGraph(config)} parameters={parameters} budget={budget} evidence={[]} />);
    fireEvent.click(screen.getByRole("button", { name: "Recovery rate" }));
    expect(screen.getByText(/Changes the modeled share of infected population/)).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Play sensitivity sweep"));
    expect(screen.getByLabelText("Pause sensitivity sweep")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Sensitivity sweep value"), { target: { value: "6" } });
    expect(screen.getByLabelText("Play sensitivity sweep")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Mortality rate" }));
    expect(screen.getByText(/Changes the modeled fraction of infected population/)).toBeTruthy();
  });
});
