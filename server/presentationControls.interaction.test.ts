// @vitest-environment jsdom
import React, { useState } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Scorecard, WorkspaceResetButton } from "../client/src/pages/Home";
import { createStandardPresentationScenario, createStandardWorkspaceResetState, downloadStrategyComparisonCsv } from "../shared/presentationTools";

describe("presentation finishing controls", () => {
  it("invokes the rendered Reset and CSV scorecard actions", () => {
    const onReset = vi.fn();
    const onExport = vi.fn();
    render(React.createElement("div", {}, React.createElement(WorkspaceResetButton, { onReset }), React.createElement(Scorecard, { comparison: createStandardPresentationScenario().comparison, onExportCsv: onExport })));
    fireEvent.click(screen.getByRole("button", { name: /reset/i }));
    fireEvent.click(screen.getByRole("button", { name: /csv/i }));
    expect(onReset).toHaveBeenCalledTimes(1);
    expect(onExport).toHaveBeenCalledTimes(1);
  });

  it("restores changed workspace state to the standard teaching scenario after the rendered Reset button is clicked", () => {
    function ResetHarness() {
      const [workspace, setWorkspace] = useState({ graphName: "Imported roads", evidenceCount: 2, manualActions: 3, mode: "real" });
      const restoreStandard = () => {
        const standard = createStandardWorkspaceResetState();
        setWorkspace({ graphName: standard.graph.name, evidenceCount: standard.symptomEvidence.length, manualActions: standard.manualActions.length, mode: standard.cityMode });
      };
      return React.createElement("div", {},
        React.createElement(WorkspaceResetButton, { onReset: restoreStandard }),
        React.createElement("output", { "aria-label": "workspace graph" }, workspace.graphName),
        React.createElement("output", { "aria-label": "workspace evidence" }, String(workspace.evidenceCount)),
        React.createElement("output", { "aria-label": "workspace manual actions" }, String(workspace.manualActions)),
        React.createElement("output", { "aria-label": "workspace mode" }, workspace.mode),
      );
    }
    const harness = render(React.createElement(ResetHarness));
    expect(screen.getByLabelText("workspace graph").textContent).toBe("Imported roads");
    fireEvent.click(within(harness.container).getByRole("button", { name: /reset/i }));
    expect(screen.getByLabelText("workspace graph").textContent).toBe("Asterhaven");
    expect(screen.getByLabelText("workspace evidence").textContent).toBe("0");
    expect(screen.getByLabelText("workspace manual actions").textContent).toBe("0");
    expect(screen.getByLabelText("workspace mode").textContent).toBe("synthetic");
  });

  it("creates a CSV download with the requested filename and releases its object URL", () => {
    const createObjectURL = vi.fn(() => "blob:comparison");
    const revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    downloadStrategyComparisonCsv("comparison.csv", createStandardPresentationScenario().comparison, document, { createObjectURL, revokeObjectURL });
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(click).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:comparison");
    click.mockRestore();
  });
});
