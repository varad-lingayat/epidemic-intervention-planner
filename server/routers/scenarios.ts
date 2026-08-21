import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import {
  createScenario,
  createScenarioReport,
  getScenarioForOwner,
  getScenarioReportByShareId,
  listScenariosForOwner,
  updateScenarioComparison,
} from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

const graphSourceSchema = z.enum(["synthetic", "openstreetmap"]);

export const scenarioRouter = router({
  list: protectedProcedure.query(({ ctx }) => listScenariosForOwner(ctx.user.id)),

  get: protectedProcedure
    .input(z.object({ scenarioId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const scenario = await getScenarioForOwner(input.scenarioId, ctx.user.id);
      if (!scenario) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Scenario not found" });
      }
      return scenario;
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().trim().min(1).max(160),
        graphSource: graphSourceSchema,
        cityName: z.string().trim().max(160).optional(),
        configurationJson: z.string().min(2),
        comparisonJson: z.string().min(2).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const scenario = {
        id: nanoid(16),
        ownerId: ctx.user.id,
        title: input.title,
        graphSource: input.graphSource,
        cityName: input.cityName ?? null,
        configurationJson: input.configurationJson,
        comparisonJson: input.comparisonJson ?? null,
      };
      await createScenario(scenario);
      return scenario;
    }),

  saveComparison: protectedProcedure
    .input(
      z.object({
        scenarioId: z.string().min(1),
        comparisonJson: z.string().min(2),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const scenario = await getScenarioForOwner(input.scenarioId, ctx.user.id);
      if (!scenario) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Scenario not found" });
      }
      await updateScenarioComparison(input.scenarioId, ctx.user.id, input.comparisonJson);
      return { success: true } as const;
    }),

  createReport: protectedProcedure
    .input(
      z.object({
        scenarioId: z.string().min(1),
        title: z.string().trim().min(1).max(160),
        reportJson: z.string().min(2),
        plainEnglishExplanation: z.string().trim().min(1).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const scenario = await getScenarioForOwner(input.scenarioId, ctx.user.id);
      if (!scenario) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Scenario not found" });
      }

      const report = {
        id: nanoid(16),
        scenarioId: input.scenarioId,
        ownerId: ctx.user.id,
        shareId: nanoid(12),
        title: input.title,
        reportJson: input.reportJson,
        plainEnglishExplanation: input.plainEnglishExplanation ?? null,
      };
      await createScenarioReport(report);
      return { ...report, sharePath: `/share/${report.shareId}` };
    }),
});

export const publicReportRouter = router({
  byShareId: publicProcedure
    .input(z.object({ shareId: z.string().min(1) }))
    .query(async ({ input }) => {
      const report = await getScenarioReportByShareId(input.shareId);
      if (!report) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Shared report not found" });
      }
      return report;
    }),
});
