#pagebreak()
= Appendix E — Formal model, state-machine, and data-contract audit

This appendix is deliberately more formal than the interface documentation. It answers a different question: *what object is the program actually computing?* A user sees a city, a timeline, and five recommendations. The engine instead consumes a finite graph, a parameter vector, optional interventions, a deterministic key stream, and a horizon; it returns a finite sequence of count states and summary statistics. Treating these as separate layers was a major design decision. It prevents a visually persuasive map from silently becoming the mathematical model, and it makes each calculation inspectable in a second-year discrete mathematics setting.

== E.1 Domains, notation, and typing discipline

Let the scenario graph be $G=(V,E)$. Every vertex has a stable string identifier; every edge has a stable identifier and two endpoint identifiers. The graph is simple at the teaching-model level even when imported geometry originally contains a more complicated road representation. A vertex belongs to one semantic category: home, school, hospital, office, or road intersection. The first four categories can carry a nonnegative modeled population; the last category is an explicitly non-population-bearing routing connector.

```text
V = V_home ∪ V_school ∪ V_hospital ∪ V_office ∪ V_road
V_i ∩ V_j = ∅ for i ≠ j
N_v ∈ {0,1,2,...};  N_v = 0 for v ∈ V_road
E ⊆ {{u,v} : u,v ∈ V, u ≠ v}
τ_e ∈ [0,1];  d_e > 0;  class_e ∈ {primary, secondary, local}
```

The application uses a *typed graph* rather than a generic adjacency matrix because semantics matter. A school can be suggested for quarantine; an ordinary road-intersection cannot consume a population-quarantine budget. A hospital can receive special priority as a max-flow destination; a home should not. This distinction is not a claim that real facilities have homogeneous risk. It is a model vocabulary chosen to make the intervention constraints legible.

The epidemic state associated with a population-bearing vertex $v$ on day $t$ is a four-tuple $X_v(t)=(S_v(t),I_v(t),R_v(t),D_v(t))$. The interface also uses a quarantined display state. Quarantine is an *intervention flag*, not a fifth biological compartment: it changes available connectors or blocks movement but does not redefine a person’s biological status. This avoids the common modelling ambiguity in which “quarantine” is incorrectly counted both as a disease state and as a policy action.

```text
S_v(t), I_v(t), R_v(t), D_v(t) ∈ {0,1,2,...}
S_v(t)+I_v(t)+R_v(t)+D_v(t) = N_v
I_v(t) = 0 and S_v(t) = 0 for v ∈ V_road
```

The equality is an invariant, not an optional diagnostic. After every transition, the implementation bounds each sampled count against the people available for that transition, then computes the next susceptible count by conservation. A useful audit assertion is therefore

```text
for every v and every completed day t:
  0 ≤ S_v(t), I_v(t), R_v(t), D_v(t) ≤ N_v
  S_v(t)+I_v(t)+R_v(t)+D_v(t) = N_v
```

This exact check matters more than an attractive epidemic curve. A curve can look plausible while violating person conservation through an off-by-one recovery count. The project’s data contract and tests make the invariant explicit.

== E.2 Parameter vector and admissible ranges

The scenario parameter vector is

```text
θ = (α, ρ, μ, T, I0, σ, B_e, B_v, B_p)
```

where $α$ is the global transmission multiplier, $ρ$ is recovery probability, $μ$ is mortality probability, $T$ is the number of simulated days, $I_0$ is the selected initial infection count or initial source set, $σ$ is the deterministic seed, and the final three quantities are the road, node, and population budgets. The notation intentionally separates $τ_e$, the road-level base opportunity, from $α$, the scenario-wide multiplier. A map can retain its geometry while students examine what happens when the common multiplier changes.

Every editable control is clamped at its boundary rather than accepted as an arbitrary JavaScript number. This is both an interface and a modelling decision. Negative transmission, a recovery probability above one, a negative road budget, and a nonintegral horizon do not represent additional experimental cases; they represent malformed inputs. Boundary clamping gives a stable educational response and keeps the model’s codomain meaningful.

