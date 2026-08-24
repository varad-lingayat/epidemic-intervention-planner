#pagebreak()
= Appendix K — Complete module, data-flow, and review audit

This appendix is a map for a technical reviewer. The aim is not to reproduce every source line; source control already preserves that. The aim is to state what each important module is responsible for, which data it accepts, what it returns, what assumptions it is allowed to make, and what a reviewer should inspect if behavior appears incorrect. A useful technical review follows data through the system, rather than treating files as an unstructured list.

== K.1 Domain layer inventory

| Module or contract area | Main responsibility | Inputs | Outputs | Review invariant |
|---|---|---|---|---|
| Shared types | Defines CityGraph, nodes, edges, parameters, plans, outcomes | Type declarations | Common compile-time vocabulary | Client and server agree on identifiers and optional fields |
| Synthetic graph builder | Creates a bounded teaching city | Seed/configuration | Typed city graph with semantic nodes and weighted roads | IDs unique; road endpoints exist; population valid |
| Epidemic engine | Calculates daily count transitions | Graph, parameters, actions, seed | Timeline, totals, derived metrics | Per-node conservation and deterministic replay |
| Intervention planner | Ranks candidates and returns feasible actions | Graph, source/evidence context, budget | Plan and explanatory rationale | Does not exceed road/node/population budget |
| Demonstration presets | Defines curated teaching scenario inputs | Preset identifier | Graph fixture choice and parameters | Each preset is reproducible and intentionally named |
| Fixture loader | Supplies offline road graphs | Demonstration preset | Bundled graph snapshot | No live OSM request for curated demo |
| 3D model rules | Maps graph semantics to geometry profiles | Node/edge metadata | Pure building/road visual profiles | Visual type matches domain type |

The shared-type decision is a form of executable documentation. If a field is renamed or narrowed in the domain model, the compiler surfaces client/server uses that need review. This is safer than duplicating a `nodeId`, `roadId`, or `strategy` shape in several unrelated files. It does not eliminate all logic bugs, but it prevents a large class of integration mistakes before runtime.

== K.2 Scenario creation data flow

The following flow applies when a user starts from the standard synthetic teaching scenario.

```text
1. Workspace selects standard graph configuration.
2. Synthetic builder generates semantic nodes and roads with stable IDs.
3. Setup controls supply θ: transmission, recovery, mortality, horizon, budget, seed.
4. Initial infection choice supplies X(0) or source identifiers.
5. Optional symptoms/evidence supply hotspot inputs.
6. User requests a baseline or five-way comparison.
7. Shared engine/planner return immutable result objects.
8. Client renders timeline, graph state, table, recommendation cards, and analysis.
```

Each arrow is a possible review boundary. For example, if a slider visually changes but the comparison result does not, inspect the conversion from control state to parameter vector. If a selected node is marked but the timeline remains unchanged, inspect the action-to-active-graph transformation. If CSV contains different totals from the comparison card, inspect the outcome-summary serialization. The data flow makes fault isolation more systematic than general debugging.

The builder uses deterministic construction rules so the standard teaching case can be reset. Generated geometry is a model aid. Node coordinates help render a city-like shape and roads, but they do not change the fact that locality and population are synthetic. A reviewer should verify that all edge endpoints resolve to known node identifiers and that road class/weight fields have admissible values before asking algorithmic questions.

== K.3 Real-road import data flow and explicit semantic gap

The bounded OpenStreetMap importer follows a distinct path.

```text
request parameters → input validation → cached response lookup
  → endpoint attempt / failover → raw OSM way/node data
  → bounded graph reduction → normalized CityGraph
  → synthetic population/model enrichment → workspace scenario
```

The semantic gap occurs between normalized road geometry and synthetic epidemiological enrichment. An imported road node or edge may preserve coordinate and road-class information, but it does not become a real household, school population, infection record, or mortality observation. The software must not fill that gap silently with a claim of factual realism.

The importer’s cap is an important resource invariant. A request that would exceed the maximum manageable node/edge count is rejected with a specific oversized-network result. This is better than allowing centrality or 3D rendering to freeze. The cache avoids repeated identical public queries and helps recover from transient endpoint conditions. Failover is used only after a recognized failure; it is not a looping retry mechanism that could overload an external service.

For review, inspect three different classes of importer result: a normal compact graph, an oversized error, and an unavailable-service error. Each should leave the prior workspace scenario stable. A failed import must not replace a known teaching graph with a half-parsed network.

