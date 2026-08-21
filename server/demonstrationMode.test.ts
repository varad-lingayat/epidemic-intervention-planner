import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { DemonstrationMode } from "../client/src/components/DemonstrationMode";

describe("Demonstration Mode component", () => {
  it("renders the current teaching case together with load, navigation, and exit controls", () => {
    const markup = renderToStaticMarkup(React.createElement(DemonstrationMode, { activeIndex: 0, isLoading: false, onLoad: vi.fn(), onClose: vi.fn() }));
    expect(markup).toContain("Chance alignment");
    expect(markup).toContain("Load and run this scenario");
    expect(markup).toContain("Previous");
    expect(markup).toContain("Next");
    expect(markup).toContain("Exit demo");
  });
});
