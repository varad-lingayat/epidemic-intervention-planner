import { z } from "zod";
import { importOpenStreetMapRoadNetwork, OsmImportError } from "../osmImport";
import { publicProcedure, router } from "../_core/trpc";

export const osmImportInputSchema = z.object({
  placeName: z.string().min(1).max(80),
  centerLat: z.number().min(-85).max(85),
  centerLng: z.number().min(-180).max(180),
  radiusKm: z.number().min(0.05).max(1.5),
  maxNodes: z.number().int().min(20).max(320),
  includeFootways: z.boolean(),
});

export const osmRouter = router({
  importRoadNetwork: publicProcedure.input(osmImportInputSchema).mutation(async ({ input }) => {
    try {
      return await importOpenStreetMapRoadNetwork(input);
    } catch (error) {
      if (error instanceof OsmImportError) {
        throw new Error(error.message);
      }
      throw error;
    }
  }),
});