| Quantity | Admissible domain | Why the boundary exists | Consequence of invalid input |
|---|---:|---|---|
| $α$ | nonnegative bounded control range | Prevents a negative probability scale | Clamped to nearest permitted value |
| $ρ,μ$ | $[0,1]$ | Required for Bernoulli transition interpretation | Clamped to $0$ or $1$ |
| $T$ | positive integer range | Timeline needs a finite discrete index | Rounded and bounded |
| $B_e,B_v,B_p$ | nonnegative integers | A budget cannot buy negative actions | Clamped to zero or upper control limit |
| $σ$ | finite integer | Reproducibility key must be serializable | Normalized to an integer |

The engine treats $ρ$ and $μ$ sequentially, with recovery sampled before mortality among the remaining infected count. The ordering is documented because two superficially similar formulas are different. If mortality were sampled from the original infected pool, one individual could appear in both recovery and mortality draws. Sequential sampling instead encodes mutually exclusive outcomes within one day: recover, then die from those who remain infected, then remain infected. This is a bookkeeping rule, not a fitted clinical process.

== E.3 Intervention transformation as a pure graph operation

Let $A=(E_A,V_A)$ denote selected road closures and selected quarantined locations. The intervention planner produces $A$; the epidemic engine receives an active graph derived from $A$. Separating planning from execution was essential for fair comparison. It means the engine never needs to know whether an edge was selected by Random, Highest Degree, Betweenness, Dijkstra, Max-Flow/Min-Cut, or a manual user choice.

```text
E_active(A) = { e ∈ E : e ∉ E_A and neither endpoint is quarantined by V_A }
V_active(A) = V \ V_A for movement and exposure purposes
```

The implementation’s exact representation may retain a quarantined vertex for display, but it removes its usable connectors for the transmission traversal. This distinction preserves explainability: the map can still show *which location was quarantined* while the graph calculation correctly treats it as disconnected. A closure is not silently removed from the visual graph, and a display-only fence is not allowed to leave the edge mathematically active.

Budget feasibility is lexicographic rather than an implicit optimization solver. Candidates arrive in a strategy-specific order. Nodes are considered first; any candidate whose modeled population would exceed $B_p$ is skipped; selected nodes are limited by $B_v$. Roads are subsequently selected in candidate order until $B_e$ is reached. Formally, each reported plan satisfies

```text
|E_A| ≤ B_e
|V_A| ≤ B_v
Σ_(v∈V_A) N_v ≤ B_p
```

This produces a reproducible feasible plan. It does *not* claim to solve a global knapsack or mixed integer program jointly over nodes and edges. That non-claim is important. A globally optimized containment design would be a different research project with different assumptions and would obscure the intended comparison among established graph heuristics.

== E.4 Force of infection and daily update order

For a traversable opportunity from infected source $u$ along edge $e={u,v}$, define a capped elementary probability $x_e="clip"(α τ_e,0,0.9999)$. If $I_u(t)$ infected individuals are used as repeated simplified opportunities, the edge-level daily probability is

```text
q_(u→v,e)(t) = 1 − [1 − x_e]^(I_u(t))
```

The exponent is not a population-contact survey. It is a transparent independence approximation: the probability that no one of $I_u(t)$ simplified opportunities succeeds is the product of their no-event probabilities; the complement is at least one success. The cap below one avoids a singular transformed Dijkstra cost and avoids numeric degeneracy in a finite-precision interface.

If several eligible sources reach the same destination, the engine aggregates their probability contributions by the complement of all sources failing. For source opportunity set $U_v(t)$,

```text
p_v(t) = 1 − Π_(u∈U_v(t)) [1 − q_(u→v)(t)]
```

