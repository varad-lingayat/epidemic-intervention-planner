import type { CityGraph, EpidemicParameters, InterventionBudget, SymptomEvidence } from "@shared/epidemic";
import { buildSensitivityAnalysis, type SensitivityParameter } from "@shared/sensitivityAnalysis";
import { Pause, Play, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";

const strategyNames = {
  random: "Random", highest_degree: "Highest degree", betweenness_centrality: "Betweenness", dijkstra_blocking: "Dijkstra", max_flow_min_cut: "Min-cut",
};
const colors = { random: "#94a3b8", highest_degree: "#22c55e", betweenness_centrality: "#a855f7", dijkstra_blocking: "#f59e0b", max_flow_min_cut: "#06b6d4" };
const parameterCopy: Record<SensitivityParameter, { label: string; effect: string; practical: string }> = {
  transmissionRate: { label: "Transmission rate", effect: "Raises or lowers the chance that an infectious contact can pass through an available road link during a simulation day.", practical: "Higher values usually make early containment more valuable because infections can cross the network faster." },
  recoveryRate: { label: "Recovery rate", effect: "Changes the modeled share of infected population that leaves the infectious state on each simulation day.", practical: "Higher recovery shortens infectious windows; the chart shows whether that changes which fixed-budget strategy performs best." },
  mortalityRate: { label: "Mortality rate", effect: "Changes the modeled fraction of infected population recorded as deaths rather than recoveries.", practical: "It changes modeled severity rather than graph topology, so use the sweep to inspect how outcome severity affects the fixed-budget strategies." },
};

export function SensitivityAnalysisPanel({ graph, parameters, budget, evidence }: { graph: CityGraph; parameters: EpidemicParameters; budget: InterventionBudget; evidence: SymptomEvidence[] }) {
  const [parameter, setParameter] = useState<SensitivityParameter>("transmissionRate");
  const [activeIndex, setActiveIndex] = useState(3);
  const [playing, setPlaying] = useState(false);
  const data = useMemo(() => buildSensitivityAnalysis({ graph, parameters, budget, evidence, parameter }), [budget, evidence, graph, parameter, parameters]);
  const copy = parameterCopy[parameter];
  const active = data[activeIndex] ?? data[0];

  useEffect(() => { setActiveIndex(3); setPlaying(false); }, [parameter, parameters.transmissionRate, parameters.recoveryRate, parameters.mortalityRate]);
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => setActiveIndex(index => {
      if (index >= data.length - 1) { setPlaying(false); return index; }
      return index + 1;
    }), 680);
    return () => window.clearInterval(timer);
  }, [data.length, playing]);

  const lineData = data.map(point => ({ label: point.label, ...point.strategyFinalInfections }));
  const mortalityData = data.map(point => ({ label: point.label, ...point.strategyModeledDeaths }));
  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 rounded-[1.25rem] border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900/70 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-cyan-700 dark:text-cyan-300"><Sparkles className="h-3.5 w-3.5" /> Controlled sensitivity analysis</div><h2 className="mt-2 text-xl font-bold tracking-tight">How robust is the strategy choice?</h2><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">One assumption changes across seven nearby values. Graph, initial infections, seed, duration, symptom evidence, and intervention budget remain fixed at every point.</p></div>
        <div className="rounded-xl bg-slate-100 p-1 dark:bg-slate-800">{(Object.keys(parameterCopy) as SensitivityParameter[]).map(key => <button key={key} onClick={() => setParameter(key)} className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${parameter === key ? "bg-white text-slate-950 shadow-sm dark:bg-slate-700 dark:text-white" : "text-slate-500 dark:text-slate-400"}`}>{parameterCopy[key].label}</button>)}</div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
        <div className="rounded-[1.25rem] border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900/70"><div className="mb-4"><p className="text-sm font-bold">Final modeled infections by strategy</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Sweep the highlighted value or play the animated sequence to compare the five fixed-budget methods.</p></div><div className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><LineChart data={lineData}><CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.12} /><XAxis dataKey="label" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} />{Object.entries(strategyNames).map(([key, label]) => <Line key={key} type="monotone" dataKey={key} name={label} stroke={colors[key as keyof typeof colors]} strokeWidth={key === active?.winningStrategy ? 3 : 1.8} dot={{ r: 2.5 }} />)}</LineChart></ResponsiveContainer></div></div>
        <aside className="rounded-[1.25rem] border border-cyan-300/20 bg-[linear-gradient(145deg,#ecfeff,#f8fafc)] p-5 dark:bg-[linear-gradient(145deg,rgba(8,47,73,.65),rgba(15,23,42,.75))]"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-300">Active sweep value</p><p className="mt-1 text-3xl font-bold tabular-nums">{active?.label}</p><p className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-200">Winner: {active ? strategyNames[active.winningStrategy] : "—"}</p><div className="mt-5 flex items-center gap-2"><Button size="icon" variant="outline" className="rounded-xl" onClick={() => setPlaying(current => !current)} aria-label={playing ? "Pause sensitivity sweep" : "Play sensitivity sweep"}>{playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</Button><input type="range" aria-label="Sensitivity sweep value" min={0} max={data.length - 1} value={activeIndex} onChange={event => { setActiveIndex(Number(event.target.value)); setPlaying(false); }} className="w-full accent-cyan-600" /></div><div className="mt-5 border-t border-cyan-500/15 pt-4 text-xs leading-5 text-slate-600 dark:text-slate-300"><p className="font-bold text-slate-800 dark:text-white">What this parameter does</p><p className="mt-1">{copy.effect}</p><p className="mt-3 font-bold text-slate-800 dark:text-white">How to read this</p><p className="mt-1">{copy.practical}</p></div></aside>
      </div>
      <div className="rounded-[1.25rem] border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900/70"><div className="mb-4"><p className="text-sm font-bold">Modeled deaths under the same parameter sweep</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Shown separately from the intervention strategy ranking so the effect of each assumption remains visible.</p></div><div className="h-[250px]"><ResponsiveContainer width="100%" height="100%"><LineChart data={mortalityData}><CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.12} /><XAxis dataKey="label" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} />{Object.entries(strategyNames).map(([key, label]) => <Line key={key} type="monotone" dataKey={key} name={label} stroke={colors[key as keyof typeof colors]} strokeWidth={1.8} dot={{ r: 2.5 }} />)}</LineChart></ResponsiveContainer></div></div>
    </section>
  );
}
