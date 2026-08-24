import fs from "fs/promises";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createLocalScenario,
  createLocalScenarioReport,
  getLocalScenarioReportByShareId,
  isDesktopStoreEnabled,
  listLocalScenarios,
  resetDesktopLocalStoreForTests,
  updateLocalScenarioComparison,
} from "./desktopLocalStore";

const originalMode = process.env.EPIGRAPH_DESKTOP_MODE;
const originalDirectory = process.env.EPIGRAPH_LOCAL_DATA_DIR;
let temporaryDirectory = "";

beforeEach(async () => {
  temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "epigraph-desktop-store-"));
  process.env.EPIGRAPH_DESKTOP_MODE = "true";
  process.env.EPIGRAPH_LOCAL_DATA_DIR = temporaryDirectory;
  resetDesktopLocalStoreForTests();
});

afterEach(async () => {
  resetDesktopLocalStoreForTests();
  if (temporaryDirectory) await fs.rm(temporaryDirectory, { recursive: true, force: true });
  if (originalMode === undefined) delete process.env.EPIGRAPH_DESKTOP_MODE;
  else process.env.EPIGRAPH_DESKTOP_MODE = originalMode;
  if (originalDirectory === undefined) delete process.env.EPIGRAPH_LOCAL_DATA_DIR;
  else process.env.EPIGRAPH_LOCAL_DATA_DIR = originalDirectory;
});

describe("desktopLocalStore", () => {
  it("keeps desktop scenarios and reports locally without a cloud database", async () => {
    expect(isDesktopStoreEnabled()).toBe(true);

    await createLocalScenario({
      id: "desktop-scenario",
      ownerId: 0,
      title: "Portable teaching scenario",
      graphSource: "synthetic",
      cityName: null,
      configurationJson: "{}",
      comparisonJson: null,
    });
    await updateLocalScenarioComparison("desktop-scenario", 0, '{"winner":"Dijkstra"}');

    await createLocalScenarioReport({
      id: "desktop-report",
      scenarioId: "desktop-scenario",
      ownerId: 0,
      shareId: "local-share",
      title: "Portable report",
      reportJson: "{}",
      plainEnglishExplanation: "Stored locally for the desktop package.",
    });

    const scenarios = await listLocalScenarios(0);
    const report = await getLocalScenarioReportByShareId("local-share");

    expect(scenarios).toHaveLength(1);
    expect(scenarios[0]?.comparisonJson).toContain("Dijkstra");
    expect(report?.title).toBe("Portable report");
    expect(report?.createdAt).toBeInstanceOf(Date);
  });
});
