= Intervention algorithms and constrained optimization

== Feasible action set

Every strategy produces a ranked candidate list, but the budget filter chooses only feasible actions. For an action set $A$, define $E_A$ as closed roads and $V_A$ as quarantined population-bearing nodes. The feasible set is

#align(center)[
  $F_B = {A : |E_A| ≤ b_e, |V_A| ≤ b_v, ∑_(v ∈ V_A) N_v ≤ b_p}.$
]

The code selects node actions first in candidate order, skipping a candidate whose population would exceed $b_p$, then selects edge actions until $b_e$ is reached. This lexical procedure is straightforward and inspectable. It is not presented as a globally optimal mixed integer program; the project compares heuristics under a shared constrained rule.

== Random baseline

The Random strategy shuffles population-bearing nodes and roads using a seed $sigma+101$. It exists as a baseline, not as a recommended policy. Including it is methodologically valuable: an informed strategy should be judged against a reproducible uninformed allocation, and Demonstration Mode can show that chance can occasionally align with a useful corridor. A Random unique win is explained as a seeded scenario result, never a universal claim.

== Highest degree

For an undirected graph, degree is

#align(center)[
  $d(v)=|{e ∈ E : v ∈ e}|.$
]

The strategy orders vertices by decreasing $d(v)$. An edge receives the sum of its endpoint degrees,

#align(center)[
  $s_d({u,v})=d(u)+d(v),$
]

and roads are ordered by decreasing score. The idea is that a high-degree location offers many direct contact opportunities; reducing access there can be strong when local hubs dominate the paths. It can fail when a moderate-degree bridge separates larger regions, which motivates betweenness.

== Betweenness centrality

Betweenness measures how often a vertex lies on shortest paths between other pairs:

#align(center)[
  $C_B(v)=∑_(s ≠ v ≠ t) sigma_(s,t)(v)/sigma_(s,t),$
]

where $sigma_(s,t)$ is the number of shortest paths from $s$ to $t$ and $sigma_(s,t)(v)$ the number passing through $v$. The implementation follows Brandes’ unweighted algorithm [4]. For each source it performs breadth-first discovery, records predecessor lists and path counts, then back-propagates dependencies. Since the graph is undirected, final scores are divided by two to avoid double counting ordered pairs.

Brandes reports $O(n m)$ time for unweighted networks and $O(n m+n^2 "log" n)$ for weighted networks, using $O(n+m)$ space [4]. At the project’s capped teaching scale, the unweighted version is transparent and sufficiently responsive. Edges are ranked by the sum of their endpoint vertex scores. The chosen semantics are “bridge-like locations frequently on topological shortest paths,” not “statistically estimated movement corridors.”

== Dijkstra route blocking

Transmission probability is converted into an additive nonnegative edge cost:

#align(center)[
  $w_e=-"ln"("max"(0.0001,"min"(0.9999,tau_e))).$
]

For a path $pi$, the total cost is

#align(center)[
  $∑_(e ∈ pi) w_e=-"ln"(∏_(e ∈ pi) tau_e).$
]

Because $-ln(x)$ is strictly decreasing on $(0,1]$, minimizing the transformed path cost is equivalent to maximizing the product of edge probabilities. This is the mathematical justification for using Dijkstra’s algorithm on nonnegative weights [6]. The strategy computes routes from initial outbreak locations to the five largest non-infected population destinations, counts how frequently each road appears, and ranks roads by that count. Endpoint occurrence counts induce a node ranking. It therefore targets repeatedly likely source-to-major-destination routes, not merely the nearest road.

== Max-flow/min-cut

Each road receives a capacity $c(e)$ derived from its class or imported class proxy. The graph is represented symmetrically in a residual network. Starting at the initial infected vertex, the implementation finds augmenting paths by breadth-first search, subtracts bottleneck capacity, adds reverse capacity, and continues until no augmenting path reaches the selected target. The target prioritizes a hospital if available, otherwise the largest population-bearing destination.

For a cut partition $(S,T)$ with source in $S$ and target in $T$, capacity is

#align(center)[
  $c(S,T)=∑_(u ∈ S, v ∈ T) c(u,v).$
]

The max-flow/min-cut theorem equates the maximum achievable flow with the minimum cut capacity [5]. After augmentations, vertices reachable from the source in the residual network form $S$; original roads crossing from reachable to non-reachable vertices are min-cut candidates. This strategy is most interpretable when a small capacity-limited separation disconnects source and destination regions. Capacities are a structural proxy, not observed passenger counts.

== Comparison objective

For every feasible plan, the engine evaluates a shared baseline cumulative infection total $C_0$ and computes containment

#align(center)[
  $eta(A)="clip"_(0,1)((C_0-C_A)/C_0).$
]

The declared primary comparison order is lower final cumulative infections, then lower modeled mortality. The system also reports peak active infections, peak day, duration, budget use, components after intervention, actions, and hotspot scores. This keeps the winner rule concise while leaving the learner able to inspect trade-offs rather than treating a single scalar as the only value judgment.
