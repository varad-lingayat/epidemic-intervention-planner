import fs from "fs/promises";
import path from "path";
import type {
  InsertScenario,
  InsertScenarioReport,
  Scenario,
  ScenarioReport,
} from "../drizzle/schema";

type DesktopStore = {
  scenarios: Scenario[];
  reports: ScenarioReport[];
};

let cachedStore: DesktopStore | null = null;

export function isDesktopStoreEnabled() {
  return process.env.EPIGRAPH_DESKTOP_MODE === "true";
}

function desktopDataFile() {
  const directory = process.env.EPIGRAPH_LOCAL_DATA_DIR ?? path.join(process.cwd(), ".epigraph-local");
  return path.join(directory, "scenario-store.json");
}

function restoreDates<T extends { createdAt: Date; updatedAt: Date }>(record: T): T {
  return {
    ...record,
    createdAt: new Date(record.createdAt),
    updatedAt: new Date(record.updatedAt),
  };
}

async function loadStore(): Promise<DesktopStore> {
  if (cachedStore) return cachedStore;

  try {
    const data = await fs.readFile(desktopDataFile(), "utf-8");
    const parsed = JSON.parse(data) as DesktopStore;
    cachedStore = {
      scenarios: (parsed.scenarios ?? []).map(restoreDates),
      reports: (parsed.reports ?? []).map(restoreDates),
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      console.warn("[Desktop store] Using a new local store because the existing file could not be read.");
    }
    cachedStore = { scenarios: [], reports: [] };
  }

  return cachedStore;
}

async function persistStore(store: DesktopStore) {
  const file = desktopDataFile();
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(`${file}.tmp`, JSON.stringify(store, null, 2), "utf-8");
  await fs.rename(`${file}.tmp`, file);
}

export async function createLocalScenario(input: InsertScenario): Promise<Scenario> {
  const store = await loadStore();
  const now = new Date();
  const scenario: Scenario = {
    id: input.id,
    ownerId: input.ownerId,
    title: input.title,
    graphSource: input.graphSource,
    cityName: input.cityName ?? null,
    configurationJson: input.configurationJson,
    comparisonJson: input.comparisonJson ?? null,
    createdAt: now,
    updatedAt: now,
  };
  store.scenarios.push(scenario);
  await persistStore(store);
  return scenario;
}

export async function updateLocalScenarioComparison(
  scenarioId: string,
  ownerId: number,
  comparisonJson: string,
) {
  const store = await loadStore();
  const scenario = store.scenarios.find(item => item.id === scenarioId && item.ownerId === ownerId);
  if (!scenario) return false;
  scenario.comparisonJson = comparisonJson;
  scenario.updatedAt = new Date();
  await persistStore(store);
  return true;
}

export async function listLocalScenarios(ownerId: number) {
  const store = await loadStore();
  return store.scenarios
    .filter(item => item.ownerId === ownerId)
    .sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime());
}

export async function getLocalScenario(scenarioId: string, ownerId: number) {
  const store = await loadStore();
  return store.scenarios.find(item => item.id === scenarioId && item.ownerId === ownerId);
}

export async function createLocalScenarioReport(input: InsertScenarioReport): Promise<ScenarioReport> {
  const store = await loadStore();
  const now = new Date();
  const report: ScenarioReport = {
    id: input.id,
    scenarioId: input.scenarioId,
    ownerId: input.ownerId,
    shareId: input.shareId,
    title: input.title,
    reportJson: input.reportJson,
    plainEnglishExplanation: input.plainEnglishExplanation ?? null,
    createdAt: now,
    updatedAt: now,
  };
  store.reports.push(report);
  await persistStore(store);
  return report;
}

export async function getLocalScenarioReport(reportId: string, ownerId: number) {
  const store = await loadStore();
  return store.reports.find(item => item.id === reportId && item.ownerId === ownerId);
}

export async function getLocalScenarioReportByShareId(shareId: string) {
  const store = await loadStore();
  return store.reports.find(item => item.shareId === shareId);
}

export function resetDesktopLocalStoreForTests() {
  cachedStore = null;
}
