export const FACILITY_TYPES = [
  "home",
  "school",
  "hospital",
  "office",
  "retail",
  "transit",
  "intersection",
] as const;

export type FacilityType = (typeof FACILITY_TYPES)[number];

export const EPIDEMIC_STATES = ["susceptible", "infected", "recovered", "deceased", "quarantined"] as const;

export type EpidemicState = (typeof EPIDEMIC_STATES)[number];

export const STRATEGY_NAMES = [
  "random",
  "highest_degree",
  "betweenness_centrality",
  "dijkstra_blocking",
  "max_flow_min_cut",
] as const;

export type StrategyName = (typeof STRATEGY_NAMES)[number];

export type CityGraphSource = "synthetic" | "openstreetmap";

export type Point = {
  x: number;
  y: number;
  lat?: number;
  lng?: number;
};

export type CityNode = {
  id: string;
  label: string;
  position: Point;
  facilityType: FacilityType;
  population: number;
  blockId?: string;
  districtId?: string;
  openStreetMapId?: number;
  metadata?: Record<string, string | number | boolean | null>;
};

export type CityEdge = {
  id: string;
  source: string;
  target: string;
  label?: string;
  distanceKm: number;
  transmissionProbability: number;
  capacity: number;
  roadClass: "primary" | "secondary" | "local" | "footway" | "unknown";
  openStreetMapWayId?: number;
  metadata?: Record<string, string | number | boolean | null>;
};

export type CityGraph = {
  id: string;
  name: string;
  source: CityGraphSource;
  nodes: CityNode[];
  edges: CityEdge[];
  createdAt: number;
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  attribution?: string;
};

export type SyntheticCityConfig = {
  name: string;
  seed: number;
  districtCount: number;
  blocksPerDistrict: number;
  homesPerBlock: number;
  schoolCount: number;
  hospitalCount: number;
  officeCount: number;
  roadDensity: number;
  minTransmissionProbability: number;
  maxTransmissionProbability: number;
};

export type OpenStreetMapImportConfig = {
  placeName: string;
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  maxNodes: number;
  includeFootways: boolean;
};

export type EpidemicParameters = {
  transmissionRate: number;
  recoveryRate: number;
  mortalityRate: number;
  days: number;
  initialInfectedNodeIds: string[];
  simulationSeed: number;
};

export type InterventionBudget = {
  maxRoadClosures: number;
  maxQuarantinedNodes: number;
  maxQuarantinedPopulation: number;
};

export type SymptomEvidence = {
  nodeId: string;
  symptomaticPeople: number;
  observedPopulation: number;
  evidenceStrength: number;
};

export type InterventionAction =
  | {
      kind: "close_road";
      edgeId: string;
      reason: string;
    }
  | {
      kind: "quarantine_node";
      nodeId: string;
      reason: string;
    }
  | {
      kind: "isolate_block";
      blockId: string;
      nodeIds: string[];
      nodeId?: never;
      reason: string;
    };

export type BudgetUse = {
  closedRoads: number;
  quarantinedNodes: number;
  quarantinedPopulation: number;
};

export type NodePopulationCounts = {
  susceptible: number;
  infected: number;
  recovered: number;
  deceased: number;
};

export type NodeEpidemicSnapshot = {
  state: EpidemicState;
  infectionProbability: number;
  hotspotScore: number;
  counts: NodePopulationCounts;
};

export type PopulationMetrics = {
  susceptible: number;
  infected: number;
  recovered: number;
  deceased: number;
  quarantined: number;
  cumulativeInfected: number;
};

export type SimulationSnapshot = {
  day: number;
  nodeStates: Record<string, NodeEpidemicSnapshot>;
  metrics: PopulationMetrics;
};

export type BayesianHotspotScore = {
  nodeId: string;
  priorProbability: number;
  likelihood: number;
  posteriorProbability: number;
  rank: number;
  explanation: string;
};

export type StrategyOutcome = {
  strategy: StrategyName;
  actions: InterventionAction[];
  budgetUse: BudgetUse;
  timeline: SimulationSnapshot[];
  hotspotScores: BayesianHotspotScore[];
  finalMetrics: PopulationMetrics;
  peakInfected: number;
  peakInfectedDay: number;
  outbreakDurationDays: number;
  finalInfectedPopulation: number;
  finalMortalityPopulation: number;
  containmentRate: number;
  networkComponentsAfterIntervention: number;
  shortRationale: string;
};

export type FairComparisonMetadata = {
  graphId: string;
  graphFingerprint: string;
  initialInfectedNodeIds: string[];
  interventionBudget: InterventionBudget;
  epidemicParameters: EpidemicParameters;
  randomSeed: number;
  deterministicTrialMethod: "keyed_hash";
};

export type ScenarioComparison = {
  id: string;
  title: string;
  graph: CityGraph;
  evidence: SymptomEvidence[];
  fairness: FairComparisonMetadata;
  outcomes: StrategyOutcome[];
  winningStrategy: StrategyName;
  winnerStatus?: "unique" | "tied";
  leadingStrategies?: StrategyName[];
  createdAt: number;
  disclaimer: string;
};

export type ActionableRecommendation = {
  priority: number;
  action: "close_road" | "quarantine_building" | "isolate_block" | "deploy_testing";
  targetLabel: string;
  targetId: string;
  rationale: string;
  budgetCost: string;
  expectedImpact: string;
  supportingStrategy: StrategyName;
};

export type ScenarioReportPayload = {
  comparison: ScenarioComparison;
  recommendations: ActionableRecommendation[];
  plainEnglishExplanation?: string;
};
