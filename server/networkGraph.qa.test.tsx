// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NetworkGraph } from "../client/src/components/NetworkGraph";
import { createSyntheticCityGraph } from "../shared/epidemicEngine";
import type { SyntheticCityConfig } from "../shared/epidemic";

const settings: SyntheticCityConfig = { name: "Graph QA City", seed: 53, districtCount: 3, blocksPerDistrict: 3, homesPerBlock: 8, schoolCount: 2, hospitalCount: 1, officeCount: 3, roadDensity: 0.45, minTransmissionProbability: 0.04, maxTransmissionProbability: 0.16 };

beforeEach(() => {
  Object.defineProperty(SVGElement.prototype, "setPointerCapture", { configurable: true, value: () => undefined });
});

afterEach(cleanup);

describe("quality-assurance 2D graph interaction coverage", () => {
  it("supports zoom, drag pan, reset, and populated-node selection without losing the graph state", () => {
    const graph = createSyntheticCityGraph(settings);
    const selectable = graph.nodes.find(node => node.population > 0)!;
    const onNodeClick = vi.fn();
    render(<NetworkGraph graph={graph} onNodeClick={onNodeClick} />);

    const svg = screen.getByRole("img", { name: /graph with epidemic status/i }) as unknown as SVGSVGElement;
    Object.defineProperty(svg, "getBoundingClientRect", { configurable: true, value: () => ({ width: 400, height: 400 }) });
    const initialView = svg.getAttribute("viewBox");

    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    expect(svg.getAttribute("viewBox")).not.toBe(initialView);

    fireEvent.pointerDown(svg, { pointerId: 1, clientX: 30, clientY: 30 });
    fireEvent.pointerMove(svg, { pointerId: 1, clientX: 90, clientY: 60 });
    fireEvent.pointerUp(svg, { pointerId: 1 });
    expect(svg.getAttribute("viewBox")).not.toBe(initialView);

    fireEvent.click(screen.getByRole("button", { name: new RegExp(selectable.label, "i") }));
    expect(onNodeClick).toHaveBeenCalledWith(selectable.id);
    expect(screen.getByText(selectable.label)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(svg.getAttribute("viewBox")).toBe(initialView);
  });
});
