import React from "react";
import { Activity, BrainCircuit, FileText, Network, Settings2, Target } from "lucide-react";
import type { InterventionAction, ScenarioReportPayload } from "@shared/epidemic";
import { NetworkGraph } from "./NetworkGraph";
import { ScenarioCharts } from "./ScenarioCharts";

const strategyLabels = {
  random: "Random selection",
  highest_degree: "Highest degree",
  betweenness_centrality: "Betweenness centrality",
  dijkstra_blocking: "Dijkstra blocking",
  max_flow_min_cut: "Max-flow min-cut",
} as const;

type ScenarioReportPreviewProps = {
  id: string;
  payload: ScenarioReportPayload;
  title?: string;
};

function actionTargetLabel(action: InterventionAction, payload: ScenarioReportPayload) {
  if (action.kind === "close_road") return payload.comparison.graph.edges.find(edge => edge.id === action.edgeId)?.label ?? action.edgeId;
  if (action.kind === "isolate_block") return `Block ${action.blockId} (${action.nodeIds.length} locations)`;
  return payload.comparison.graph.nodes.find(node => node.id === action.nodeId)?.label ?? action.nodeId;
}

function actionLabel(action: InterventionAction) {
  if (action.kind === "close_road") return "Close road";
  if (action.kind === "isolate_block") return "Isolate block";
  return "Quarantine building";
}

