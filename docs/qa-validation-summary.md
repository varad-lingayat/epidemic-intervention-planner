# Quality-Assurance Validation Summary

**Scope completed:** 2026-08-21  
**Application:** EpiGraph Epidemic Intervention Planner  
**Coverage approach:** Representative valid, boundary, invalid, and recovery states across the academic simulator’s primary workflows. This is systematic coverage, not a claim that an unbounded space of possible inputs has been exhaustively enumerated.

## Automated validation result

| Check | Result | Evidence |
|---|---:|---|
| TypeScript compilation | Passed | `pnpm check` completed with no type errors. |
| Automated test files | 24 passed, 1 skipped | The skipped file is the intentionally opt-in live OpenStreetMap demonstration verifier. |
| Automated assertions | 62 passed, 1 skipped | Final `pnpm check && pnpm test` release gate completed successfully in approximately nine seconds. |
| Desktop service smoke test | Passed | Production server binds to loopback only and serves the packaged client shell. |
| Portable production bundle | Passed static inspection | Development-only Vite/JSX-plugin imports were removed from the packaged runtime. |
| Offline demonstrations | Passed fixture checks | The curated road-graph fixtures are bundled into the client and covered by fixture and interaction tests. |

## Interaction and boundary coverage

| Surface | Representative states covered |
|---|---|
| Setup fields | Valid values, slider/input clamping, mode switches, pending import disablement, and importer feedback states. |
| Simulation timeline | First/last-day boundaries, play/pause behavior, and time-step navigation. |
| Network interventions | Road closure and location-quarantine selection, disabled/manual-action states, and budget-aware behaviour. |
| 2D graph navigation | Zoom, pointer-drag pan, reset, and populated-node selection. |
| Strategies | Fair comparison, budget enforcement, tie-safe scorecard behavior, Bayesian scoring, and recommendation output. |
| Demonstration Mode | Scenario navigation, fixture availability, expected-winner metadata, and offline graph fixture loading. |
| Reports and exports | Report preview, persistent/local scenario flow, CSV generation, and PDF control coverage. |
| Sensitivity analysis | Parameter selection, play/pause interaction, and sweep interpretation states. |
| Global theme | Stored dark preference, light/dark toggle, document class cleanup, and browser persistence. |
| Portable desktop runtime | Loopback start-up, isolated local scenario persistence, packaged static asset serving, and production dependency boundaries. |

## Visual and runtime review

Representative desktop views were reviewed for Configure, 2D Network, 3D Network, Outcomes, Compare, Sensitivity, and open Demonstration Mode states. The workspace layout remained stable at 1440 × 900, with no observed clipping, blank charts, missing labels, or visible console/network errors. The review notes are retained in `docs/qa-visual-review.md`.

## Remaining boundaries

The live OpenStreetMap verifier remains opt-in because it depends on third-party availability and network conditions. Real-road import therefore needs a live connection, whereas the curated Demonstration Mode scenarios now use bundled fixtures. The portable Windows executable is built in Linux and structurally validated here; the remaining open item is a final user-device smoke test that loads a curated demonstration scenario in Windows.

## Result

The application is suitable for the intended second-year academic demonstration after this QA pass. Reproducible defects found in prior portable builds—the development-only Vite import and live-map dependency in Demonstration Mode—were repaired and covered by regression tests. Future changes should retain `pnpm check && pnpm test` as the release gate.
