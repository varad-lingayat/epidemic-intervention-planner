#pagebreak()
= Appendix I — Alternatives considered and complete rationale ledger

An implementation record should not read as if every chosen method were inevitable. The project made a sequence of constrained decisions: it had to be mathematically rich enough for discrete mathematics, understandable in a classroom demonstration, capable of working on a synthetic graph and bounded real-road geometry, fair across five strategies, visually compelling, and deliverable as a portable Windows application. This appendix records the principal alternatives and why the final design chose a different path. “Rejected” does not mean “bad”; it means unsuitable for the stated scope, evidence, or teaching objective.

== I.1 Problem-framing alternatives

| Decision area | Alternatives considered | Adopted decision | Rationale and boundary |
|---|---|---|---|
| Primary purpose | Forecasting, live surveillance, policy automation, teaching simulator | Academic decision-support scenario simulator | A second-year project can rigorously compare algorithms without claiming a real-world forecast |
| Disease representation | Agent-level simulation, ODE compartments, network-constrained discrete counts | Discrete-time node-level SIR-with-deaths | Preserves graph theory and countable day updates while remaining explainable |
| City data | Fully synthetic, fully real demographic/GIS data, hybrid | Synthetic populations over synthetic or bounded real-road topology | Geometry can be authentic without implying health data is real |
| Intervention claim | “Optimal lockdown” recommender, ranked heuristic comparison | Five named established strategies under a shared budget | Avoids inventing an unvalidated universal optimization objective |
| Output voice | Clinical/risk prediction language, neutral scenario-model language | Explicit academic-projection framing | Prevents a classroom result being mistaken for public-health advice |

The final framing is not a rhetorical disclaimer appended after the fact. It shapes the whole architecture. An operational forecasting system would need data governance, calibration, uncertainty estimation, external validation, and policy authority. The chosen project instead makes its assumptions visible and treats its outputs as conditional consequences of those assumptions.

== I.2 Epidemiological-model alternatives

**Continuous-time ODE SIR versus discrete time.** A Kermack–McKendrick-style differential-equation model is mathematically elegant and useful for population-level analysis. It was not selected as the main engine because the project must show a user a daily animated city graph with count transitions at named locations. A difference equation makes day $t$, day $t+1$, sliders, and timeline playback immediately inspectable. It also aligns naturally with bounded deterministic trial keys. The cost is that numerical behavior depends on the chosen daily time step; this is stated as a limitation.

**Agent-based simulation versus node-level counts.** An agent-based model could represent individual movement, household membership, and contact events. It was not selected because it would require thousands of simulated agents, more unobservable assumptions, slower rendering, and a complex fairness problem across strategies. Node-level counts preserve a person-conservation invariant and make budgets expressible in modeled location populations. The compromise is heterogeneity within a node: every person in a location shares the same compartment count dynamics.

**SIS, SEIR, vaccination, age stratification, and reinfection.** These are all defensible extensions. The project adopts a susceptible–infected–recovered–deceased bookkeeping structure without an exposed compartment or reinfection. This choice avoids adding parameters that cannot be justified by classroom input. An SEIR model would require an incubation distribution and transition timing; age stratification would require contact matrices; vaccination would require efficacy and uptake assumptions. The report documents these as future-work directions rather than pretending their absence is unimportant.

**Independent route approximation versus probability summation.** Summing $q_1+q_2+...$ is simpler but can exceed one. The selected complement-product aggregation remains bounded and demonstrates a useful probability identity. It assumes independent simplified opportunities, which is not realistic at city scale, but it is a better teaching approximation than unbounded addition. Correlated exposure would require a different data model and an empirically justified dependency structure.

**Stochastic versus deterministic transitions.** The project wanted stochastic-looking counts but reproducible comparison. It chose deterministic pseudo-random Bernoulli and binomial decisions keyed by seed and entity. A fully random runtime draw would feel natural but could make the strategy winner change when a user repeats the same setup. A purely expected-value update would be deterministic but would yield fractional people or need awkward rounding. Keyed integer draws are the chosen middle ground.

== I.3 Graph and spatial-data alternatives

**Grid graph versus city-block synthetic graph.** A rectangular grid would be easy to implement and analyze, but it would make every street look structurally similar and weaken the demonstration of hubs, bridges, routes, and cuts. The selected synthetic builder creates homes, schools, hospitals, offices, blocks, and weighted road types. Its visual vocabulary supports intervention narratives while remaining explicitly fictional.

