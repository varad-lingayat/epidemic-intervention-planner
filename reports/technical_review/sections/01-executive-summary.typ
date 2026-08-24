= Executive summary

EpiGraph is a desktop-first academic simulator for examining epidemic containment on a finite city network. Its purpose is not to estimate a real epidemic. Instead, it makes several standard discrete-mathematics ideas inspectable in one reproducible environment: graph construction, weighted routes, centrality, flow cuts, probability updates, bounded optimization, and controlled comparison. A learner can create a synthetic city, import a deliberately small road network, select starting locations, define a limited intervention budget, and compare five established strategies under identical modeled conditions.

The central design decision was to prefer *transparent conditional simulation* over a visually impressive but untraceable forecast. Every output is therefore a *scenario-model projection* conditional on a graph, a parameter vector, a starting set, a seed, a duration, and a budget. The application labels this boundary in the user interface and retains it in persisted reports. This decision protects academic honesty: a road graph is neither a census nor a contact survey, and an algorithmically generated action is not public-health advice.

The system combines a React client, an Express/tRPC server, Drizzle-backed scenario persistence in the hosted application, and a local JSON persistence substitute in the portable desktop package. The shared TypeScript model is deliberately the source of truth for the graph, epidemic, budget, intervention, report, and fairness vocabulary. This reduced the risk that a chart, a report, and the simulator would silently disagree about fields or units.

The mathematical core is a discrete-time, graph-constrained *SIR-style* model. Each population-bearing vertex has susceptible, infected, recovered, and deceased counts. Road edges have a modeled transmission probability and a road-class capacity. Zero-population intersections are treated as connectors rather than as people. A deterministic keyed pseudo-random stream makes each node/day/event trial stable under all strategy runs, which is stronger than merely setting one global random seed. The same simulated random trial associated with a particular vertex, day, and event type is reused wherever the comparison conditions are otherwise identical.

Five strategies are contrasted: a seeded random baseline, highest degree, betweenness centrality, Dijkstra route blocking, and max-flow/min-cut. The project intentionally does *not* claim that one strategy is universally superior. Demonstration Mode contains five curated teaching scenarios in which each method is a unique winner once, and it explicitly explains the structural condition that makes that result plausible. A tie-aware comparator avoids falsely declaring the first item in a list—especially Random—to be a unique winner when outcomes are equal.

#pagebreak()
== Principal contributions

#table(
  columns: (1.45fr, 2.55fr),
  inset: 7pt,
  fill: (x, y) => if y == 0 { rgb("#eaf2ff") } else { none },
  [Contribution], [What was implemented and why it matters],
  [Reproducible city graph], [A seeded synthetic generator produces connected districts, facilities, intersections, roads, distances, probabilities, and capacities so that classroom experiments can be repeated exactly.],
  [Fair five-way comparison], [All strategies receive the same graph, outbreak vector, initial infections, duration, budget, and deterministic keyed trials. This isolates intervention selection as the variable under study.],
  [Interpretable mathematics], [Each algorithm is represented by a direct, explainable objective rather than a black-box model: degree, shortest-path recurrence, flow capacity, or Bayes’ rule.],
  [Bounded real-road route], [OpenStreetMap road geometry can be imported at neighbourhood scale with clipping, caps, cache, timeout, endpoint failover, and a clear distinction between real geometry and synthetic epidemiological inputs.],
  [Teaching support], [Guided scenarios, a timeline, sensitivity controls, a reset state, a presenter script, CSV/PDF export, and shareable reports turn the implementation into an assessable demonstration.],
  [Portable delivery], [A Windows x64 portable Electron package embeds the required client runtime and curated road-graph fixtures so Demonstration Mode does not require a live map request.],
)

== Reading guide

Chapters 2–4 explain the problem framing, requirements, and architecture. Chapters 5–9 provide the formal graph model, state-transition equations, intervention algorithms, Bayesian scoring, and experiment protocol. Chapters 10–12 examine the interface, data path, desktop package, and verification evidence. Chapters 13–14 state limitations and conclusions. The decision register and appendices provide an auditable index of delivery decisions, demonstrations, tests, parameters, citations, and notation.

The report uses the word *modeled* carefully. “Modeled deaths,” for example, are output counts from a user-chosen daily transition probability; they are not measurements, clinical predictions, or casualty estimates. Similarly, an *OpenStreetMap (OSM)* road segment is genuine geometry, but the app assigns a proxy population and a scenario transmission probability to make the graph useful for a classroom experiment.
