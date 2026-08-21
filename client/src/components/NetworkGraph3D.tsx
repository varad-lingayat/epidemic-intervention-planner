import type { CityGraph, CityNode, EpidemicState, InterventionAction, SimulationSnapshot } from "@shared/epidemic";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { useMemo, useRef, useState } from "react";
import { facilityRoofColor, getBuildingProfile, type BuildingProfile } from "./networkGraph3DModel";

const stateColors: Record<EpidemicState, string> = { susceptible: "#a8bcc9", infected: "#fb7185", recovered: "#45c6ed", deceased: "#64748b", quarantined: "#c084fc" };
type NetworkGraph3DProps = { graph: CityGraph; snapshot?: SimulationSnapshot; actions?: InterventionAction[]; initialInfectedNodeIds?: string[]; onNodeClick?: (nodeId: string) => void };
type Position3 = readonly [number, number, number];

function normaliseGraph(graph: CityGraph) {
  const points = graph.nodes.map(node => node.position);
  const minX = Math.min(...points.map(point => point.x), 0); const maxX = Math.max(...points.map(point => point.x), 1);
  const minY = Math.min(...points.map(point => point.y), 0); const maxY = Math.max(...points.map(point => point.y), 1);
  const span = Math.max(maxX - minX, maxY - minY, 1);
  return new Map(graph.nodes.map(node => [node.id, [((node.position.x - (minX + maxX) / 2) / span) * 9.6, 0, ((node.position.y - (minY + maxY) / 2) / span) * 9.6] as const]));
}

function MiniatureParcel({ node, position }: { node: CityNode; position: Position3 }) {
  const profile = getBuildingProfile(node);
  const isCivicGreen = node.facilityType === "school" || node.facilityType === "hospital";
  const parkColor = node.facilityType === "hospital" ? "#245648" : "#315b42";
  return <group position={[position[0], 0, position[2]]}>
    {isCivicGreen ? <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.016, 0]} receiveShadow><planeGeometry args={[profile.parcelWidth * 1.38, profile.parcelDepth * 1.42]} /><meshStandardMaterial color={parkColor} roughness={0.94} metalness={0.02} /></mesh> : null}
    <mesh position={[0, 0.034, 0]} receiveShadow><boxGeometry args={[profile.parcelWidth, 0.045, profile.parcelDepth]} /><meshStandardMaterial color="#40606a" roughness={0.9} metalness={0.03} /></mesh>
    <mesh position={[0, 0.061, 0]} receiveShadow><boxGeometry args={[Math.max(0.1, profile.parcelWidth - 0.055), 0.012, Math.max(0.1, profile.parcelDepth - 0.055)]} /><meshStandardMaterial color="#2a434b" roughness={0.92} metalness={0.04} /></mesh>
    {isCivicGreen ? <>
      <mesh position={[profile.parcelWidth * 0.43, 0.095, -profile.parcelDepth * 0.34]} castShadow><sphereGeometry args={[0.06, 10, 10]} /><meshStandardMaterial color="#4f9b65" roughness={0.82} /></mesh>
      <mesh position={[-profile.parcelWidth * 0.38, 0.095, profile.parcelDepth * 0.31]} castShadow><sphereGeometry args={[0.052, 10, 10]} /><meshStandardMaterial color="#5ca970" roughness={0.82} /></mesh>
    </> : null}
  </group>;
}

function QuarantineFence({ width, depth }: { width: number; depth: number }) {
  const fenceColor = "#d9b7ff";
  const railMaterial = <meshStandardMaterial color={fenceColor} emissive="#7237a9" emissiveIntensity={0.3} roughness={0.34} metalness={0.5} />;
  return <group position={[0, 0.13, 0]}>
    <mesh position={[0, 0, depth / 2 + 0.06]}><boxGeometry args={[width + 0.19, 0.036, 0.026]} />{railMaterial}</mesh>
    <mesh position={[0, 0, -depth / 2 - 0.06]}><boxGeometry args={[width + 0.19, 0.036, 0.026]} />{railMaterial}</mesh>
    <mesh position={[width / 2 + 0.06, 0, 0]}><boxGeometry args={[0.026, 0.036, depth + 0.19]} />{railMaterial}</mesh>
    <mesh position={[-width / 2 - 0.06, 0, 0]}><boxGeometry args={[0.026, 0.036, depth + 0.19]} />{railMaterial}</mesh>
  </group>;
}

