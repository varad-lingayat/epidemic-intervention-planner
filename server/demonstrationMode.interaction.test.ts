/** @vitest-environment jsdom */
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DemonstrationMode } from "../client/src/components/DemonstrationMode";
import { DEMONSTRATION_PRESETS } from "../shared/demoPresets";

describe("Demonstration Mode rendered controls", () => {
  it("invokes the exact callbacks for load, previous, next, and exit actions", () => {
    const onLoad = vi.fn();
    const onClose = vi.fn();
    render(React.createElement(DemonstrationMode, { activeIndex: 0, isLoading: false, onLoad, onClose }));

    fireEvent.click(screen.getByRole("button", { name: "Load and run this scenario" }));
    fireEvent.click(screen.getByRole("button", { name: "Previous" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Exit demo" }));

    expect(onLoad.mock.calls).toEqual([[0], [DEMONSTRATION_PRESETS.length - 1], [1]]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
