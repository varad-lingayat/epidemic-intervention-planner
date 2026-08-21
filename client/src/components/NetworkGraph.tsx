import type { CityGraph, EpidemicState, InterventionAction, SimulationSnapshot } from "@shared/epidemic";
import React, { useMemo, useRef, useState } from "react";

const stateColors: Record<EpidemicState, string> = {
  susceptible: "#a8b6c9",
  infected: "#fb7185",
  recovered: "#38bdf8",
  deceased: "#64748b",
  quarantined: "#c084fc",
};

function facilityTag(facilityType: string) {
  if (facilityType === "school") return "S";
  if (facilityType === "hospital") return "+";
  if (facilityType === "office") return "O";
  if (facilityType === "block") return "B";
  if (facilityType === "home") return "H";
  return "";
}

type NetworkGraphProps = {
  graph: CityGraph;
  snapshot?: SimulationSnapshot;
  actions?: InterventionAction[];
  initialInfectedNodeIds?: string[];
  onNodeClick?: (nodeId: string) => void;
  isLoading?: boolean;
  errorMessage?: string;
};

export function NetworkGraph({
  graph,
  snapshot,
  actions = [],
  initialInfectedNodeIds = [],
  onNodeClick,
  isLoading = false,
  errorMessage,
}: NetworkGraphProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; pan: { x: number; y: number } } | null>(null);

  const geometry = useMemo(() => {
    const nodeMap = new Map(graph.nodes.map(node => [node.id, node]));
    const points = graph.nodes.map(node => node.position);
    if (!points.length) {
      return {
        nodeMap,
        minX: 0,
        minY: 0,
        fullSpan: 100,
        radius: 3,
        closedRoadIds: new Set<string>(),
        quarantinedNodeIds: new Set<string>(),
      };
    }
    const minX = Math.min(...points.map(point => point.x));
    const maxX = Math.max(...points.map(point => point.x));
    const minY = Math.min(...points.map(point => point.y));
    const maxY = Math.max(...points.map(point => point.y));
    const span = Math.max(maxX - minX, maxY - minY, 40);
    const padding = span * 0.12;
    return {
      nodeMap,
      minX: minX - padding,
      minY: minY - padding,
      fullSpan: span + padding * 2,
      radius: Math.max(2.5, span * 0.018),
      closedRoadIds: new Set(actions.filter(action => action.kind === "close_road").map(action => action.edgeId)),
      quarantinedNodeIds: new Set(
        actions.flatMap(action =>
          action.kind === "quarantine_node" ? [action.nodeId] : action.kind === "isolate_block" ? action.nodeIds : [],
        ),
      ),
    };
  }, [actions, graph]);

  const visibleSpan = geometry.fullSpan / zoom;
  const viewBox = `${geometry.minX + (geometry.fullSpan - visibleSpan) / 2 + pan.x} ${geometry.minY + (geometry.fullSpan - visibleSpan) / 2 + pan.y} ${visibleSpan} ${visibleSpan}`;
  const selectedNode = selectedNodeId ? geometry.nodeMap.get(selectedNodeId) : undefined;
  const selectedState = selectedNode ? snapshot?.nodeStates[selectedNode.id] : undefined;
  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  if (!graph.nodes.length) {
    return <div className="grid min-h-[420px] place-items-center rounded-[1.35rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500 dark:border-white/15 dark:bg-slate-900/45 dark:text-slate-300">Generate a synthetic city or load a bounded real road graph to begin the scenario.</div>;
  }

  return (
    <div className="relative h-full min-h-[420px] overflow-hidden rounded-[1.35rem] border border-slate-200 bg-[radial-gradient(circle_at_50%_40%,#f8fbff_0%,#eef4fb_45%,#e6edf7_100%)] p-3 dark:border-white/10 dark:bg-[radial-gradient(circle_at_50%_40%,#172a46_0%,#111d31_52%,#0b1324_100%)]">
      <div className="pointer-events-none absolute inset-0 opacity-[0.24] [background-image:linear-gradient(rgba(79,112,156,0.22)_1px,transparent_1px),linear-gradient(90deg,rgba(79,112,156,0.22)_1px,transparent_1px)] [background-size:28px_28px] dark:opacity-[0.12]" />
      {isLoading ? <div className="absolute inset-0 z-20 grid place-items-center bg-slate-950/45 p-6 text-center text-sm font-semibold text-white backdrop-blur-sm" role="status" aria-live="polite"><div><span className="mx-auto mb-3 block h-7 w-7 animate-spin rounded-full border-2 border-white/30 border-t-cyan-300" />Loading and normalizing the bounded road network…</div></div> : null}
      {errorMessage ? <div className="absolute left-4 right-4 top-4 z-20 rounded-xl border border-rose-400/35 bg-rose-950/85 px-3 py-2.5 text-xs leading-5 text-rose-50 shadow-lg backdrop-blur" role="alert"><span className="font-bold">Road-network import could not complete.</span> {errorMessage}</div> : null}
      <svg
        className="relative h-full w-full touch-none"
        viewBox={viewBox}
        role="img"
        aria-label={`${graph.name} graph with epidemic status by location. Drag to pan; use the controls to zoom.`}
        onPointerDown={event => {
          dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, pan };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={event => {
          const drag = dragRef.current;
          if (!drag || drag.pointerId !== event.pointerId) return;
          const rect = event.currentTarget.getBoundingClientRect();
          setPan({
            x: drag.pan.x - ((event.clientX - drag.startX) / rect.width) * visibleSpan,
            y: drag.pan.y - ((event.clientY - drag.startY) / rect.height) * visibleSpan,
          });
        }}
        onPointerUp={() => { dragRef.current = null; }}
        onPointerCancel={() => { dragRef.current = null; }}
      >
        <defs>
          <filter id="node-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {graph.edges.map(edge => {
          const source = geometry.nodeMap.get(edge.source);
          const target = geometry.nodeMap.get(edge.target);
          if (!source || !target) return null;
          const closed = geometry.closedRoadIds.has(edge.id);
          const active = hoveredEdgeId === edge.id;
          return (
            <line
              key={edge.id}
              x1={source.position.x}
              y1={source.position.y}
              x2={target.position.x}
              y2={target.position.y}
              stroke={closed ? "#f97316" : active ? "#22d3ee" : edge.roadClass === "primary" ? "#547499" : "#8fa7c3"}
              strokeOpacity={closed ? 0.9 : active ? 0.95 : 0.54}
              strokeWidth={closed || active ? geometry.radius * 0.52 : Math.max(0.65, geometry.radius * 0.23)}
              strokeDasharray={closed ? `${geometry.radius * 0.8} ${geometry.radius * 0.5}` : undefined}
              className="transition-all duration-200"
              onMouseEnter={() => setHoveredEdgeId(edge.id)}
              onMouseLeave={() => setHoveredEdgeId(null)}
            >
              <title>{`${edge.label ?? edge.id} · daily transmission weight ${(edge.transmissionProbability * 100).toFixed(1)}%`}</title>
            </line>
          );
        })}
        {graph.nodes.map(node => {
          const nodeState = snapshot?.nodeStates[node.id];
          const quarantined = geometry.quarantinedNodeIds.has(node.id) || nodeState?.state === "quarantined";
          const color = stateColors[quarantined ? "quarantined" : nodeState?.state ?? "susceptible"];
          const isInitial = initialInfectedNodeIds.includes(node.id);
          const selected = selectedNodeId === node.id;
          const size = node.population > 0 ? geometry.radius : geometry.radius * 0.58;
          const tag = facilityTag(node.facilityType);
          return (
            <g
              key={node.id}
              className={onNodeClick && node.population > 0 ? "cursor-pointer" : undefined}
              role={onNodeClick && node.population > 0 ? "button" : undefined}
              tabIndex={onNodeClick && node.population > 0 ? 0 : undefined}
              aria-label={onNodeClick && node.population > 0 ? `${node.label}, ${initialInfectedNodeIds.includes(node.id) ? "selected as" : "select as"} an initial infection location` : undefined}
              onPointerDown={event => event.stopPropagation()}
              onClick={() => {
                if (node.population <= 0) return;
                setSelectedNodeId(node.id);
                onNodeClick?.(node.id);
              }}
              onKeyDown={event => {
                if (node.population <= 0 || !onNodeClick || (event.key !== "Enter" && event.key !== " ")) return;
                event.preventDefault();
                setSelectedNodeId(node.id);
                onNodeClick(node.id);
              }}
            >
              {nodeState?.state === "infected" ? <circle cx={node.position.x} cy={node.position.y} r={size * 2.2} fill={color} opacity="0.14" filter="url(#node-glow)" /> : null}
              {selected ? <circle cx={node.position.x} cy={node.position.y} r={size * 1.75} fill="none" stroke="#22d3ee" strokeWidth={Math.max(0.9, geometry.radius * 0.2)} strokeDasharray={`${geometry.radius * 0.42} ${geometry.radius * 0.3}`} /> : null}
              <circle
                cx={node.position.x}
                cy={node.position.y}
                r={size}
                fill={color}
                stroke={isInitial ? "#fbbf24" : "#ffffff"}
                strokeWidth={isInitial ? Math.max(1.6, geometry.radius * 0.32) : Math.max(0.65, geometry.radius * 0.12)}
                className="transition-all duration-300"
              >
                <title>{`${node.label}: ${nodeState?.state ?? "susceptible"}${node.population ? `, modeled population ${node.population}` : ""}`}</title>
              </circle>
              {tag && node.population > 0 ? <text x={node.position.x} y={node.position.y} dy="0.34em" textAnchor="middle" fontSize={Math.max(2.5, size * 0.95)} fontWeight="800" fill="#0f172a" pointerEvents="none">{tag}</text> : null}
            </g>
          );
        })}
      </svg>

      <div className="absolute right-4 top-4 flex items-center gap-1 rounded-xl border border-slate-200/70 bg-white/85 p-1 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/75">
        <button type="button" aria-label="Zoom in" onClick={() => setZoom(current => Math.min(2.6, Number((current + 0.2).toFixed(1))))} className="grid h-7 w-7 place-items-center rounded-lg text-sm font-bold text-slate-700 transition hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-white/10">+</button>
        <button type="button" aria-label="Zoom out" onClick={() => setZoom(current => Math.max(1, Number((current - 0.2).toFixed(1))))} className="grid h-7 w-7 place-items-center rounded-lg text-sm font-bold text-slate-700 transition hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-white/10">−</button>
        <button type="button" onClick={resetView} className="rounded-lg px-2 py-1 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10">Reset</button>
      </div>

      {selectedNode ? (
        <div className="absolute left-4 top-4 max-w-[240px] rounded-xl border border-cyan-500/20 bg-slate-950/82 px-3 py-2.5 text-[10px] leading-4 text-slate-100 shadow-lg backdrop-blur">
          <p className="font-semibold text-cyan-200">{selectedNode.label}</p>
          <p className="capitalize text-slate-300">{selectedNode.facilityType.replaceAll("_", " ")} · modeled population {selectedNode.population}</p>
          <p className="mt-1 text-slate-400">Day {snapshot?.day ?? 0}: {selectedState?.state ?? "susceptible"}{selectedState ? ` · ${selectedState.counts.infected} active modeled infections` : ""}</p>
        </div>
      ) : null}

      <div className="absolute bottom-4 left-4 flex flex-wrap gap-2 rounded-xl border border-slate-200/70 bg-white/80 px-3 py-2 text-[10px] font-medium text-slate-600 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/70 dark:text-slate-300">
        {(["susceptible", "infected", "recovered", "quarantined"] as EpidemicState[]).map(state => <span className="inline-flex items-center gap-1.5" key={state}><i className="h-2 w-2 rounded-full" style={{ backgroundColor: stateColors[state] }} />{state}</span>)}
        <span className="inline-flex items-center gap-1.5"><i className="h-0.5 w-3 bg-orange-400" /> closed road</span>
        <span className="hidden items-center gap-1 text-slate-400 lg:inline-flex"><b className="text-slate-200">H/S/+/O/B</b> home · school · hospital · office · block</span>
        <span className="hidden text-slate-400 sm:inline">Hover a road for its weight · drag to pan</span>
      </div>
      {graph.source === "openstreetmap" ? <p className="absolute bottom-4 right-4 max-w-[230px] rounded-lg bg-slate-950/65 px-2.5 py-1.5 text-right text-[10px] leading-4 text-slate-100 shadow-sm backdrop-blur">Real road geometry; location populations are labeled simulation proxies.</p> : null}
    </div>
  );
}