function InfectionAura({ profile, state, initial, selected }: { profile: BuildingProfile; state: EpidemicState; initial: boolean; selected: boolean }) {
  const auraRef = useRef<any>(null);
  const active = state === "infected" || initial || selected;
  useFrame(({ clock }) => {
    if (!auraRef.current || !active) return;
    const pulse = 1 + Math.sin(clock.getElapsedTime() * 3.2) * (state === "infected" ? 0.16 : 0.07);
    auraRef.current.scale.setScalar(pulse);
    auraRef.current.rotation.y += 0.006;
  });
  if (!active) return null;
  const color = initial || selected ? "#fbbf24" : "#fb7185";
  return <group ref={auraRef} position={[0, profile.height + 0.14, 0]}>
    <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[Math.max(profile.width, profile.depth) * 0.84, 0.026, 10, 36]} /><meshBasicMaterial color={color} transparent opacity={0.9} /></mesh>
    {state === "infected" ? <pointLight color="#fb7185" intensity={0.7} distance={2.3} /> : null}
  </group>;
}

function CityBuilding({ node, position, state, selected, initial }: { node: CityNode; position: Position3; state: EpidemicState; selected: boolean; initial: boolean }) {
  const profile = getBuildingProfile(node);
  const facade = stateColors[state];
  const roofColor = facilityRoofColor(node.facilityType, state);
  const signalIntensity = state === "infected" ? 0.6 : selected || initial ? 0.88 : state === "quarantined" ? 0.25 : 0.05;
  const facadeMaterial = <meshStandardMaterial color={facade} roughness={node.facilityType === "office" ? 0.22 : 0.58} metalness={node.facilityType === "office" ? 0.54 : 0.24} emissive={facade} emissiveIntensity={signalIntensity} />;
  if (node.facilityType === "intersection") return <group position={[position[0], 0.11, position[2]]}>
    <mesh castShadow><cylinderGeometry args={[0.09, 0.12, 0.12, 8]} /><meshStandardMaterial color="#8eaab5" roughness={0.44} metalness={0.55} /></mesh>
    <mesh position={[0, 0.08, 0]}><cylinderGeometry args={[0.048, 0.048, 0.06, 10]} /><meshBasicMaterial color={selected || initial ? "#fbbf24" : "#b9efff"} /></mesh>
  </group>;
  return <group position={[position[0], profile.height / 2 + 0.075, position[2]]}>
    {node.facilityType === "hospital" ? <>
      <mesh castShadow receiveShadow>{facadeMaterial}<boxGeometry args={[profile.width, profile.height, profile.depth * 0.58]} /></mesh>
      <mesh castShadow receiveShadow>{facadeMaterial}<boxGeometry args={[profile.width * 0.56, profile.height * 1.04, profile.depth]} /></mesh>
    </> : <mesh castShadow receiveShadow>{facadeMaterial}<boxGeometry args={[profile.width, profile.height, profile.depth]} /></mesh>}
    {node.facilityType === "home" ? <mesh position={[0, profile.height / 2 + 0.13, 0]} castShadow rotation={[0, Math.PI / 4, 0]}><coneGeometry args={[Math.max(profile.width, profile.depth) * 0.84, 0.34, 4]} /><meshStandardMaterial color={roofColor} roughness={0.67} metalness={0.08} /></mesh> : null}
    {node.facilityType === "school" || node.facilityType === "retail" || node.facilityType === "transit" ? <><mesh position={[0, profile.height / 2 + 0.04, 0]} castShadow><boxGeometry args={[profile.width + 0.055, 0.075, profile.depth + 0.055]} /><meshStandardMaterial color={roofColor} roughness={0.35} metalness={0.35} /></mesh><mesh position={[0, -profile.height * 0.12, profile.depth / 2 + 0.013]}><boxGeometry args={[profile.width * 0.38, profile.height * 0.23, 0.022]} /><meshBasicMaterial color="#c5f2ff" transparent opacity={0.55} /></mesh></> : null}
    {node.facilityType === "hospital" ? <><mesh position={[0, profile.height / 2 + 0.052, 0]} castShadow><boxGeometry args={[profile.width * 0.82, 0.09, profile.depth * 0.82]} /><meshStandardMaterial color={roofColor} roughness={0.3} metalness={0.44} /></mesh><mesh position={[0, profile.height / 2 + 0.105, 0]}><boxGeometry args={[profile.width * 0.12, 0.018, profile.depth * 0.44]} /><meshBasicMaterial color="#48f0cf" /></mesh><mesh position={[0, profile.height / 2 + 0.107, 0]}><boxGeometry args={[profile.width * 0.44, 0.02, profile.depth * 0.12]} /><meshBasicMaterial color="#48f0cf" /></mesh></> : null}
    {node.facilityType === "office" ? <><mesh position={[0, profile.height / 2 + 0.045, 0]} castShadow><boxGeometry args={[profile.width + 0.055, 0.08, profile.depth + 0.055]} /><meshStandardMaterial color={roofColor} roughness={0.22} metalness={0.65} /></mesh>{[-0.25, 0.08, 0.42].map(offset => <mesh key={offset} position={[profile.width / 2 + 0.008, offset * profile.height, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[profile.depth * 0.64, profile.height * 0.13]} /><meshBasicMaterial color="#c5f2ff" transparent opacity={0.38} /></mesh>)}</> : null}
    <InfectionAura profile={profile} state={state} initial={initial} selected={selected} />
    {state === "quarantined" ? <QuarantineFence width={profile.width} depth={profile.depth} /> : null}
  </group>;
}

function RoadSegment({ source, target, roadClass, closed }: { source: Position3; target: Position3; roadClass: CityGraph["edges"][number]["roadClass"]; closed: boolean }) {
  const dx = target[0] - source[0]; const dz = target[2] - source[2];
  const length = Math.hypot(dx, dz); const angle = -Math.atan2(dz, dx);
  const primary = roadClass === "primary"; const secondary = roadClass === "secondary";
  const width = primary ? 0.31 : secondary ? 0.24 : roadClass === "footway" ? 0.105 : 0.18;
  const markings = primary || secondary;
  const dashCount = Math.max(1, Math.floor(length / (primary ? 0.56 : 0.72)));
  const dashSize = primary ? 0.25 : 0.19;
  return <group position={[(source[0] + target[0]) / 2, 0, (source[2] + target[2]) / 2]} rotation={[0, angle, 0]}>
    <mesh receiveShadow position={[0, 0.028, 0]}><boxGeometry args={[length + 0.12, 0.032, width + 0.09]} /><meshStandardMaterial color="#22353d" roughness={0.91} metalness={0.05} /></mesh>
    <mesh receiveShadow position={[0, 0.052, 0]}><boxGeometry args={[length + 0.06, 0.02, width]} /><meshStandardMaterial color={closed ? "#6e3b28" : primary ? "#314952" : "#2b414a"} roughness={0.76} metalness={0.12} emissive={closed ? "#b84e1f" : "#07131e"} emissiveIntensity={closed ? 0.35 : 0.02} /></mesh>
    {markings && !closed ? Array.from({ length: dashCount }, (_, index) => <mesh key={index} position={[-length / 2 + 0.3 + (index + 0.5) * ((length - 0.6) / dashCount), 0.069, 0]}><boxGeometry args={[dashSize, 0.009, primary ? 0.026 : 0.018]} /><meshBasicMaterial color={primary ? "#f9ce74" : "#bbd7e2"} /></mesh>) : null}
    {primary && !closed ? <><mesh position={[0, 0.068, width * 0.31]}><boxGeometry args={[length, 0.008, 0.012]} /><meshBasicMaterial color="#b6ccd2" transparent opacity={0.62} /></mesh><mesh position={[0, 0.068, -width * 0.31]}><boxGeometry args={[length, 0.008, 0.012]} /><meshBasicMaterial color="#b6ccd2" transparent opacity={0.62} /></mesh></> : null}
    {closed ? <group position={[0, 0.103, 0]}><mesh><boxGeometry args={[0.12, 0.065, width * 1.18]} /><meshStandardMaterial color="#fb923c" emissive="#f97316" emissiveIntensity={0.55} roughness={0.34} /></mesh><mesh rotation={[0, 0, Math.PI / 4]}><boxGeometry args={[0.24, 0.027, width * 1.28]} /><meshBasicMaterial color="#fed7aa" /></mesh><pointLight color="#fb923c" intensity={0.38} distance={1.2} /></group> : null}
  </group>;
}

function DistrictLights({ graph, positions }: { graph: CityGraph; positions: Map<string, Position3> }) {
  const districts = useMemo(() => {
    const grouped = new Map<string, CityNode[]>();
    graph.nodes.filter(node => node.population > 0).forEach(node => { const id = node.districtId ?? `${node.facilityType}-zone`; grouped.set(id, [...(grouped.get(id) ?? []), node]); });
    const districtEntries: Array<[string, CityNode[]]> = Array.from(grouped.entries());
    return districtEntries.map(([id, nodes]: [string, CityNode[]]) => {
      const anchors: Position3[] = nodes.map((node: CityNode) => positions.get(node.id)).filter((position): position is Position3 => Boolean(position));
      const center: Position3 = [anchors.reduce((sum: number, position: Position3) => sum + position[0], 0) / Math.max(anchors.length, 1), 0, anchors.reduce((sum: number, position: Position3) => sum + position[2], 0) / Math.max(anchors.length, 1)];
      const color = nodes.some((node: CityNode) => node.facilityType === "hospital") ? "#55e6b8" : nodes.some((node: CityNode) => node.facilityType === "office" || node.facilityType === "retail" || node.facilityType === "transit") ? "#63c7ff" : "#ffbf78";
      return { id, center, color };
    });
  }, [graph, positions]);
  return <>{districts.map(district => <pointLight key={district.id} position={[district.center[0], 2.1, district.center[2]]} color={district.color} intensity={0.38} distance={4.8} decay={2} />)}</>;
}

function NetworkScene({ graph, snapshot, actions = [], initialInfectedNodeIds = [], onNodeClick }: NetworkGraph3DProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const positions = useMemo(() => normaliseGraph(graph), [graph]);
  const closedRoadIds = useMemo(() => new Set(actions.filter(action => action.kind === "close_road").map(action => action.edgeId)), [actions]);
  const quarantinedNodeIds = useMemo(() => new Set(actions.flatMap(action => action.kind === "quarantine_node" ? [action.nodeId] : action.kind === "isolate_block" ? action.nodeIds : [])), [actions]);
  return <>
    <color attach="background" args={["#07131e"]} /><fog attach="fog" args={["#07131e", 12, 24]} />
    <Stars radius={90} depth={40} count={800} factor={1.5} saturation={0} fade speed={0.13} />
    <ambientLight intensity={0.42} color="#b9dff2" /><hemisphereLight args={["#75c5f3", "#0a1c28", 1.28]} /><directionalLight position={[-7, 12, -6]} intensity={2.7} color="#ffe2ba" castShadow shadow-mapSize={[1024, 1024]} /><directionalLight position={[6, 6, 7]} intensity={0.6} color="#71c7ff" />
    <DistrictLights graph={graph} positions={positions} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.09, 0]}><planeGeometry args={[18.7, 18.7]} /><meshStandardMaterial color="#122e36" roughness={0.92} metalness={0.06} /></mesh>
    <mesh position={[0, -0.045, 0]} receiveShadow><boxGeometry args={[14.8, 0.08, 14.8]} /><meshStandardMaterial color="#183f43" roughness={0.86} metalness={0.12} /></mesh>
    <mesh position={[0, -0.008, 0]} receiveShadow><boxGeometry args={[14.2, 0.028, 14.2]} /><meshStandardMaterial color="#27535a" roughness={0.88} metalness={0.06} /></mesh>
    {graph.edges.map(edge => { const source = positions.get(edge.source); const target = positions.get(edge.target); return source && target ? <RoadSegment key={edge.id} source={source} target={target} roadClass={edge.roadClass} closed={closedRoadIds.has(edge.id)} /> : null; })}
    {graph.nodes.map(node => { const position = positions.get(node.id); if (!position) return null; const rawState = snapshot?.nodeStates[node.id]?.state ?? "susceptible"; const state = quarantinedNodeIds.has(node.id) || rawState === "quarantined" ? "quarantined" : rawState; const selected = selectedNodeId === node.id; return <group key={node.id} onClick={event => { event.stopPropagation(); setSelectedNodeId(node.id); onNodeClick?.(node.id); }} onPointerOver={() => { document.body.style.cursor = "pointer"; }} onPointerOut={() => { document.body.style.cursor = "auto"; }}><MiniatureParcel node={node} position={position} /><CityBuilding node={node} position={position} state={state} selected={selected} initial={initialInfectedNodeIds.includes(node.id)} /></group>; })}
    <OrbitControls enableDamping dampingFactor={0.065} minDistance={7.1} maxDistance={17.5} minPolarAngle={0.54} maxPolarAngle={Math.PI / 2.18} minAzimuthAngle={-1.25} maxAzimuthAngle={1.25} target={[0, 0.35, 0]} />
  </>;
}

