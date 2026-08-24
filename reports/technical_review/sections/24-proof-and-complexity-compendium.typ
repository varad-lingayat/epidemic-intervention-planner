#pagebreak()
= Appendix L — Proof sketches, complexity bounds, and numerical design compendium

This final technical appendix gathers the core formal arguments in one place. The project is a software implementation, not a theorem paper, so these are proof sketches tied to the implemented assumptions. Their purpose is twofold. First, they show why the calculations preserve the properties the interface claims. Second, they make the computational cost of each choice visible, which is necessary when a graph is imported or when a classroom user changes a parameter and expects an interactive response.

== L.1 Proposition: population conservation is preserved

**Claim.** If a population-bearing vertex starts day $t$ with nonnegative integer compartment counts satisfying

```text
S + I + R + D = N,
```

and if new infection count $Y$ satisfies $0≤Y≤S$, recovery count $Z$ satisfies $0≤Z≤I$, and death count $W$ satisfies $0≤W≤I−Z$, then the sequential update

```text
S' = S − Y
I' = I + Y − Z − W
R' = R + Z
D' = D + W
```

produces nonnegative integer counts that also sum to $N$.

**Proof sketch.** Integers remain integers because subtraction and addition of integers preserves integrality. Since $Y≤S$, $S'=S−Y≥0$. Since $Z+W≤I$, $I−Z−W≥0$ and thus $I'=I−Z−W+Y≥0$. The recovered and deceased updates add nonnegative values. Summing the four equations cancels $-Y$ with $+Y$, $-Z$ with $+Z$, and $-W$ with $+W$, leaving $S+I+R+D=N$. The argument applies independently at every population-bearing node. Summing across nodes proves city-wide conservation as well.

This proof identifies why transition order matters. If deaths were sampled from the initial $I$ after recoveries were sampled from that same $I$, the condition $Z+W≤I$ would not automatically hold. The selected sequential availability rule provides exactly the premise required by the proof.

== L.2 Proposition: elementary and aggregate exposure probabilities are bounded

**Claim.** For $0≤x≤1$ and nonnegative integer $m$, the quantity

```text
q = 1 − (1−x)^m
```

lies in $[0,1]$. If $q_1,...,q_k$ all lie in $[0,1]$, then

```text
p = 1 − product over i of (1−q_i)
```

also lies in $[0,1]$.

**Proof sketch.** For $x$ in the unit interval, $1-x$ is in the unit interval. Raising a unit-interval value to nonnegative integer power remains in the unit interval. Its complement is therefore also in the unit interval. For aggregate exposure, every complement $1-q_i$ is in the unit interval; the finite product is in the unit interval; subtracting that product from one leaves a value in the unit interval. No post hoc clipping is needed to make the probability valid, although the implementation also validates input before evaluation.

The result has useful monotonicity. Increasing any one $q_i$ cannot reduce $p$, because it reduces one factor in the nonnegative product. Increasing source infection count $m$ cannot reduce $q$ for fixed $x$, because $(1-x)^m$ is nonincreasing in $m$ when $0≤1-x≤1$. These claims match the intuitive direction of the visual risk display without claiming that the probabilities are calibrated observations.

== L.3 Expected value and variance of the binomial transition

Let $Y$ denote the new-infection count at a susceptible pool of size $S$ under daily probability $p$. Under the engine’s independent-trial approximation,

```text
Y ~ Binomial(S,p)
E[Y] = S p
Var[Y] = S p (1−p)
```

The expectation follows by writing $Y=X_1+...+X_S$, where $X_i$ is an indicator for person $i$ receiving the simplified event. Linearity of expectation gives $E[Y]=Σ E[X_i]=S p$. Under independent indicators, variance adds and each indicator has variance $p(1-p)$, giving $S p(1-p)$. The implementation returns an integer keyed draw rather than the expectation; the expectation nevertheless explains the average direction of changes in a parameter sweep.

The standard deviation is

```text
SD[Y] = squareRoot( S p (1−p) )
```

