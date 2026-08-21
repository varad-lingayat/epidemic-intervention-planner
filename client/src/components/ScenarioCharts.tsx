import type { ScenarioComparison } from "@shared/epidemic";
import React from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const STRATEGY_LABELS: Record<string, string> = {
  random: "Random",
  highest_degree: "Highest degree",
  betweenness_centrality: "Betweenness",
  dijkstra_blocking: "Dijkstra block",
  max_flow_min_cut: "Max-flow min-cut",
};

const STRATEGY_COLORS: Record<string, string> = {
  random: "#94a3b8",
  highest_degree: "#f59e0b",
  betweenness_centrality: "#8b5cf6",
  dijkstra_blocking: "#06b6d4",
  max_flow_min_cut: "#22c55e",
};

export function ScenarioCharts({ comparison }: { comparison: ScenarioComparison }) {
  const dayCount = Math.max(...comparison.outcomes.map(outcome => outcome.timeline.length));
  const infectionSeries = Array.from({ length: dayCount }, (_, index) => {
    const row: Record<string, number> = { day: index };
    comparison.outcomes.forEach(outcome => {
      row[outcome.strategy] = outcome.timeline[index]?.metrics.infected ?? 0;
    });
    return row;
  });
  const outcomeBars = comparison.outcomes.map(outcome => ({
    name: STRATEGY_LABELS[outcome.strategy] ?? outcome.strategy,
    finalInfected: outcome.finalInfectedPopulation,
    deaths: outcome.finalMortalityPopulation,
    recovered: outcome.timeline[outcome.timeline.length - 1]?.metrics.recovered ?? 0,
    fill: STRATEGY_COLORS[outcome.strategy],
  }));

  return (
    <div className="grid gap-4 xl:grid-cols-[1.45fr_0.9fr]">
      <section className="rounded-[1.15rem] border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900/70">
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Temporal comparison</p>
            <h3 className="mt-1 text-base font-semibold">Active infections by day</h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">Shared seed · same budget</span>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={infectionSeries} margin={{ top: 8, right: 10, left: -14, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(148,163,184,.25)", background: "rgba(15,23,42,.94)", color: "#f8fafc" }} />
              {comparison.outcomes.map(outcome => (
                <Line
                  key={outcome.strategy}
                  type="monotone"
                  dataKey={outcome.strategy}
                  name={STRATEGY_LABELS[outcome.strategy] ?? outcome.strategy}
                  stroke={STRATEGY_COLORS[outcome.strategy]}
                  strokeWidth={outcome.strategy === comparison.winningStrategy ? 3 : 1.8}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
      <section className="rounded-[1.15rem] border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900/70">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Outcome comparison</p>
          <h3 className="mt-1 text-base font-semibold">Cumulative outcomes</h3>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={outcomeBars} layout="vertical" margin={{ top: 0, right: 12, left: 28, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={88} tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(148,163,184,.25)", background: "rgba(15,23,42,.94)", color: "#f8fafc" }} />
              <Bar dataKey="finalInfected" name="Cumulative infected" fill="#22c55e" radius={[0, 8, 8, 0]} />
              <Bar dataKey="recovered" name="Recovered" fill="#38bdf8" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
