# Guided Demonstration Mode

## Purpose

Demonstration Mode replaces ad-hoc slider selection with five **curated, reproducible classroom scenarios**. Each applies one fixed bounded real-road configuration, starting node, simulation seed, epidemic parameters, and intervention budget. The app then runs every strategy under those exact same conditions.

> A scenario demonstrates that a method can be strongest **under its stated assumptions**. It does not claim that any method, including a random baseline, is universally best for epidemic response.

## Curated scenario suite

| Step | Map configuration | Intended unique leader | Core teaching contrast |
|---|---|---|---|
| 01 | Shoreditch, London, 0.06 km | Random selection | A chance-aligned road can narrowly lead on modeled mortality; the UI explicitly calls this an exceptional baseline result. |
| 02 | East Village, New York, 0.06 km | Highest Degree | A single closure at a highly connected corridor reduces modeled exposure most effectively. |
| 03 | East Village, New York, 0.06 km | Betweenness Centrality | A bridge-like route appears on many shortest paths and becomes the key containment target. |
| 04 | Shoreditch, London, 0.06 km | Dijkstra Blocking | With one location quarantine, a repeatedly likely source-to-destination route is sharply interrupted. |
| 05 | East Village, New York, 0.06 km | Max-Flow/Min-Cut | Two closures isolate a low-capacity separation between source and destinations. |

All road imports are bounded to a 0.06 km radius and a maximum of 250 nodes. The exact coordinates, initial OSM-node identifiers, rates, duration, seed, and budget are stored in `shared/demoPresets.ts`.

## Verification protocol

The presets were searched with deterministic comparison runs over bounded OpenStreetMap road graphs. The search compared outcomes lexicographically by final modeled infections and then modeled deaths, while keeping the graph, seed, outbreak parameters, starting infection, and intervention limits identical across methods. The final application also exposes explicit `winnerStatus` metadata; tied runs are reported as **inconclusive**, never as a unique Random win.

On 2026-08-20, the opt-in verifier `VERIFY_LIVE_DEMO_PRESETS=1 pnpm vitest run server/demoPresetLiveVerification.test.ts` re-imported the two bounded public-road maps and reproduced every stored leader, final modeled infection count, and modeled death count. The run passed in 41.5 seconds. This check is intentionally opt-in because it contacts the public map source.

For offline reproducibility, fixed snapshots of the same bounded Shoreditch (158 nodes, 217 edges) and East Village (247 nodes, 333 edges) road graphs are stored under `server/fixtures/`. `server/demoPresetFixture.test.ts` replays every preset against its matching snapshot and asserts the unique expected leader plus the stored infection and mortality metrics. The guided controller also has direct callback coverage for loading the current, previous, and next scenario and for closing Demonstration Mode.

The guided panel keeps the expected leader visible, but the live scorecard remains the source of truth after a map refresh. If live public road data has changed enough to alter the result, the application prompts the presenter to inspect the scorecard rather than silently claiming verification.

## Presenter walkthrough

Open **Demonstration** in the application header. Select **Load and run this scenario**, briefly point out the bounded map, identical constraints, and expected strategy contrast, then use **Next** to proceed. For each step, open the Network view to show the selected roads/nodes in the 2D or 3D graph and the Comparison view to show the fair scorecard.

## Visual review

The 3D view was reviewed at a 1440-pixel desktop viewport. It uses a dark dusk simulation chamber with terrain layers, building-height population cues, primary-road emphasis, directional and point lighting, fog, stars, and orbit controls. The 3D surface remains a graph explanation tool rather than a photorealistic geographical reconstruction; buildings and terrain are intentionally stylized so interventions and network connectivity remain legible.
