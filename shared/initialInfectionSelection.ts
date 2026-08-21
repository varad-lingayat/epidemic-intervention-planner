export type InitialInfectionSelectionReason = "selected" | "deselected" | "minimum" | "maximum";

export type InitialInfectionSelection = {
  initialInfectedNodeIds: string[];
  changed: boolean;
  reason: InitialInfectionSelectionReason;
};

/**
 * Keeps the scenario usable by preserving at least one initial infection seed
 * while enforcing the dashboard's explicit three-location comparison limit.
 */
export function toggleInitialInfectionSeed(
  selectedNodeIds: string[],
  nodeId: string,
  maximumSeeds = 3,
): InitialInfectionSelection {
  if (selectedNodeIds.includes(nodeId)) {
    if (selectedNodeIds.length <= 1) {
      return { initialInfectedNodeIds: selectedNodeIds, changed: false, reason: "minimum" };
    }
    return {
      initialInfectedNodeIds: selectedNodeIds.filter(id => id !== nodeId),
      changed: true,
      reason: "deselected",
    };
  }

  if (selectedNodeIds.length >= maximumSeeds) {
    return { initialInfectedNodeIds: selectedNodeIds, changed: false, reason: "maximum" };
  }

  return {
    initialInfectedNodeIds: [...selectedNodeIds, nodeId],
    changed: true,
    reason: "selected",
  };
}