For a small illustrative pool with $S=180$ and $p=0.20$, the expected count is 36 and the standard deviation is approximately 5.37. A single deterministic trace might return 31 or 42 without contradicting the model. The scenario’s seed makes the realized integer reproducible; it does not remove the conceptual stochasticity represented by the binomial formulation.

== L.4 Proposition: active intervention graph is a subgraph

**Claim.** Given original graph $G=(V,E)$ and action sets consisting of selected road closures $E_A$ and quarantined vertices $V_A$, the active graph $G_A$ has vertex and edge sets that are subsets of the original graph’s vertex and edge sets.

```text
V_A_active ⊆ V
E_A_active ⊆ E
```

**Proof sketch.** A closure action removes an existing edge from consideration; it never adds an edge. A quarantine action removes or disables a known vertex’s usable incidence; it never introduces a vertex or road. Therefore every traversable node and edge after action existed before action. The proof is simple, but its product implication is important: an intervention cannot create a new transmission path through a graph bug. The graph view may retain a quarantined vertex for visual annotation, but the transmission adjacency structure observes the subgraph rule.

A related monotonicity statement deserves careful wording. Removing edges cannot create a new simple path that did not already exist. It can, however, change which remaining path is shortest or most probable among survivors. Thus an intervention can change Dijkstra route ranking without violating subgraph monotonicity. This is one reason the planner selects a plan before the simulation rather than dynamically re-ranking every day without disclosure.

== L.5 Budget feasibility theorem for the common filter

**Claim.** If a greedy budget filter begins with zero selected node count, road count, and selected population; only adds a node when doing so would not exceed $B_v$ or $B_p$; and only adds a road when doing so would not exceed $B_e$, then its output plan is feasible.

**Proof sketch by induction over candidate order.** Initially, all three resource sums equal zero and are feasible because budgets are nonnegative. Assume the selected prefix is feasible. For the next candidate node, the filter either skips it, preserving feasibility, or adds it only after checking that node count plus one is at most $B_v$ and population plus its nonnegative cost is at most $B_p$. For the next road, the filter skips it or adds it only when road count plus one is at most $B_e$. Hence feasibility remains true after each candidate. By induction, the final plan is feasible.

The theorem proves feasibility, not optimality. Greedy ranking plus budget acceptance does not solve a general joint integer optimization problem. That distinction is intentionally preserved in the interface and report. The planner’s result means “the highest-ranked feasible prefix under this strategy and filter,” not “the globally optimal policy.”

== L.6 Complexity of graph construction and one daily engine step

Let $n=|V|$, $m=|E|$, and $T$ be number of days. A bounded synthetic graph builder typically runs in time proportional to the number of nodes and constructed roads, so $O(n+m)$. Memory is also $O(n+m)$ for node/edge records and adjacency representation.

One daily transition requires traversing active connectors to aggregate source opportunities and visiting population-bearing nodes to apply count transitions. With adjacency lists, the dominant graph scan is $O(n+m)$ in the usual bounded model representation. Over a horizon of $T$ days, the direct engine cost is

```text
O( T (n+m) )
```

plus the cost of individual simplified binomial trial sampling if that is implemented literally as one loop per available person. Let $P=Σ N_v$ be total modeled population. In the worst literal trial implementation, a daily update can include $O(P)$ indicator work, giving $O(T(n+m+P))$. The project caps teaching graph size and modeled quantities accordingly. A future high-scale system would use a more efficient binomial sampler rather than iterating every conceptual person.

This estimate explains two product choices. First, imported graphs are bounded before they reach repeated algorithms. Second, the application uses scenario-level populations suitable for a teaching simulator, not millions of individual agents. These are performance and scope decisions, not assertions that a real city has only a few hundred people.

== L.7 Complexity of Highest Degree and Random

Degree computation requires one pass over edges, incrementing endpoint counters. Its time is $O(m)$ and its storage is $O(n)$. Sorting candidates is $O(n log n)$ for nodes and $O(m log m)$ for roads. The total is therefore dominated by sorting after linear scoring:

