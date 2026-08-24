# EpiGraph Quality-Assurance Matrix

This matrix defines the systematic test pass for the desktop-first academic simulator. It uses **equivalence classes and boundaries** rather than claiming exhaustive enumeration of the unbounded combinations of seeds, city topology, rates, evidence, and manual actions.

| Area | Representative states | Evidence required |
|---|---|---|
| Synthetic graph configuration | Standard, minimum/maximum district and density settings, regenerated graph, invalid or clamped numeric edits | Engine and interaction tests; visible stable regeneration |
| Epidemic assumptions | Zero/low/high transmission, recovery, mortality, duration, initial-seed selection boundaries | Deterministic engine tests; no invalid population state |
| Intervention budget | Zero, one, within-limit, at-limit, duplicate, and over-limit road/location actions | Constraint tests and visible error feedback |
| Fair strategy comparison | All five methods, tie outcome, seeded reproducibility, varying sources/budgets | Comparison and strategy tests |
| Symptom evidence | No evidence, zero symptomatic people, positive evidence, population-clamped evidence | Bayesian scoring and UI-state tests |
| Network exploration | 2D, 3D, selected seeds, pan/zoom or orbit, timeline play/pause/step/scrub, focus mode | Rendered interaction tests and desktop visual review |
| Real-road import | Valid bounded request, oversized request, public-data failure, cache/failover behavior | OSM router/import tests; actionable error states |
| Demonstration Mode | Each preset, navigation, close, winner verification, bundled fixture loading | Fixture, navigation, and Windows package checks |
| Reporting and export | Anonymous sign-in guard, authenticated persistence path, share payload, CSV, PDF failure feedback | Report, export, and interaction tests |
| Sensitivity analysis | Each parameter sweep, data range, reduced-motion behavior | Sensitivity calculation and rendered-state tests |
| Desktop package | Local store, desktop loopback binding, static shell, no Vite development imports, bundled demo fixtures | Runtime smoke test; package archive checks; Windows user launch confirmation |
| Visual polish | Light/dark contrast, top-level views, 2D/3D city treatment, dense result state, empty/error states | Desktop screenshots and console-log review |

## Boundaries not fully automatable in the sandbox

The test pass can systematically cover model and UI state classes, but it cannot enumerate every continuous slider value, every possible graph seed, every public OpenStreetMap response, or every Windows graphics-driver configuration. External map availability, hosted authentication, clipboard permissions, browser download prompts, and the final Windows native executable launch are recorded as environment-dependent checks rather than treated as hidden guarantees.