export function ScenarioReportPreview({ id, payload, title }: ScenarioReportPreviewProps) {
  const { comparison, recommendations, plainEnglishExplanation } = payload;
  const winner = comparison.outcomes.find(outcome => outcome.strategy === comparison.winningStrategy) ?? comparison.outcomes[0];
  const finalSnapshot = winner?.timeline[winner.timeline.length - 1];
  const initialLocations = comparison.fairness.initialInfectedNodeIds
    .map(nodeId => comparison.graph.nodes.find(node => node.id === nodeId)?.label ?? nodeId)
    .join(", ");

  return (
    <section id={id} className="overflow-hidden rounded-[1.35rem] border border-slate-200 bg-white p-5 text-slate-900 shadow-sm dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 sm:p-7">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 dark:border-white/10 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.17em] text-cyan-700 dark:text-cyan-300"><FileText className="h-3.5 w-3.5" /> Scenario report</div>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">{title ?? comparison.title}</h2>
          <p className="mt-2 max-w-3xl text-xs leading-5 text-slate-600 dark:text-slate-300">Academic scenario-model result. Every strategy used the same graph, outbreak assumptions, initial infections, random seed, duration, and intervention budget.</p>
        </div>
        <div className="rounded-xl bg-emerald-500/10 px-3 py-2 text-right text-xs font-semibold text-emerald-800 dark:text-emerald-200">
          Selected strategy<br /><span className="text-sm">{winner ? strategyLabels[winner.strategy] : "Unavailable"}</span>
        </div>
      </div>

      {winner ? <div className="mt-5 grid gap-3 sm:grid-cols-4"><ReportMetric label="Final infections" value={winner.finalInfectedPopulation.toLocaleString()} /><ReportMetric label="Modeled deaths" value={winner.finalMortalityPopulation.toLocaleString()} /><ReportMetric label="Peak infections" value={`${winner.peakInfected.toLocaleString()} · day ${winner.peakInfectedDay}`} /><ReportMetric label="Containment" value={`${Math.round(winner.containmentRate * 100)}%`} /></div> : null}

      <div data-report-section="scenario-configuration" className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900">
        <div className="flex items-center gap-2 text-xs font-semibold"><Settings2 className="h-4 w-4 text-cyan-600" /> Scenario configuration and fairness controls</div>
        <dl className="mt-3 grid gap-x-5 gap-y-3 text-xs sm:grid-cols-2 xl:grid-cols-4">
          <ReportDetail label="Graph" value={`${comparison.graph.name} · ${comparison.graph.source === "openstreetmap" ? "bounded OpenStreetMap import" : "synthetic city"}`} />
          <ReportDetail label="Model horizon" value={`${comparison.fairness.epidemicParameters.days} days · seed ${comparison.fairness.randomSeed}`} />
          <ReportDetail label="Rates" value={`Transmission ${(comparison.fairness.epidemicParameters.transmissionRate * 100).toFixed(1)}% · recovery ${(comparison.fairness.epidemicParameters.recoveryRate * 100).toFixed(1)}% · mortality ${(comparison.fairness.epidemicParameters.mortalityRate * 100).toFixed(1)}%`} />
          <ReportDetail label="Intervention budget" value={`${comparison.fairness.interventionBudget.maxRoadClosures} roads · ${comparison.fairness.interventionBudget.maxQuarantinedNodes} locations · ${comparison.fairness.interventionBudget.maxQuarantinedPopulation.toLocaleString()} people`} />
        </dl>
        <p className="mt-3 text-[11px] leading-5 text-slate-600 dark:text-slate-300">Initial infection locations: {initialLocations || "None selected"}. All five strategies used these identical starting conditions.</p>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,.9fr)]">
        <div data-report-section="graph-snapshot" className="min-h-[330px] rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-900"><div className="mb-2 flex items-center gap-2 text-xs font-semibold"><Network className="h-4 w-4 text-cyan-600" /> Final graph snapshot and intervention points</div><div className="h-[285px]"><NetworkGraph graph={comparison.graph} snapshot={finalSnapshot} actions={winner?.actions} initialInfectedNodeIds={comparison.fairness.initialInfectedNodeIds} /></div></div>
        <div data-report-section="plain-english-explanation" className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900"><div className="flex items-center gap-2 text-xs font-semibold"><BrainCircuit className="h-4 w-4 text-violet-600" /> Plain-English interpretation</div><p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700 dark:text-slate-200">{plainEnglishExplanation ?? "Generate an explanation from the dashboard before exporting or sharing this report."}</p></div>
      </div>

      <div data-report-section="selected-interventions" className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold"><Target className="h-4 w-4 text-orange-600" /> Selected intervention actions</div>
        {winner?.actions.length ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{winner.actions.map((action, index) => <article key={`${action.kind}-${index}`} className="rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-950/35"><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-orange-700 dark:text-orange-300">{actionLabel(action)}</p><h3 className="mt-1 text-sm font-bold">{actionTargetLabel(action, payload)}</h3><p className="mt-2 text-[11px] leading-5 text-slate-600 dark:text-slate-300">{action.reason}</p></article>)}</div> : <p className="text-xs text-slate-500 dark:text-slate-400">No intervention action was selected within the current budget.</p>}
      </div>

      <div data-report-section="comparison-charts" className="mt-6"><ScenarioCharts comparison={comparison} /></div>

      <div data-report-section="recommendations" className="mt-6"><div className="mb-3 flex items-center gap-2 text-xs font-semibold"><Target className="h-4 w-4 text-emerald-600" /> Prioritized model recommendations</div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{recommendations.slice(0, 6).map(recommendation => <article key={`${recommendation.targetId}-${recommendation.priority}`} className="rounded-xl border border-slate-200 p-3.5 dark:border-white/10"><div className="flex items-center justify-between gap-2"><span className="text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-700 dark:text-emerald-300">Priority {recommendation.priority} · {recommendation.action.replaceAll("_", " ")}</span><span className="text-[10px] font-semibold text-slate-500">{recommendation.budgetCost}</span></div><h3 className="mt-2 text-sm font-bold">{recommendation.targetLabel}</h3><p className="mt-2 text-[11px] leading-5 text-slate-600 dark:text-slate-300">{recommendation.rationale}</p><p className="mt-2 text-[11px] leading-5 text-slate-500 dark:text-slate-400"><span className="font-semibold">Expected impact:</span> {recommendation.expectedImpact}</p></article>)}</div></div>

      <div className="mt-6 flex items-start gap-2 border-t border-slate-200 pt-4 text-[11px] leading-5 text-slate-500 dark:border-white/10 dark:text-slate-400"><Activity className="mt-0.5 h-3.5 w-3.5 shrink-0" /> <span>{comparison.disclaimer}</span></div>
    </section>
  );
}

function ReportMetric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-900"><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">{label}</p><p className="mt-1 text-lg font-bold tabular-nums">{value}</p></div>;
}

function ReportDetail({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">{label}</dt><dd className="mt-1 leading-5 text-slate-700 dark:text-slate-200">{value}</dd></div>;
}
