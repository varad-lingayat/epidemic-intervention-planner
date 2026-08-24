= Problem framing and requirements

== Academic problem statement

The project began from a second-year discrete mathematics brief: use graph theory and probability to model how an outbreak might spread through a city and compare intervention points when resources are limited. The resulting question is formalized as follows. Given a finite graph $G=(V,E)$, an outbreak state over population-bearing vertices, and a budget $B$, choose a small action set $A$ that modifies vertices or edges so that a chosen outcome measure is improved under a fixed scenario.

The important word is *choose*. A conventional epidemic animation only shows what happens after parameters are supplied. EpiGraph asks a more graph-theoretic question: *which limited roads or locations should a model select, and why?* The five strategies instantiate distinct answers. They are not novel algorithms; their educational value comes from comparing well-established techniques under one explicit protocol.

== Requirements translated into engineering decisions

#table(
  columns: (1.3fr, 2.7fr),
  inset: 7pt,
  fill: (x, y) => if y == 0 { rgb("#eaf2ff") } else { none },
  [Requirement], [Decision and rationale],
  [Synthetic city must work first], [A synthetic generator was placed ahead of live-data features. It guarantees a connected, small, repeatable graph and avoids blocking the lesson when a public service is unavailable.],
  [Real-city roads should be possible], [The importer uses bounded neighbourhood road geometry rather than citywide networks. This protects responsiveness and makes the mathematical display readable.],
  [Limited interventions], [The shared budget contract caps road closures, quarantined nodes, and quarantined population. Strategies cannot “win” by implicitly closing the whole city.],
  [Five techniques must be fairly compared], [The runner stores shared fairness metadata and invokes the same epidemic engine for every plan. A keyed hash random stream stabilizes event draws.],
  [Decision-maker clarity], [Recommendations expose the target, action, rationale, expected impact, and budget cost. Plain-English LLM text is optional explanatory narration, not a source of model results.],
  [Desktop-first delivery], [The layout is optimized for a laptop/desktop workspace and a portable Electron shell. Mobile-specific redesign was deliberately out of scope for the academic target.],
  [Light and dark modes], [Global token-based theming was used rather than page-specific colors so the state is coherent across the simulator, reports, dialogs, and charts.],
  [Demonstration reliability], [Curated presets and offline fixtures are bundled because a live OpenStreetMap dependency can undermine a classroom presentation.],
)

== Non-goals and boundary decisions

The application does not collect, infer, or display clinical case records, personal movement traces, census populations, vaccine status, genomic data, or hospital capacity. It does not optimize a real intervention and it does not advise users to quarantine any actual location. Those exclusions are not omissions caused by lack of time alone; they are a design boundary. A realistic decision-support system would require domain experts, validated surveillance data, uncertainty calibration, governance, legal review, and operational safeguards far beyond this course project.

The model is also intentionally not agent based. An agent-based model could depict individual schedules and contacts, but it would multiply assumptions, obscure the discrete-mathematics focus, and make strategy fairness harder to audit in a compact demonstration. Aggregated location counts support direct binomial transitions and preserve visual clarity.

== Success criteria

The release criteria were: the graph is connected and reproducible; all five strategies obey the same budget; every comparison has shared inputs; the map importer fails safely; reports preserve the scenario; visible controls are tested; the desktop build does not embed development-only Vite code; Demonstration Mode can obtain its curated graphs offline; and outcomes remain marked as academic scenario projections. The final quality gate reported TypeScript success and 62 passing automated tests across 24 test files, with one deliberately opt-in live OSM verifier outside the default suite.