== K.4 Engine input/output audit

At a run boundary, the engine should be treated as a pure function conceptually equivalent to

```text
simulate(G, θ, initialState, actionSet, evidence, seed) → RunResult
```

The actual TypeScript call structure may use multiple helper functions, but the data-contract idea is stable. `RunResult` contains a sequence of daily counts, node-level or graph-level state as needed by the visual layer, cumulative values, peak values, duration, and comparison-ready metrics. It should not contain mutable React state, DOM references, arbitrary API responses, or user-interface strings. Keeping result data plain makes it serializable for persistence, sharing, CSV, and the local desktop store.

The engine receives actions as inputs; it does not call the intervention planner while transitioning each day. This is a major causal boundary. A plan is selected once from the pre-run context, then applied as a fixed scenario intervention. If the engine replanned every day without the interface making that policy explicit, it would be simulating adaptive control rather than a single budget-constrained intervention. Adaptive policies are valuable research topics, but they are not what the five named strategies are intended to compare here.

Review questions for the engine include the following.

| Review question | Correct evidence location | Typical failure symptom |
|---|---|---|
| Are people conserved? | Daily transition unit tests and node counts | Total population drifts |
| Are actions applied? | Active-graph helper and closure tests | Closed road still transmits |
| Are outputs repeatable? | Seed/key tests | Same run gives different winner |
| Is time synchronous? | Transition-order code and multi-node test | Node ordering changes outcome |
| Are probabilities bounded? | Input clamps and exposure helper | NaN, negative, or >1 risk |
| Is baseline isolated? | Comparison runner | Baseline contains a prior plan |

== K.5 Planner input/output audit

The planner consumes the graph and scenario context but returns candidates before final plan selection. This enables each strategy to expose *why* it ranked a node or edge. For example, an output can say that Highest Degree selected a connector based on incident roads, Betweenness selected a bridge based on shortest-path dependence, Dijkstra selected a repeated likely route road, or Min-Cut selected a boundary edge.

The common feasibility function is a reusable guard rather than copied logic. Its input is an ordered candidate list and budget triple. Its output must be a subset of candidates. It should never create actions that were not ranked, and it must produce aggregate cost accounting. A reviewer should test both an ample-budget case, in which early candidates all pass, and a constrained case, in which a high-population node is skipped and a later node may be considered.

The recommendation writer consumes a plan and result. It does not invent new locations. A textual explanation can say “quarantine the selected school because it lies on many shortest paths,” but it cannot replace the selected school with a more rhetorically appealing target. This separation between computation and prose extends to optional LLM explanations.

== K.6 Demonstration mode audit

The curated Demonstration Mode is a teaching product, not an implicit benchmark. Its five scenarios are chosen so that the five strategies each have a context in which their structural hypothesis produces a leading result under the defined fairness protocol. The scenarios are named to make the intended lesson visible: chance alignment, hub protection, bridge protection, route blocking, and cut separation.

Demonstration flow is

```text
Demonstration button
  → choose curated preset
  → fixture loader resolves offline graph
  → preset applies parameters, seed, budget, sources, evidence
  → comparison executes through normal common runner
  → presenter notes and expected teaching narrative appear
```

The key review invariant is that the preset does not call the live OSM importer. A web browser or desktop app may have no network connection during a presentation. Fixture content must therefore be part of the compiled client assets. The package verification used stable embedded preset/fixture data, not a source-level export-name search, because minification can change symbol names.

The second invariant is transparency: curated winner scenarios are not evidence that a strategy wins generally. The presenter notes explain that the scenario was constructed to illustrate a particular structural condition. The ability to return to the standard teaching scenario and adjust values restores exploration after the scripted demonstration.

== K.7 Visualization and interaction audit

The 2D and 3D views are both projections of the same graph/result state. Neither owns an independent disease model. Selection in either view may update UI focus; it should not mutate infection counts. A visual outbreak halo must derive from the current state; it should not be a random decorative animation whose intensity contradicts the displayed counts. Quarantine fencing must derive from a selected node action; it must not appear merely because a node is a school.

The 2D transform state includes scale and translation. The 3D state includes camera configuration and controlled scene effects. Each should be reset or reinitialized appropriately when the graph changes. Reviewers should check: selection matches stable identifiers; closed roads show a changed style; pan does not lose selection identity; zoom bounds prevent unusable scale; theme switches do not erase semantic colors; and animations do not change core results.

