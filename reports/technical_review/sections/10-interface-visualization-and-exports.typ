= Interface, visualization, reports, and exports

== Workspace design

The workspace was refactored from a crowded single-page control area into an explicit learning flow: Setup, Network, Outcomes, Comparison, and Analysis. The top ribbon does not imply that the mathematics occurs in a fixed sequence; it gives the learner a navigable mental model. Setup establishes graph and epidemic assumptions. Network exposes the geometry and selected starting locations. Outcomes shows the day-by-day trajectory. Comparison makes the fair five-way result legible. Analysis provides Bayesian hotspots, manual what-if actions, and sensitivity sweeps.

Each quantitative input is accompanied by a definition, a permitted range, and a plain-language effect. This is a design decision with mathematical significance: a user should not be able to type a mortality rate of $300%$ or a graph size that will make the browser unresponsive without receiving a bounded value or clear feedback. Boundary clamping is part of model integrity, not merely UI polish.

== 2D network explorer

The 2D explorer represents vertices by facility type and epidemic state, edges by road class, and interventions by visible closure/quarantine treatment. It supports zoom, pan, click selection, reset, and legends. A selection cap of three population-bearing initial-infection locations is intentional. It provides meaningful multi-source scenarios while keeping causal explanation manageable. Clicking a fourth candidate produces feedback rather than silently dropping a selection.

The timeline renders snapshots $t=0,...,T$ and has previous/next buttons, a scrubber, and play/pause. Animation is subordinate to state inspection; the app respects reduced-motion preference and retains static controls. The state palette deliberately differentiates susceptible, infected, recovered, deceased, and quarantined locations with distinct hues rather than relying only on opacity or animation.

== Architectural miniature 3D view

The 3D view is not a second simulation. It reads the same graph and snapshot contracts as the 2D view. The renderer uses varied building footprints and rooflines, facility-specific silhouettes, road surfaces with primary/secondary markings, block parcels, green buffers, district lighting, outbreak halos, quarantine fencing, and a tighter tabletop camera. The intent was a “high-detail architectural miniature”: richer than abstract nodes and lines, but not a photorealistic claim about a real street.

This visual choice resolves a tension. An abstract graph supports mathematical reading but can look like a disconnected assignment. A photorealistic city can imply false realism and obscure network structure. The miniature retains topology: roads remain visually traceable, facilities are distinguishable, and intervention barriers are visible. Tests isolate building-profile and facility-geometry rules in a pure model module so visual refactoring does not alter epidemic logic.

== Results, sharing, and downloads

The Outcome view separates time-series charts from the comparison scorecard. The comparison table exposes cumulative infections, active cases, recoveries, modeled deaths, peak metrics, budget use, and recommended actions. CSV export provides current tabular strategy results. The PDF export generates a report containing graph snapshot, configuration, interventions, charts, recommendations, and optional LLM explanation; user feedback exists for export failure. Persisted report payloads can create a public share page with equivalent sections.

The LLM explanation is intentionally downstream. It summarizes the already computed winner and critical locations in plain English for a non-technical decision-maker. The compact payload repair ensured normal scenarios fit the server input limit. The model never authorizes the strategy, computes the SIR timeline, or replaces the explicit recommendation rationale; its failure cannot alter the numeric result.

== Theme and interaction quality

Light/dark mode is global and persistent. It is implemented through shared tokens rather than component-local inversion, preventing common failures such as invisible text on an otherwise dark card. Interaction tests cover theme persistence and document-class cleanup. Motion durations remain short and can be disabled. While mobile-specific adaptation and specialized assistive-technology extensions were outside the scoped deliverable, keyboard reachability, focus behavior, error visibility, and reduced motion were treated as core quality requirements rather than decorative extras.
