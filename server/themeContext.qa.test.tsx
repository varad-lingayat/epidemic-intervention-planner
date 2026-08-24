// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider, useTheme } from "../client/src/contexts/ThemeContext";

function ThemeHarness() {
  const { theme, toggleTheme } = useTheme();
  return <>
    <output aria-label="active theme">{theme}</output>
    <button onClick={toggleTheme}>Toggle theme</button>
  </>;
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("dark");
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  document.documentElement.classList.remove("dark");
});

describe("quality-assurance global theme coverage", () => {
  it("restores a stored dark theme, toggles to light, persists the new choice, and removes the document dark class", () => {
    localStorage.setItem("theme", "dark");
    render(<ThemeProvider defaultTheme="light" switchable><ThemeHarness /></ThemeProvider>);

    expect(screen.getByLabelText("active theme").textContent).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: /toggle theme/i }));

    expect(screen.getByLabelText("active theme").textContent).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(localStorage.getItem("theme")).toBe("light");
  });
});