The decision to keep a 2D analytical mode is a validation control. A reviewer can compare the 3D miniature’s apparent geography with a simple topological drawing. If an intervention seems visually surprising, the 2D graph often makes its degree, bridge, or route context easier to inspect.

== K.8 Persistence, sharing, and local desktop audit

For the hosted mode, scenario records and reports move through typed server procedures to persistence. A share identifier exposes a restricted public representation, not raw database access. The record must retain enough information to reconstruct the scenario: graph identity or serialized graph data, parameters, action context, comparison result metadata, and creation details. A share view should be treated as a snapshot, not as a dynamically re-running live external import.

For desktop mode, a local file-based store replaces cloud database operations. The principle is to keep the portable executable usable when no hosted services are available. Local data should reside beside the portable application in a writable directory. The design does not promise enterprise backup, multi-user synchronization, or secure medical record storage. It persists educational scenarios and reports for a single portable user context.

Data-flow review should ensure that serialization preserves deterministic fields. If a saved scenario loses its seed, it may rerun to a different trace. If a share view loses manual-action distinction, it may misrepresent a fair strategy comparison. The contract must therefore serialize the scenario description, not only a human-readable summary.

== K.9 Explanation and export audit

The optional explanation path begins after deterministic results exist. It receives a concise structured payload of leading strategy, results, budget, selected actions, major assumptions, and audience instructions. It returns prose for nontechnical decision-makers. This is intentionally a one-way explanatory flow:

```text
engine / planner result → compact explanation payload → explanatory text
```

There is no backward arrow from explanatory text into an action plan. If the explanation endpoint is unavailable, user-visible deterministic cards still supply outcomes and rationale. Reviewers should test an explanation failure path for a graceful message and ensure that a large graph payload is not unnecessarily sent.

The CSV path serializes comparison metrics; the PDF path captures presentation content; the share path retrieves a persistent view. These exports should name model projections clearly. In particular, a CSV column such as “modeled deaths” must not be renamed “actual deaths” during export. Semantic wording is a data-contract requirement, not a cosmetic preference.

== K.10 Build, package, and release audit

The production release pipeline can be understood as a sequence of transformations:

```text
TypeScript source
  → type check and unit/rendered tests
  → production client build and server bundle
  → desktop runtime staging
  → Electron builder portable Windows artifact
  → archive/content verification and checksum
  → user-device smoke test
```

Each stage proves a different thing. Type checking proves contract consistency, tests prove specified behavior, a production build proves bundling compatibility, staging proves resource arrangement, the Electron artifact proves a distributable file exists, content verification proves critical assets are present, and a Windows smoke test proves the user-facing environment launches. These must not be collapsed into “build succeeded.” A build can succeed while missing a fixture; a fixture can be present while an antivirus policy blocks launching; a launch can work while a live import endpoint is unavailable.

The project previously corrected a production issue in static serving by preventing a Vite development plugin from being imported in the desktop production path. This illustrates why release builds deserve their own review. Development servers often mask conditions absent from the packaged environment. The final inspection verifies that no development plugin reference remains in the packaged archive and that the offline demonstration assets are embedded.

== K.11 Reviewer walkthrough

A technical reviewer can follow this compact walkthrough.

1. Open the standard scenario and note graph, parameter, budget, seed, and source values.
2. Run baseline and five-way comparison; record the shared metadata.
3. Inspect each strategy plan and verify action costs do not exceed budget.
4. Use 2D view to inspect selected roads/nodes; compare to the strategy rationale.
5. Play timeline to verify finite daily evolution and totals.
6. Switch to 3D view as a contextual visualization, not as independent evidence.
7. Try a manual closure and confirm it is separate from strategy results.
8. Run a curated offline demonstration without requesting live map import.
9. Export CSV/PDF or open share view; verify scenario-model language is retained.
10. Reset to the standard scenario; confirm no stale actions or transforms remain.

The walkthrough demonstrates not just feature availability but the intended separation of concerns. It asks the reviewer to test critical boundaries where a product might otherwise look correct while silently mixing data, action states, or environments.

== K.12 Final audit conclusion

The system is organized around an inspectable flow: typed scenario description to pure model calculation, strategy candidate ranking to common feasible plan, result to visualization/export/explanation, and source build to validated desktop artifact. This organization is the practical complement to the mathematical specification. It gives a lecturer, examiner, or future maintainer a way to answer the most important technical question: *when the screen says a method is leading, which graph, assumptions, budget, rule, and packaged resource produced that claim?*
