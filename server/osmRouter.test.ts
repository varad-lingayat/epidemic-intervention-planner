import { describe, expect, it } from "vitest";
import { osmImportInputSchema } from "./routers/osm";

describe("OpenStreetMap import input contract", () => {
  const commonInput = {
    placeName: "Bandra West, Mumbai",
    centerLat: 19.0596,
    centerLng: 72.8295,
    radiusKm: 0.1,
    includeFootways: false,
  };

  it("accepts the dense-neighborhood 320-node ceiling used by the browser controls", () => {
    expect(osmImportInputSchema.safeParse({ ...commonInput, maxNodes: 320 }).success).toBe(true);
  });

  it("rejects limits above the shared safe ceiling", () => {
    expect(osmImportInputSchema.safeParse({ ...commonInput, maxNodes: 321 }).success).toBe(false);
  });
});
