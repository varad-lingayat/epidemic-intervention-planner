# Real-City Data Sources and Use Notes

## OpenStreetMap road geometry

The application first requests bounded, neighborhood-scale road geometry from public Overpass API instances and converts returned OpenStreetMap ways and junction nodes into the shared city-graph model. If those public query instances are temporarily unavailable, it uses the official OpenStreetMap small-area map-data endpoint for the same tightly bounded area. The imported road layout is real geographic data, but the application does **not** import census population, clinical records, observed disease cases, or mobility flows.

The simulator therefore labels junction populations, transmission probabilities, epidemiological rates, and outcomes as explicit **scenario-model inputs or proxies**. They are intended for discrete-mathematics comparison and demonstration, not forecasting or operational public-health use.

## Sources

1. [Overpass API documentation — Preface](https://dev.overpass-api.de/overpass-doc/en/preface/preface.html)
2. [OpenStreetMap](https://www.openstreetmap.org/)
3. [OpenStreetMap Copyright and License](https://www.openstreetmap.org/copyright)
4. [OpenStreetMap API — Map data by bounding box](https://wiki.openstreetmap.org/wiki/API_v0.6#Map_data)

## Application safeguards

The importer caps requests to a small radius and a configurable node limit. It caches normalized results, reports upstream timeouts and public-data availability failures, and rejects oversized networks instead of silently truncating them. Every imported graph preserves OpenStreetMap attribution in the application UI and generated scenario data.
