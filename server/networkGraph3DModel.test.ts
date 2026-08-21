import { describe, expect, it } from "vitest";
import type { CityNode, EpidemicState, FacilityType } from "@shared/epidemic";
import { facilityRoofColor, getBuildingProfile } from "../client/src/components/networkGraph3DModel";

function node(facilityType: FacilityType, population = 900): CityNode {
  return { id: facilityType, label: facilityType, position: { x: 0, y: 0 }, facilityType, population };
}

describe("architectural miniature building profiles", () => {
  it("gives each facility class a distinct silhouette while retaining population scaling", () => {
    const home = getBuildingProfile(node("home"));
    const school = getBuildingProfile(node("school"));
    const hospital = getBuildingProfile(node("hospital"));
    const office = getBuildingProfile(node("office"));

    expect(home.roof).toBe("pitched");
    expect(school.roof).toBe("flat");
    expect(hospital.roof).toBe("hospital");
    expect(office.roof).toBe("tower");
    expect(school.width).toBeGreaterThan(home.width);
    expect(office.height).toBeGreaterThan(hospital.height);
    expect(hospital.parcelDepth).toBeGreaterThan(home.parcelDepth);
  });

  it("keeps intervention and outbreak roof signals visually distinguishable", () => {
    expect(facilityRoofColor("hospital", "susceptible" as EpidemicState)).toBe("#d9fdf2");
    expect(facilityRoofColor("office", "infected" as EpidemicState)).toBe("#fecdd3");
    expect(facilityRoofColor("home", "quarantined" as EpidemicState)).toBe("#e9d5ff");
  });
});
