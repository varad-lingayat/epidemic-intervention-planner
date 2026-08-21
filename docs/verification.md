# Verification Notes

## 2026-08-20 — Default synthetic scenario

The default **Asterhaven** synthetic scenario was visually checked after calibrating the connector-aware discrete-time transmission model. The strategy scorecard shows materially different outcomes under the identical seed and intervention budget: the random baseline reaches substantially more cumulative cases, while the informed strategies reduce the demonstrated scenario to the initial outbreak size. The network canvas exposes animated timeline playback, state colors, selected intervention roads, node selection, drag-to-pan, zoom, road-weight hover text, and reset controls.

The displayed infection and mortality values remain explicitly labelled as **educational scenario outputs**, not real public-health forecasts or operational guidance.

## Next visual refinement

Add facility-type cues and a concise facility legend so homes, schools, hospitals, offices, blocks, and road junctions are recognizable directly in the graph canvas.

## 2026-08-20 — Dashboard accessibility and outcome interface

The graph canvas now displays facility cues and a legend, supports pointer drag-to-pan, accessible zoom controls, selected-location details, road-weight hover text, and feedback overlays for real-road import loading and error states. The timeline footer exposes previous-day, play/pause, next-day, restart, and slider controls.

The comparison interface now includes recovered populations and labels the deaths column as a mortality projection. Global CSS defines intentional easing tokens and respects `prefers-reduced-motion` by suppressing non-essential animations and transitions.

## 2026-08-20 — Final desktop report and visual evidence

The desktop dashboard was reviewed at a 1440-pixel viewport in dark mode. The layout presents city/outbreak controls, the network canvas, timeline controls, comparison charts, a strategy scorecard, recommendations, and the report preview without overlapping panels. The report target visibly includes its fairness configuration, final graph snapshot, plain-English explanation, selected actions, charts, and recommendation cards.

Light/dark mode is global and persisted through the theme context, which applies or removes the document-level `dark` class and stores the selected preference. The CSS reduced-motion rules suppress non-essential animation when the operating-system preference requests it. Keyboard-accessible controls are retained for graph-node selection and graph zoom; mobile-specific adaptation and specialist assistive-technology support remain deliberately outside this desktop academic demonstration's scope.

The final validation command completed successfully: `pnpm check && pnpm test`, yielding **26 passing tests across 8 files**. The persisted report-rendering test checks every required public-share/PDF section, and the PDF export button now gives an error message when its target is unavailable or exporting fails.

## 2026-08-20 — Guided simulator revision

The revised desktop workspace was reviewed at a 1440-pixel viewport. Its top ribbon exposes five focused views: **Configure**, **Explore network**, **View outcomes**, **Compare**, and **Sensitivity**. The initial Configure view renders synthetic or bounded real-road setup, outbreak assumptions, symptom evidence, and a shared intervention budget in separate panels. The primary academic scenario-model notice is now kept in the footer; field descriptions explain simulator effects without repeating broad warnings.

The Explore network view uses the same graph and outbreak inputs as the fair comparison. It offers 2D and simplified 3D city-block/network presentation, full-size canvas controls, initial infection selection, and budget-checked road/location actions. Those manual actions re-run a separate what-if outcome while leaving the five-strategy scorecard’s controlled protocol unchanged. The Outcomes, Compare, and Sensitivity views respectively isolate timeline/charts, the strategy scorecard/report controls, and parameter-sweep interpretations.

Final automated validation for this revision completed with `pnpm check` and `pnpm test`: **34 tests across 10 files** passed. Intervention coverage includes deterministic user-selected road closure, populated-location quarantine, and an empty manual-action plan on a zero-population road-only graph. Sensitivity coverage verifies deterministic parameter sweeps and common-condition strategy comparison.

The final workspace copy audit identifies the footer value `comparison.disclaimer` as the one user-facing academic scenario-model notice. The compact header now names the graph-simulation discipline, while outcome and recommendation text describes the data source or simulator behavior without repeating broad medical/public-health warnings. The sensitivity view likewise explains parameter effects without duplicating the scope notice. A focused search of simulator UI files found no remaining repeated notice wording; the only unrelated matches were internal comments in the unused map utility.

## 2026-08-20 — Demonstration mode and 3D explorer

The revised application adds a header-level Demonstration Mode with five named, controlled real-road cases. The preset catalog covers all five implemented strategies exactly once and constrains each import to a 0.06 km / 250-node neighborhood. The browser has direct review links for the guided panel (`?demo=1`) and 3D explorer (`?view=network&network=3d`). Desktop visual review confirmed that the guided panel is legible above the five-step ribbon and that the city-block renderer presents a dark, cinematic network chamber with terrain, roads, building depth, and legend overlays.

The final programmed catalog test verifies one preset per strategy, bounded import sizes, a non-empty deterministic source selection, positive seed, available intervention budget, and substantive teaching narration. Persisted Shoreditch and East Village graph fixtures replay all five stored outcomes offline; the shared demonstration controller invokes the expected load and close callbacks, and node-side rendering verifies that the guided panel exposes the scenario, load, previous, next, and exit controls. The normal suite now has **41 passing tests across 13 files**, with one network-dependent live verifier intentionally skipped unless explicitly enabled.

The opt-in live verifier was enabled once during final validation. It re-imported the two bounded public road maps and reproduced all five stored unique strategy leaders with their documented final modeled infections and modeled deaths.

## 2026-08-20 — Presentation finishing controls

The header now provides a visible **Reset** action that restores the deterministic Asterhaven teaching scenario and clears imported-road state, temporary evidence, manual actions, playback, transient explanation text, and share-link state. The fair scorecard now includes a **CSV** action that exports all five strategies with leadership status, cases, recoveries, modeled deaths, peak values, containment, budget usage, and selected actions.

Desktop review at 1440 pixels confirmed that the reset control is visible beside Demonstration Mode, the CSV action is adjacent to the comparison scorecard, and the guided demonstration panel contains a collapsible presenter-notes section without crowding the scenario controls. The presenter script now explicitly covers the Bayesian symptom-evidence and hotspot-scoring explanation. Component interaction coverage clicks both visible Reset and CSV controls; the actual Home reset handler now consumes the shared `createStandardWorkspaceResetState` controller, which is tested for synthetic settings, real-road defaults, cleared evidence/actions, reset display state, and cleared transient report/demo state. The CSV helper test verifies download initiation and object-URL cleanup. The final standard suite reports **48 passing tests across 16 files**, with one opt-in live-road verification intentionally skipped.
