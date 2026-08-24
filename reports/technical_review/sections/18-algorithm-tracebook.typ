#pagebreak()
= Appendix F — Algorithm execution trace and strategy-by-strategy audit

The simulator deliberately compares five established methods rather than inventing a black-box “best intervention” algorithm. That choice keeps the project appropriate for a second-year discrete mathematics course: each method has a recognisable graph-theoretic idea, a visible failure mode, and a different structural hypothesis. This appendix records the operational trace of every strategy. The decisive distinction is between **candidate generation** and **feasible-plan construction**. A strategy may rank every vertex and edge; the common budget filter decides which ranked candidates become actual closures or quarantines.

== F.1 Shared comparison skeleton

All strategies enter the same runner. The runner freezes the scenario graph, parameters, evidence, horizon, initial infections, budgets, and deterministic seed before candidate generation begins. It calculates a no-algorithm baseline once, then evaluates one plan per strategy. The comparison uses a fresh copy of the graph and fresh state for each plan. No strategy inherits a road closure, recovery, infection, or random trial from the strategy evaluated immediately before it.

```text
input: graph G, parameter vector θ, evidence E, budget B, initial state X(0), seed σ
baseline = simulate(G, θ, E, no actions, X(0), σ)

for h in {Random, Degree, Betweenness, Dijkstra, MinCut}:
  candidates_h = rankCandidates(G, θ, E, h)
  A_h = commonBudgetFilter(candidates_h, B)
  result_h = simulate(G, θ, E, A_h, X(0), σ)

compare results by (final cumulative infections, modeled deaths)
mark tied if the best metric tuple occurs more than once
```

This skeleton was chosen instead of letting every strategy decide its own budget semantics. Without a common filter, a strategy that recommends more closures could look better merely because it spent more resource. It was also chosen instead of reseeding every run. Different seeds would make a performance difference ambiguous: was the intervention better, or did it receive a luckier random trace? Common keyed trials do not make a model objectively true, but they make within-scenario comparison auditable.

== F.2 Random: required baseline, not an endorsement

Random takes the eligible population-bearing nodes and roads, applies a deterministic seeded shuffle, and passes the shuffled lists to the common budget filter. The seed offset is fixed relative to the scenario seed, so the same scenario always gives the same random plan. The result is therefore *reproducibly random* in the educational sense.

```text
eligibleNodes = populationBearingVertices(G)
eligibleEdges = roads(G)
nodeOrder = seededShuffle(eligibleNodes, σ + constant_1)
edgeOrder = seededShuffle(eligibleEdges, σ + constant_2)
return { nodes: nodeOrder, edges: edgeOrder }
```

The Random strategy is included to establish a null baseline: it shows what a budget allocation looks like when it ignores graph structure. It is not included to imply that chance is a public-health policy. The system explicitly guards against a communicative error that would be especially awkward in a demonstration: if Random happens to tie or appear first in a non-tie sort, the interface must not describe it as a unique superior method. The tie-aware scorecard reports an inconclusive result when the best tuple is shared.

Random can occasionally produce a unique win in a deliberately curated teaching fixture. The correct interpretation is narrow. A randomly chosen road can happen to coincide with a critical bridge or high-probability route. That event demonstrates why one scenario is not a universal method ranking. It does not overturn the structural motivation for the other four algorithms.

== F.3 Highest Degree: local connectivity heuristic

The degree of a vertex is the number of incident edges. For undirected graph $G$, the implementation counts every road at both endpoints. A vertex candidate is ranked by decreasing degree, with stable identifier order resolving equal scores. An edge candidate is ranked by the sum of its endpoint degrees. This edge score is not a separate theorem; it is an interpretable induced heuristic that favors roads connected to locally well-connected places.

```text
d(v) = | { e ∈ E : v is an endpoint of e } |
nodeScore(v) = d(v)
edgeScore({u,v}) = d(u) + d(v)
```

The method’s hypothesis is local: contacts and potential routes concentrate around highly connected places. If a graph has a school, office, or junction at the center of many roads, placing a constrained intervention there can remove several immediately available connectors. This method is cheap to compute—one pass over all edges produces every degree—and easy to explain at the interface.

It can nevertheless fail. Two dense districts may each contain high-degree vertices, while a low-degree connector lies between them. Closing the connector can separate the districts more effectively than closing a local hub. It can also be confounded by imported geometric detail: an area with many short map segments can have high topological degree without representing proportionally greater meaningful movement. These limitations justify comparing degree with betweenness and cut-based methods instead of labeling it “optimal.”

== F.4 Betweenness: shortest-path bridge heuristic

Betweenness centrality asks how frequently a vertex occurs on shortest paths between other vertices. Let $σ_(s,t)$ be the number of shortest paths from source $s$ to target $t$, and let $σ_(s,t)(v)$ be the number that pass through $v$. The conceptual score is

```text
C_B(v) = Σ_(s ≠ v ≠ t) σ_(s,t)(v) / σ_(s,t)
```

The code follows the unweighted Brandes-style structure. For each source, it performs breadth-first discovery, records distances, predecessor lists, and counts of shortest paths, then processes the discovery stack in reverse to accumulate dependencies. Because the study graph is undirected, the final score divides paired ordered-source contributions appropriately. Candidate edges receive the sum of their endpoint scores, providing a consistent node-and-road selection interface.

```text
for source s:
  BFS from s
  for each reached w: record predecessors P[w] and path count σ[w]
  process stack in reverse BFS order
  pass dependency δ[w] backward through P[w]
  add δ[w] to the centrality score of non-source vertices
```

