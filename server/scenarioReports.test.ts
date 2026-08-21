import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const databaseMocks = vi.hoisted(() => ({
  createScenarioReport: vi.fn(),
  getScenarioForOwner: vi.fn(),
  getScenarioReportByShareId: vi.fn(),
}));

vi.mock("./db", () => ({
  createScenarioReport: databaseMocks.createScenarioReport,
  getScenarioForOwner: databaseMocks.getScenarioForOwner,
  getScenarioReportByShareId: databaseMocks.getScenarioReportByShareId,
}));

import { publicReportRouter, scenarioRouter } from "./routers/scenarios";

function authenticatedContext(): TrpcContext {
  return {
    user: {
      id: 7,
      openId: "report-owner",
      name: "Report Owner",
      email: "owner@example.test",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("scenario report sharing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    databaseMocks.getScenarioForOwner.mockResolvedValue({ id: "scenario-1", ownerId: 7 });
    databaseMocks.createScenarioReport.mockImplementation(async report => report);
  });

  it("creates an owner-bound persistent report and returns a public share path", async () => {
    const caller = scenarioRouter.createCaller(authenticatedContext());
    const result = await caller.createReport({
      scenarioId: "scenario-1",
      title: "Fitzrovia intervention comparison",
      reportJson: JSON.stringify({ graphId: "synthetic-1", outcomes: [] }),
      plainEnglishExplanation: "The scenario model ranks the selected graph intervention first.",
    });

    expect(databaseMocks.getScenarioForOwner).toHaveBeenCalledWith("scenario-1", 7);
    expect(databaseMocks.createScenarioReport).toHaveBeenCalledWith(
      expect.objectContaining({
        scenarioId: "scenario-1",
        ownerId: 7,
        title: "Fitzrovia intervention comparison",
        plainEnglishExplanation: "The scenario model ranks the selected graph intervention first.",
      }),
    );
    expect(result.sharePath).toMatch(/^\/share\/[A-Za-z0-9_-]{12}$/);
  });

  it("retrieves an existing report through its public share identifier", async () => {
    const report = {
      id: "report-1",
      scenarioId: "scenario-1",
      ownerId: 7,
      shareId: "publicReport1",
      title: "Shared scenario",
      reportJson: "{}",
      plainEnglishExplanation: "Model output only.",
    };
    databaseMocks.getScenarioReportByShareId.mockResolvedValue(report);

    const caller = publicReportRouter.createCaller({ user: null } as TrpcContext);
    await expect(caller.byShareId({ shareId: "publicReport1" })).resolves.toEqual(report);
    expect(databaseMocks.getScenarioReportByShareId).toHaveBeenCalledWith("publicReport1");
  });
});
