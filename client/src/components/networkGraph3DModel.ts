import type { CityNode, EpidemicState } from "@shared/epidemic";

export type BuildingProfile = {
  width: number;
  depth: number;
  height: number;
  parcelWidth: number;
  parcelDepth: number;
  roof: "pitched" | "flat" | "hospital" | "tower" | "marker";
};

export function getBuildingProfile(node: CityNode): BuildingProfile {
  const populationScale = Math.min(1.55, 0.3 + Math.sqrt(Math.max(node.population, 0)) / 25);
  const base = node.population > 0 ? Math.min(0.43, 0.2 + Math.sqrt(node.population) / 128) : 0.12;
  switch (node.facilityType) {
    case "home": return { width: base * 1.08, depth: base * 0.9, height: populationScale * 0.86, parcelWidth: base * 1.9, parcelDepth: base * 1.75, roof: "pitched" };
    case "school": return { width: base * 1.95, depth: base * 1.22, height: Math.max(0.42, populationScale * 0.54), parcelWidth: base * 2.32, parcelDepth: base * 1.65, roof: "flat" };
    case "hospital": return { width: base * 1.55, depth: base * 1.42, height: Math.max(0.62, populationScale * 0.74), parcelWidth: base * 2.1, parcelDepth: base * 2.02, roof: "hospital" };
    case "office": return { width: base * 0.92, depth: base * 0.92, height: Math.max(0.88, populationScale * 1.35), parcelWidth: base * 1.7, parcelDepth: base * 1.7, roof: "tower" };
    case "retail": return { width: base * 1.5, depth: base, height: Math.max(0.34, populationScale * 0.45), parcelWidth: base * 1.82, parcelDepth: base * 1.4, roof: "flat" };
    case "transit": return { width: base * 1.38, depth: base * 0.72, height: Math.max(0.24, populationScale * 0.32), parcelWidth: base * 1.66, parcelDepth: base * 1.22, roof: "flat" };
    default: return { width: 0.12, depth: 0.12, height: 0.08, parcelWidth: 0.34, parcelDepth: 0.34, roof: "marker" };
  }
}

export function facilityRoofColor(type: CityNode["facilityType"], state: EpidemicState) {
  if (state === "infected") return "#fecdd3";
  if (state === "quarantined") return "#e9d5ff";
  if (type === "hospital") return "#d9fdf2";
  if (type === "school") return "#fef0c7";
  if (type === "office") return "#d7f4ff";
  if (type === "retail" || type === "transit") return "#d8e7f1";
  return "#f4e5d1";
}