**One node type versus semantic node types.** A generic graph is mathematically sufficient for degree or betweenness. Semantic node types were added because intervention cost and explanation need a vocabulary. Quarantining a hospital, school, or office can be described and assigned a modeled population cost; a road intersection remains a connector. The decision introduces more complexity but avoids presenting a location recommendation as an anonymous vertex number.

**Raw OpenStreetMap geometry versus bounded reduced graph.** Importing all nearby roads would maximize visual detail but could create enormous graphs, unstable queries, unresponsive centrality computation, and unreadable maps. The importer therefore reduces and bounds geometry. This is a loss of geographic fidelity, but it is an honest and necessary one. A teaching simulator benefits more from a graph that a learner can inspect than from a city dataset that overwhelms the interface.

**Live map dependence versus fixtures.** Initially, curated demonstrations could use live OpenStreetMap import. This failed the actual requirement of reliable demonstration. The final choice bundles East Village and Shoreditch fixtures. The cost is that fixtures become static snapshots; the benefit is that a presentation can be repeated offline. A full production mapping system would need versioned local datasets and update policies, but that was outside scope.

**Geographic coordinates as epidemiological distance.** The project uses road geometry to organize a graph, not to infer physical transmission distance. Edge probabilities are synthetic model values. A road’s length or class may influence a weight or capacity proxy, but the report does not claim that this measures real contact probability. This decision preserves the distinction between topology and epidemiological calibration.

== I.4 Intervention-algorithm alternatives

**One composite “smart score” versus separate established strategies.** A combined score could mix degree, betweenness, probability, and capacity. It was rejected because its weights would be arbitrary and its winner hard to explain. The final design compares five methods with clear hypotheses. A learner can say why a bridge heuristic differs from a route heuristic.

**PageRank, eigenvector, closeness, or community detection.** These graph methods were plausible candidates. They were not selected because the five adopted strategies already cover a baseline, local degree, global shortest-path bridging, weighted routes, and structural cuts. Adding more would make comparison tables crowded and weaken the ability to explain each method in a timed demonstration. The report identifies these methods as possible extensions, not omissions caused by ignorance.

**Weighted betweenness versus unweighted Brandes.** A weighted form could incorporate edge distances or probabilities. It was not adopted because Dijkstra is already the designated probability-aware method. Keeping betweenness unweighted isolates its topology-based bridge interpretation. This is a teaching design choice; it should not be interpreted as a claim that real mobility is unweighted.

**Every-source/every-destination Dijkstra versus bounded major destinations.** Running every pair would produce a more exhaustive route count but costs more and creates a less interpretable candidate objective. The final route method focuses on initial sources and the largest qualifying destinations. This bounds computation and supports a narrative of blocking likely routes toward major destinations. The selected destination set is therefore a model assumption and should be displayed, not hidden.

**Global all-pairs min-cut versus one source–target min-cut.** A global cut could identify community separation but raises ambiguity about which populations should be separated. The adopted source–target formulation chooses an initial outbreak source and a prioritized hospital/major destination. It gives a concrete theorem-driven example and keeps computation small. Its output is conditional on that source–target choice.

**Soft intervention effect versus edge/node removal.** An intervention could reduce transmission probabilities rather than close roads or quarantine locations. Complete removal was selected because the user explicitly requested “which roads to close” and “which buildings to quarantine,” and because it makes graph transformation visible. A partial-effect extension would be more realistic but would require effectiveness probabilities and compliance assumptions.

== I.5 Fairness and outcome alternatives

**Different budgets per strategy versus common constrained budget.** Different budgets might allow each algorithm to show its best behavior, but such a comparison would be inequitable. The final system holds road, location, and population budgets common. Every strategy may propose many candidates, but the common filter turns candidates into comparable feasible plans.

**Strategy-specific stochastic seeds versus common random numbers.** Different seeds could sample a plausible range, but a difference in an individual comparison might be noise. The final protocol holds the deterministic seed and key scheme fixed. This supports a counterfactual reading: under the same synthetic chance realization, how does changing the intervention alter the trace? Multiple-seed uncertainty analysis is documented as future work.

