import { z } from "zod";
import { invokeLLM } from "../_core/llm";
import { protectedProcedure, router } from "../_core/trpc";
import type { ExplanationScenarioSummary } from "../../shared/explanationSummary";
import { buildDecisionExplanationPrompt, fallbackDecisionExplanation } from "../decisionExplanation";

export const explanationRouter = router({
  generate: protectedProcedure
    .input(z.object({ scenarioSummaryJson: z.string().min(2).max(60_000) }))
    .mutation(async ({ input }) => {
      let summary: ExplanationScenarioSummary;
      try {
        summary = JSON.parse(input.scenarioSummaryJson) as ExplanationScenarioSummary;
      } catch {
        throw new Error("The compact scenario summary could not be read.");
      }

      const fallback = fallbackDecisionExplanation(summary);
      try {
        const response = await invokeLLM({
          model: "gpt-5-mini",
          maxTokens: 700,
          messages: [
            {
              role: "system",
              content: "You explain an academic epidemic-network simulation to non-technical decision-makers. Use only the supplied data. Write three concise plain-English paragraphs: (1) what the selected strategy achieved compared with alternatives, (2) why its selected roads/locations and risk indicators matter in this graph, and (3) an explicit limitation. Do not invent facts, real-world impacts, causal claims, or epidemiological certainty. Never describe this as a public-health forecast, medical advice, or an instruction to conduct a real intervention. Clearly call deaths 'modeled deaths' and the output a scenario-model result.",
            },
            { role: "user", content: buildDecisionExplanationPrompt(summary) },
          ],
        });
        const content = response.choices[0]?.message.content;
        const explanation = typeof content === "string" ? content.trim() : "";
        return {
          explanation: explanation || fallback,
          model: response.model,
          usedFallback: !explanation,
        };
      } catch (error) {
        console.warn("[Explanation] Model call failed; returning deterministic fallback", error);
        return { explanation: fallback, model: "deterministic-fallback", usedFallback: true };
      }
    }),
});
