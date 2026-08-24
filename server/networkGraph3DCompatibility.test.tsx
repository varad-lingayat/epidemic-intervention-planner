// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { NetworkGraph3D } from "../client/src/components/NetworkGraph3D";
import { createSyntheticCityGraph } from "../shared/epidemicEngine";
import type { SyntheticCityConfig } from "../shared/epidemic";

const settings: SyntheticCityConfig = {
  name: "Fallback QA City",
  seed: 71,
  districtCount: 3,
  blocksPerDistrict: 3,
  homesPerBlock: 7,
  schoolCount: 2,
  hospitalCount: 1,
  officeCount: 3,
  roadDensity: 0.44,
  minTransmissionProbability: 0.04,
  maxTransmissionProbability: 0.16,
};

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

describe("3D network Linux compatibility", () => {
  it("renders the interactive 2D graph rather than a blank canvas when WebGL is unavailable", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    const graph = createSyntheticCityGraph(settings);

    render(<NetworkGraph3D graph={graph} />);

    expect(screen.getByText(/3D graphics fallback active/i)).toBeTruthy();
    expect(screen.getByRole("img", { name: /graph with epidemic status/i })).toBeTruthy();
    expect(screen.getByText(/same interactive graph, states, road closures, and selections/i)).toBeTruthy();
  });
});