**Single scalar score versus lexicographic outcome comparison.** An arbitrary weighted score could combine infection, deaths, cost, and duration. It was rejected because weights would hide a value judgment. The adopted order uses lower final cumulative infections first and lower modeled deaths second, while displaying other measures for inspection. This still contains a normative priority, but it is explicit and simple enough to debate.

**Always name one winner versus support ties.** A dashboard may be tempting to design around a single winner. The final rule allows ties and labels them as inconclusive. This is mathematically correct when outcome tuples coincide and academically healthier than claiming a spurious ranking.

**Use Random only as hidden control versus show it prominently.** Random is shown because it helps students evaluate whether a graph heuristic added value. Its presence is accompanied by explanation and tie safety. Hiding it would make the comparison look more sophisticated but less scientifically honest.

== I.6 User-experience and visualization alternatives

**Single dashboard versus guided five-step workspace.** The guided workspace was selected to communicate a pedagogical sequence. A single dashboard would reduce navigation but overload novices with controls. The chosen design preserves revisitation so it does not become a rigid wizard.

**2D only versus 2D plus 3D.** A 2D-only graph would be analytically clean and cheaper. The user requested a more impressive map, and the 3D miniature was added as a complementary contextual view. Retaining 2D was critical: a 3D scene should not be the only way to judge topology.

**Photorealistic city versus architectural model.** Full photorealism was rejected because it could imply geographical/epidemiological precision that the synthetic model lacks. The selected miniature uses richer architectural cues while maintaining a visibly constructed, tabletop character.

**Manual actions mixed with algorithms versus separated what-if mode.** Mixing manual closures into a strategy run would make outcomes hard to attribute. The final app lets a user explore manual actions but labels that path separately from the five-way comparison. This protects methodological fairness while keeping interactive play.

**Plain raw output versus recommendations and plain-English explanation.** Raw tables are necessary but not sufficient for a decision-support demonstration. The project adds recommendations with target, action, rationale, expected impact, and cost, plus a compact optional explanation. The explanation cannot alter the deterministic result and is framed in non-clinical language.

== I.7 Persistence, export, and deployment alternatives

**Browser-only local state versus server persistence.** Browser-only state is simple but makes sharing and scenario recovery weak. The web application includes server persistence and public share identifiers. The portable desktop mode substitutes a local JSON store because cloud database access is not required for an offline executable.

**PDF only versus CSV and share link.** PDF alone preserves presentation but not data; CSV alone preserves data but not visual context; a link supports interactive review but depends on a hosted path. The final three-mode export design recognizes all three uses.

**Hosted web application versus Windows portable executable.** The user ultimately preferred a desktop executable because a hosted website felt less dependable for presentation. The project therefore packages Electron Windows x64 portable output as the primary artifact. The web version remains useful for development and share pages, but the release framing privileges the portable demonstration.

**Electron installer versus portable executable.** A traditional installer could register an application and manage updates, but it adds permissions, installation friction, and presentation risk. The portable executable can be placed in a writable folder and run directly. The project records the caution that its companion data directory should be writable.

== I.8 Documentation alternatives

**Short README versus long technical review.** A README is efficient for setup instructions but cannot defend model assumptions, strategy fairness, implementation choices, QA evidence, and limitations. The requested report therefore acts as a full technical review. It includes formal notation, derived formulas, worked numerical examples, decision tables, test evidence, and ethical limitations.

**Invented academic citations versus carefully scoped references.** The report uses canonical references for concepts such as SIR, shortest paths, centrality, and max-flow/min-cut, and distinguishes those from project-specific implementation decisions. It does not falsely imply that a source validates the project’s synthetic parameters. This is a documentation integrity decision.

**Claim perfection versus record residual risk.** The documentation explicitly names OSM dependency behavior, portable-Windows environmental differences, parameter uncertainty, and objective mismatch. This makes the report more credible than a blanket claim of being “bug-free.”

== I.9 Ledger conclusion

The decision ledger has one repeated pattern. When an alternative would provide more realism, automation, or visual polish only by adding unvalidated assumptions or obscuring the discrete-mathematics lesson, the project selected the more explicit and bounded option. When an alternative would improve reproducibility or explainability without changing the pedagogical scope—such as shared domain types, keyed trials, fixture bundling, tie handling, capped imports, or a common budget filter—the project adopted it. This is the organizing principle behind the final artifact.