```text
O(m + n log n + m log m)
```

Random’s seeded shuffle is linear after arrays are constructed, typically $O(n+m)$, followed by the common linear scan/filter. It does not need centrality, shortest paths, or residual networks. The project includes it precisely because it provides a low-computation non-structural reference.

Stable tie-breaking by identifier is a small computational decision with outsized reproducibility value. Equal degree or equal pseudo-random selection position should not become environment-dependent array-order behavior. Stable order makes a saved scenario reviewable and prevents presentation differences caused by a nonsemantic sort implementation.

== L.8 Complexity and correctness intuition of Brandes betweenness

For unweighted graphs, the Brandes method runs breadth-first search from each source. One BFS plus accumulation is $O(n+m)$. Repeating it for all sources yields

```text
O( n(n+m) )
```

with $O(n+m)$ working memory per source for predecessor lists, distances, path counts, and stack/queue structures. This is dramatically better than enumerating every source-target pair and all their shortest paths naively, which can be exponential in the number of equal shortest paths.

The correctness intuition is dependency accumulation. During BFS from source $s$, each reached vertex has a distance and a count of shortest paths from $s$. Processing vertices in reverse distance order lets a vertex distribute dependency back to its predecessors in proportion to their shortest-path counts. Every downstream shortest path contribution is thus credited to upstream vertices that lie on those paths. Summing over sources yields the standard centrality quantity.

The project’s use of unweighted topology deliberately limits computational and conceptual scope. A weighted Brandes variant would need a priority queue per source and a weighted path-count procedure. This is possible, but it would duplicate the probability-aware route concept already introduced through Dijkstra and make a real-time teaching graph less responsive.

== L.9 Dijkstra correctness under probability transformation

Dijkstra’s algorithm returns shortest paths when all edge weights are nonnegative. With a valid opportunity $τ_e$ in the open interval $(0,1]$, define $w_e=-ln(τ_e)$. Because $ln(τ_e)≤0$, $w_e≥0$. Thus the nonnegative-weight requirement holds.

For a path $π$,

```text
sum of w_e over e in π
  = sum of −ln(τ_e)
  = −ln( product of τ_e )
```

The negative logarithm is strictly decreasing on positive values: if product A is larger than product B, then negative-log A is smaller than negative-log B. Therefore a path minimizing transformed sum maximizes the product of simplified edge opportunities. Dijkstra is correct for the transformed route criterion, assuming its usual graph and weight prerequisites.

Using this proof does not validate the epidemiological meaning of multiplying edge probabilities. That assumption comes from the educational scenario model. The proof only establishes that, *given that assumption*, the chosen graph algorithm optimizes the stated path criterion exactly.

With a binary heap, each run is commonly bounded by $O((n+m) log n)$. If the planner runs it from $r$ selected sources to target computations reusing distance maps where possible, the practical cost depends on implementation detail. The project bounds source/destination subsets to keep the route-blocking strategy responsive under classroom graph sizes.

== L.10 Max-flow/min-cut correctness intuition and cost

The max-flow/min-cut implementation uses a residual network. An augmenting path carries additional flow equal to its minimum residual capacity. Updating forward and reverse residual capacity preserves flow conservation at intermediate vertices and records the possibility of canceling prior choices. When no source-to-target augmenting path remains, the set of vertices reachable from source in the residual network defines a cut. No original residual-positive edge can cross from reachable to unreachable; otherwise the target side would be reachable. The saturated original crossing edges form a capacity boundary.

The max-flow/min-cut theorem states that the total value of the maximum flow equals the total capacity of a minimum source–target cut. The project relies on this theorem as a structural containment heuristic. It does not extrapolate the theorem to social policy: capacity values are proxies, and the source/target pair is a scenario choice.

Runtime depends on the augmentation implementation and capacities. A straightforward Ford–Fulkerson-style method has weak general bounds for arbitrary real capacities. With integer capacity proxies and breadth-first augmenting paths, an Edmonds–Karp-style behavior has a classical $O(n m^2)$ bound. At the project’s bounded graph scale, this is acceptable for a small number of selected source–target computations. The importer cap and target prioritization are therefore tied directly to algorithmic cost.

