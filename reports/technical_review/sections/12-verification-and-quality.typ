= Verification, validation, and quality assurance

== What was verified

Verification asks whether the software implements its stated contracts. Validation asks whether those contracts are appropriate for the intended educational use. The project distinguishes these two. Automated tests can establish reproducibility, budget enforcement, state conservation, route selection behavior, and UI callbacks. They cannot establish that the scenario predicts a real outbreak. The latter is deliberately not claimed.

The release gate reported successful TypeScript checking and 62 passing automated tests across 24 test files. The quality-assured test suite covers graph generation; probability bounds; SIR transitions; budget enforcement; strategy fairness; Bayesian scoring; recommendations; OSM parser/normalizer/fallbacks; report persistence; public sharing; PDF export behavior; demonstration preset reproducibility; reset state; CSV export; theme persistence; graph pan/zoom/selection; timeline bounds; sensitivity controls; and desktop-runtime boundaries. One live OSM reproduction test remains opt-in because it intentionally depends on a third-party mutable network service.

== Testable invariants

#table(
  columns: (1.35fr, 2.65fr),
  inset: 7pt,
  fill: (x, y) => if y == 0 { rgb("#eaf2ff") } else { none },
  [Invariant], [Test significance],
  [$S_v+I_v+R_v+D_v=N_v$], [The local count conservation identity detects an invalid state update or double subtraction.],
  [$0<=p_v(t)<=1$], [All infection probabilities are clamped, preventing invalid binomial trials.],
  [$|E_A|<=b_e$, $|V_A|<=b_v$, $sum N_v<=b_p$], [No strategy can exceed the stated intervention resource constraints.],
  [Common $G,theta,B,I_0,T,sigma$], [Fairness metadata and deterministic event keys prove the intended common-condition comparison.],
  [Tie status], [Equal primary/secondary outcome metrics must produce `tied`, not a falsely unique first strategy.],
  [Imported graph cap], [The 320-node cap is aligned in browser validation, server validation, normalizer, and contract tests.],
  [Offline preset access], [Fixture-backed preset selection is covered without a live map call and package assets are checked for stable content.],
)

== UI interaction evidence

Rendered regression tests went beyond static component rendering. They exercise editable input boundaries, source-mode switches, importer pending and error states, manual interventions, timeline previous/next limits, sensitivity parameter changes and playback, global theme behavior, 2D pan/zoom/selection, reset actions, CSV download, and Demonstration Mode previous/next/load/close callbacks. This matters because a mathematically correct function is not sufficient if the surrounding controls can leave it unreachable or send stale values.

== Visual and runtime QA

The desktop interface received visual review for layout, dark/light contrast, 3D readability, and demonstration controls. The 3D renderer’s rendering logic was separated from the model profile rules to preserve testability. The Electron package was checked for absence of a Vite plugin reference and for the presence of offline fixture content. A final Windows device should still launch a curated demo preset: this external user-side smoke check is the remaining confirmation listed in the release checklist, and it is honestly recorded as pending rather than silently assumed.

== Quality limitations

Test success is not proof of absence of all defects. Browser graphics drivers, Windows security policy, third-party map availability, and user-specific file permissions remain outside the sandbox test environment. The test suite specifically treats public map availability as a recoverable external boundary. The fixture path reduces—but cannot mathematically eliminate—risk in the portable classroom demo because it depends on the complete packaged runtime functioning on a user’s Windows system.