The method’s hypothesis is global but topological: a high-score vertex lies on many *shortest* connector sequences. It does not know actual travel time, traffic volume, social mixing, or capacity unless these coincide with the graph topology. This distinction belongs in the report because “central” in graph theory is not identical to “important” in epidemiology. The algorithm becomes pedagogically valuable precisely because the learner can contrast its bridge intuition with the local-hub intuition of degree.

At typical capped teaching sizes, the unweighted procedure is responsive enough for interaction. A more exact weighted centrality calculation could be included, but it would complicate the explanation and would blur the contrast with Dijkstra, which already demonstrates probability-weighted paths. The selected implementation therefore trades physical realism for conceptual separability.

== F.5 Dijkstra route blocking: probability as additive cost

Dijkstra’s algorithm requires nonnegative additive edge weights. Epidemic transmission along a route is naturally presented as a product of simplified per-edge probabilities. The project uses a negative logarithm transformation to bridge the two forms. For clipped $τ_e$ strictly between zero and one,

```text
w_e = −ln(τ_e)
Σ_(e in path π) w_e = −ln( Π_(e in π) τ_e )
```

Since the logarithm is monotonic, minimizing the sum of transformed costs is equivalent to maximizing the product of edge probabilities. The edge-probability cap is therefore not just defensive programming: it prevents $ln(0)$ and preserves a finite nonnegative cost. If an implementation also includes a global multiplier in its route notion, it can multiply or otherwise reflect that factor consistently before the transform; the critical property is that larger opportunity corresponds to lower cost.

The planner starts from the initial outbreak locations. It identifies a bounded set of significant non-infected population destinations—implemented as the largest qualifying destinations—then runs shortest-path search toward them. Each road that occurs on a selected route receives an occurrence count. Roads are ranked by this count; endpoints of frequently selected roads induce a node order.

```text
for source in initialSources:
  for target in majorPopulationDestinations:
    π = Dijkstra(G, source, target, w)
    for edge e in π: routeCount[e] += 1

edgeScore(e) = routeCount[e]
nodeScore(v) = sum of incident route counts
```

The resulting intervention targets repeatedly likely source-to-major-destination *model routes*, not every short path in the graph. This is a deliberately bounded computation. Routing to every vertex would be slower, less interpretable, and would overstate resolution that the synthetic road probabilities do not support. Conversely, restricting to a handful of major destinations makes the method sensitive to that selection rule; this is a known limitation documented in the strategy rationale.

== F.6 Max-flow/min-cut: structural separation heuristic

The max-flow/min-cut method transforms the road graph into a symmetric residual-capacity network. Road capacities are structural proxies derived from road class or imported class proxy, not observed passenger counts. The source is an initially infected vertex; the target is prioritized as a hospital if the graph includes one, otherwise a large qualifying population destination. This target policy turns “cut a city in half” into a more concrete educational question: what small structural separation lies between the outbreak source and a major protected destination?

```text
initialize residual capacity r(u,v) from symmetric road capacities
while an augmenting source-to-target path exists:
  b = minimum residual capacity on the path
  subtract b from forward residual arcs
  add b to reverse residual arcs

S = vertices reachable from source in final residual network
cutEdges = original edges with one endpoint in S and one outside S
```

The max-flow/min-cut theorem guarantees that the final maximum flow equals the capacity of a minimum source–target cut under the defined capacities. The theorem does *not* say the selected roads are the epidemiologically optimal closures. Their meaning depends on the capacity construction and the choice of source/target. In this simulator, the method is an instructive containment heuristic: if a small boundary separates the outbreak from a protected region, a constrained cut can be compelling.

The capacity proxy is a major documented decision. Using capacity rather than transmission probability distinguishes the min-cut strategy from Dijkstra. Dijkstra follows high-probability routes; min-cut finds low-total-capacity separation. They may select different roads for a good mathematical reason. If the application simply used the same $τ_e$ value for both without an explicit conceptual distinction, the comparison would be less educational.

== F.7 From rankings to recommendations

After each strategy produces candidate lists, the common budget filter returns a plan. The plan carries the strategy name, selected nodes, selected roads, aggregate cost, and rationale fragments. The simulation then computes outcome statistics. The recommendation layer takes the first few actions of the leading plan and combines action type, target label, budget cost, local hotspot score, and strategy-specific reason. This layer was intentionally separated from the planner so that a change in prose does not change mathematical selection.

The ranking-to-recommendation pipeline contains several defensible non-decisions. It does not merge all five rankings into an ensemble score, because that would introduce a sixth unvalidated algorithm. It does not secretly improve one strategy’s candidates using hotspot evidence, because evidence must be held fixed and common. It does not automatically execute a real closure. It only describes a model action under an academic scenario.

== F.8 Comparative interpretation matrix

| Strategy | Structural hypothesis | Primary candidate score | Typical strength | Characteristic failure mode |
|---|---|---|---|---|
| Random | No graph signal is used | Seeded shuffle position | Required neutral baseline | Luck can mimic insight in one small scenario |
| Highest Degree | Local hubs concentrate opportunity | Incident-edge count | Very fast, intuitive hub protection | Misses low-degree bridges |
| Betweenness | Shortest-path bridges mediate connectivity | Brandes shortest-path dependency | Identifies topological gateways | Shortest paths need not match movement |
| Dijkstra | High-product-probability routes matter | Repeated transformed shortest-route occurrence | Uses edge opportunity weights | Depends on chosen destinations and probability proxy |
| Max-Flow/Min-Cut | A small capacity boundary can contain spread | Residual-network cut membership | Explains structural separation | Depends on capacities and source–target pair |

The matrix is the central teaching value of the project. A winning strategy is not announced as globally best. It is presented as the method whose structural hypothesis produced the lowest modeled outcome under one fully specified graph, parameter vector, budget, evidence set, and deterministic trial protocol.