== L.11 Finite-difference sensitivity and derivative interpretation

The sensitivity display varies one input while holding the remaining scenario description fixed. For output statistic $Y(θ)$ and small step $h$, it can display a finite difference

```text
[Y(θ+h) − Y(θ)] / h
```

as a numerical local slope indicator. In a deterministic discrete-count simulator, this should not be mistaken for an analytic derivative. Integer outcomes can jump at thresholds, budget feasibility can change discontinuously, and selected actions may change rank when parameter differences alter route scores. A single slope is therefore descriptive, not a proof of smooth response.

The fixed-input rule is nevertheless crucial. If the sweep also changed the seed, initial source, graph, or budget, a chart’s variation would mix causes. Holding those values fixed lets a student say: within this modeled scenario, what changes when the selected parameter changes? This is a controlled computational experiment, not a calibrated uncertainty analysis.

== L.12 Deterministic hash-trial properties

Let $H(k)$ map a composite key $k$ to a finite unsigned integer space, then normalize $U(k)=H(k)/M$ for maximum space size $M$. A deterministic Bernoulli function is

```text
B(k,p) = 1 if U(k) < p; otherwise 0
```

For any fixed key and probability, the result is fixed. If $p_1≤p_2$, then $B(k,p_1)=1$ implies $B(k,p_2)=1$; this monotonicity comes from the same uniform threshold value. The property can make certain comparative changes less noisy: increasing a probability does not randomly reverse an already successful trial for the same key.

The technique does not make hash outputs independent in a strict statistical sense, and the project does not claim a cryptographic random source. Its rationale is counterfactual comparability. The same scenario state receives the same trial threshold across strategy runs. If an action disconnects an exposure, the action’s graph effect—not a new random number—is what changes the outcome opportunity.

== L.13 Numerical safeguards and their formal role

| Safeguard | Mathematical risk avoided | Why it is not merely interface polish |
|---|---|---|
| Probability clamp to unit interval | Invalid Bernoulli/domain values | Preserves probability-space assumptions used in proofs |
| Edge opportunity cap below one | Infinite or degenerate transformed route cost | Keeps Dijkstra weights finite and useful |
| Nonnegative budget clamp | Impossible resource arithmetic | Establishes base case for feasibility induction |
| Integer time horizon | Undefined timeline indices | Defines finite sequence of daily states |
| Population availability bounds | Negative compartment counts | Supplies premises for conservation proof |
| Zero-baseline containment branch | Division by zero | Gives a defined semantic result for no-outbreak case |
| Stable tie rule | Nonsemantic ordering effect | Prevents false unique winner claim |

The table illustrates a broader engineering lesson. Input validation is part of the mathematical model. A proof that uses probabilities in $[0,1]$ cannot be separated from code that ensures values stay in that domain.

== L.14 What is proved and what is not

The report can legitimately claim the following conditional statements: count conservation follows from the stated update and bounded draws; aggregate probabilities are bounded under the stated independence approximation; Dijkstra minimizes the transformed additive route cost; max-flow/min-cut identifies a minimum cut under supplied capacities; budget filter output is feasible; deterministic keys reproduce identical inputs.

The report does not prove that real infections follow independent trials, that OpenStreetMap road class is a contact capacity, that a school closure is ethically desirable, that a generated population is demographically accurate, or that a winning graph heuristic is a real-world policy optimum. These are empirical, ethical, or governance claims requiring evidence beyond the source code. Explicitly naming the boundary is part of the mathematical rigor of the project.

== L.15 Compendium conclusion

The calculations and proofs in this appendix show that the simulator’s internal rules are coherent at the level claimed: finite graphs, bounded probabilities, conserved model populations, reproducible trials, feasible budgets, and established graph-algorithm objectives. The same analysis also explains why the application remains an academic scenario tool. Formal internal coherence is necessary for a useful model; it is not sufficient for real-world predictive or policy authority.
