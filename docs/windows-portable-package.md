# EpiGraph Windows Portable Package

## Purpose

The Windows portable package runs the **EpiGraph Epidemic Intervention Planner** as a local desktop application. It starts an isolated local service on `127.0.0.1` and opens the academic simulator in an Electron desktop window. It does not replace the hosted web application; it is a separate, local delivery format for demonstrations, coursework review, and offline synthetic-graph analysis.

| Package property | Value |
|---|---|
| Artifact | `EpiGraph-Epidemic-Intervention-Planner-1.0.0-portable.exe` |
| Platform | Windows x64 |
| Delivery style | Single portable executable; no separate Node.js or Git installation is required |
| Start mode | Launches a local service on the loopback interface only and opens a desktop window |
| Optimized build size | 335 MB |
| SHA-256 | `b476ef8c62e3e1886600556c1b0ad019f5145f756461db3044dc132c2ec9ccaf` |
| Performance mode | Fast ZIP extraction, immediate local splash window, and deferred 3D/chart/report workspaces |

## Running the package

Download the portable executable, move it to a folder where you have write access, and double-click it. The application opens a local loading window immediately while it starts its isolated loopback service. This performance-focused build is larger because it prefers faster extraction over maximum compression. No administrator permission, Node.js installation, or terminal command is required.

> The package is unsigned for this academic handoff. Windows may show a SmartScreen warning. Before choosing to run it, verify that the file name and SHA-256 value match the table above. Do not run a copy obtained from an untrusted source.

## Local data behavior

Saved scenarios and reports are stored only on the same computer, next to the portable executable, in `EpiGraph-data/scenario-store.json`. This keeps the portable application independent of the hosted database but also means that uninstalling or deleting the application folder can remove its locally saved work. Copy the `EpiGraph-data` folder separately if you want to back up or move your portable scenarios.

## Feature boundary

The core synthetic-city simulation, the five fair intervention comparisons, Bayesian hotspot analysis, 2D and 3D graph exploration, manual what-if actions, sensitivity analysis, Demonstration Mode, CSV export, and PDF generation operate inside the local package. Demonstration Mode uses verified road-graph snapshots bundled into the application rather than live map requests. Scenario persistence and report viewing use the local JSON store rather than the hosted database.

| Capability | Portable behavior |
|---|---|
| Synthetic graph simulations and curated demonstrations | Fully available locally |
| 2D/3D explorer, intervention strategies, sensitivity analysis, CSV/PDF | Fully available locally |
| Saved scenarios and report records | Stored locally in `EpiGraph-data/scenario-store.json` |
| OpenStreetMap import | Requires an active internet connection to public map services |
| LLM explanation generation | Requires hosted service credentials and is not guaranteed in the portable package |
| Public report links | Available only on the local desktop service; they are not publicly hosted URLs |
| Hosted account login and cloud database | Deliberately replaced by an isolated local desktop identity and store |

## Development and rebuild command

The repository includes the desktop launcher, production staging script, and package configuration. A developer rebuilding the Windows artifact from the project source can run:

```bash
pnpm desktop:portable
```

The resulting executable is written to `release/EpiGraph-Epidemic-Intervention-Planner-1.0.0-portable.exe`. The package is built with a production-only runtime stage so it excludes the development toolchain from the final application bundle.