This is a standard union-of-independent-opportunities approximation. It has two useful teaching properties. First, it is bounded in $[0,1]$ without ad hoc rescaling. Second, it visibly shows diminishing increments: a second route raises risk, but not by naïvely adding probabilities beyond one. It is also limited: routes and people are not independent in a real city, so the product is an educational simplification.

The day transition uses a frozen state. All day-$t+1$ quantities are derived from day $t$ counts and the day-$t$ active graph, then committed together. The program does not update the first vertex and immediately use its new infection count when updating the next vertex. That asynchronous alternative can create an unintended vertex-order effect. The synchronous rule is

```text
new infections:   I_v⁺ ~ Binomial(S_v(t), p_v(t))
recoveries:       R_v⁺ ~ Binomial(I_v(t), ρ)
deaths:           D_v⁺ ~ Binomial(I_v(t) − R_v⁺, μ)
S_v(t+1) = S_v(t) − I_v⁺
I_v(t+1) = I_v(t) + I_v⁺ − R_v⁺ − D_v⁺
R_v(t+1) = R_v(t) + R_v⁺
D_v(t+1) = D_v(t) + D_v⁺
```

The negative terms in the infected update appear only after the new infections have been added, and recoveries/deaths are bounded by the original infected count. With the availability checks described earlier, the conservation invariant follows directly by summing the four update equations. This is the report’s central mathematical justification for calling the engine a discrete-time SIR-with-deaths scenario model.

== E.5 Deterministic pseudo-random trials

The project wanted both stochastic-looking epidemic transitions and fair, repeatable strategy comparison. The solution is deterministic keyed Bernoulli sampling. Each conceptual draw is assigned a key derived from scenario seed, day, vertex or edge identity, transition type, and trial index. A stable hash turns the key into a normalized number in $[0,1)$. A trial succeeds precisely when that number is below the requested probability.

```text
U = normalizedHash(σ, day, entityId, transitionKind, trialIndex)
Bernoulli(p) = 1 if U < p, otherwise 0
Binomial(n,p) = Σ_(j=0)^(n−1) Bernoulli_j(p)
```

This is not cryptographic randomness, nor does it claim a statistically ideal pseudo-random generator. It is a reproducibility device. The same inputs produce the same daily trace; changing an intervention changes only the parts of the graph or state that logically change. The design supports common random numbers: plans are evaluated against the same seed and key scheme, reducing accidental variability in their differences. A later research extension could evaluate many independent seeds and report a distribution; the present application correctly labels its outputs as scenario projections rather than confidence intervals.

== E.6 Derived metrics and semantic boundaries

The dashboard exposes cumulative infections, active infections, modeled deaths, peak active infections, peak day, duration, and containment fraction. Each measure is intentionally described as a model output. For example, cumulative infection is counted from the scenario’s initial infections plus simulated new infections; it is not a case-reporting estimate. Modeled deaths are a count generated by the supplied mortality transition; they are not a mortality forecast. Peak day is an argmax over the finite timeline, with deterministic tie handling according to the engine’s traversal order.

Containment is relative to the corresponding no-intervention baseline. If $C_0$ is baseline cumulative infections and $C_A$ is the cumulative infections under plan $A$,

```text
η(A) = clip_(0,1) [ (C_0 − C_A) / C_0 ] for C_0 > 0
η(A) = 0 otherwise
```

The zero-baseline branch avoids division by zero and says something semantically useful: if no baseline infections occur, no plan can claim an infection reduction. The explicit clamp avoids an unstable negative percentage being presented as a percent beyond the intended scale. Importantly, the system’s primary winner rule does not maximize $η$ directly; it compares lower final cumulative infection first and modeled mortality second. Containment remains an explanatory secondary metric rather than a hidden objective that could distort an intuitive result.

The formal audit yields one final conclusion. EpiGraph is neither a continuous ODE model nor a real-time public-health surveillance system. It is a finite, typed, graph-constrained, discrete-time stochastic scenario machine with deterministic replay. Every visual and recommendation layer should be interpreted within that boundary.