export function NetworkGraph3D(props: NetworkGraph3DProps) {
  if (!props.graph.nodes.length) return null;
  return <div className="relative h-full min-h-[540px] overflow-hidden rounded-[1.35rem] border border-cyan-300/25 bg-[#07131e] shadow-[0_24px_70px_rgba(6,28,43,.38)]"><Canvas shadows dpr={[1, 1.5]} camera={{ position: [8.25, 8.1, 9.1], fov: 39 }}><NetworkScene {...props} /></Canvas><div className="pointer-events-none absolute left-4 top-4 max-w-[350px] rounded-xl border border-cyan-200/20 bg-slate-950/74 px-3.5 py-3 text-[10px] leading-4 text-slate-100 shadow-xl backdrop-blur-md"><p className="font-bold uppercase tracking-[0.15em] text-cyan-200">Architectural miniature city network</p><p className="mt-1.5 text-slate-300">A tabletop city model with readable graph corridors: building form shows facility type, height reflects modeled population, and glowing structures show the active epidemic state.</p></div><div className="pointer-events-none absolute bottom-4 left-4 flex flex-wrap gap-2 rounded-xl border border-white/10 bg-slate-950/74 px-3 py-2 text-[10px] font-medium text-slate-100 shadow-lg backdrop-blur-md"><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-rose-400" /> infected glow</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-cyan-400" /> recovered</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-violet-400" /> quarantine fence</span><span><i className="mr-1 inline-block h-0.5 w-3 bg-orange-400" /> road barrier</span></div></div>;
}
