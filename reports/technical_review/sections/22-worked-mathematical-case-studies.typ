#pagebreak()
= Appendix J — Worked mathematical case studies and audit calculations

This appendix supplies concrete arithmetic for readers who want to verify how the project’s equations behave before opening the code. The values are intentionally small and illustrative. They are not copied from a real location, they are not a recorded simulation trace, and they do not represent a disease forecast. Their purpose is to show how the model’s discrete mathematics, probability rules, graph transformations, and comparison protocol fit together.

== J.1 Case study 1: typed graph and baseline population audit

Consider a teaching graph with six vertices:

```text
h = home, n_h = 90
s = school, n_s = 180
o = office, n_o = 140
c = clinic, n_c = 70
j = road intersection, n_j = 0
p = road intersection, n_p = 0
```

The population-bearing set is $V_P={h,s,o,c}$ and the routing-only set is $V_R={j,p}$. The modeled city population is therefore

```text
N = 90 + 180 + 140 + 70 = 480
```

Suppose the roads are $h-j$, $j-s$, $j-o$, $s-p$, $o-p$, and $p-c$. The hand-checkable degree sequence is

```text
d(h)=1, d(j)=3, d(s)=2, d(o)=2, d(p)=3, d(c)=1
```

This small example makes a basic but important point about typed graphs. The road intersection $j$ has degree three, which may make it structurally important; it has zero modeled population, which makes it ineligible for a population quarantine in the selected constraint vocabulary. The school has degree two but carries 180 modeled people. A planner that used only degree would see $j$ and $p$ as strong local connectors. A planner that is subject to a population budget must also reason about the cost of any semantic location it recommends.

Let the initial state at the home be

```text
X_h(0) = (S_h,I_h,R_h,D_h) = (82,8,0,0)
```

and let all other population nodes start susceptible. Conservation holds at each vertex:

```text
82+8+0+0=90
180+0+0+0=180
140+0+0+0=140
70+0+0+0=70
```

The city total also conserves people: $480$ before and after a transition. The road intersections retain zero compartment counts. If an implementation accidentally initializes road vertices with a nonzero population or allows an infection count to arise there, the error is immediately visible in this table; it is not a subtle epidemiological disagreement.

== J.2 Case study 2: one source, one route, one daily exposure

Let global transmission multiplier $α=0.8$. Give the road $h-j$ base opportunity $τ_(h,j)=0.06$. The capped elementary opportunity is

```text
x_(h,j) = 0.8 × 0.06 = 0.048
```

With $I_h(0)=8$ infected people in the source location, the engine’s simplified independent-opportunity probability for at least one successful source-to-neighbor exposure is

```text
q_(h→j) = 1 − (1 − 0.048)^8
         = 1 − 0.952^8
         ≈ 1 − 0.6747
         ≈ 0.3253
```

The number is not “32.53% of real commuters become infected.” It is an event-level probability proxy in the educational engine. Its function is to demonstrate two formal properties. First, it rises as source infection count rises. Second, it remains below one without a special corrective rule. The same calculation with one infectious person gives $0.048$; with eight simplified opportunities it is approximately $0.3253$, not $0.384$, because the events can overlap.

Assume for a further illustrative step that the intersection leads to the school through another road and the model’s aggregation produces school exposure probability $p_s(0)=0.20$. The school has $S_s(0)=180$. Its number of new infections is a binomial draw with support from zero to 180:

```text
Y_s ~ Binomial(180, 0.20)
E[Y_s] = 180 × 0.20 = 36
Var[Y_s] = 180 × 0.20 × 0.80 = 28.8
```

The calculation does not mean every run produces 36 new cases; it describes the expected value of the model transition. In the deterministic replay design, the keyed pseudo-random draws will return one particular integer between zero and 180 for a specified seed. Repeating the same scenario with the same seed returns the same integer. Repeating it with a new seed produces a different legitimate scenario trace.

== J.3 Case study 3: multiple sources and the complement product

Suppose the school has two independent simplified exposure channels on a day. One source produces $q_1=0.3253$ and the other produces $q_2=0.1800$. The aggregate risk is

```text
p_s = 1 − (1−q_1)(1−q_2)
    = 1 − (0.6747)(0.8200)
    = 1 − 0.5533
    = 0.4467
```

Naively adding the two probabilities would give $0.5053$. That number is not necessarily impossible here, but it double counts cases in which both channels succeed. The complement product avoids the double count under the model’s independence assumption. It also gives the correct boundary behavior: if either $q_i=0$, it has no effect; if any $q_i=1$, the aggregate is one; and the result cannot exceed one.

The approximation’s limitation is visible as well. The two sources may share people, travel patterns, or contextual factors, so their exposure events need not be independent. A correlated model would require joint probabilities or a latent-contact process. Those inputs are not present in this project. The complement rule is selected because it is mathematically transparent, bounded, and appropriate for an introductory graph-and-probability demonstration.

== J.4 Case study 4: recovery and mortality ordering

Return to the home with $I_h(0)=8$. Let daily recovery parameter $ρ=0.125$ and mortality parameter $μ=0.02$. The expected recovery count is

```text
E[R_h^+] = 8 × 0.125 = 1
```

Imagine that the keyed trial sequence returns exactly one recovery. The eligible infected count for mortality is then seven, not eight. The expected mortality conditional on that recovery count is

```text
E[D_h^+ | R_h^+=1] = 7 × 0.02 = 0.14
```

If the key sequence yields zero deaths, the home’s updated state before considering any incoming new infection is

```text
S_h(1)=82
I_h(1)=8−1−0=7
R_h(1)=0+1=1
D_h(1)=0+0=0
```

Again $82+7+1+0=90$. If new infections at the home were allowed from other sources, they would appear through the separately calculated $I_h^+$ term; in this simple initial-source case we take it as zero. The sequential order has a clear logical advantage. No infected individual is simultaneously added to recovered and deceased counts. A model that sampled both from the original eight could need an artificial correction when $R_h^+ + D_h^+ > 8$.

== J.5 Case study 5: road closure as a graph transformation

Take the six-road graph described in Case J.1. Consider a road action $A_E={h-j}$. The resulting active edge set is

```text
E_active = {j-s, j-o, s-p, o-p, p-c}
```

If $h$ is the only initial infected location, it has degree zero in the active graph. Under the engine’s connector-based exposure rule, it cannot transmit to the rest of the graph on that day. This is not a claim that one real road closure would isolate real household contacts. It is the exact counterfactual defined by this graph scenario.

Now consider location action $A_V={s}$, a school quarantine. The school remains drawn in the interface with a quarantine marker, but its usable transmission connectors are removed. The active graph is conceptually

```text
V_active = {h,j,o,c,p}
E_active = {h-j, j-o, o-p, p-c}
```

The display decision—show the school while making it inactive—lets a reviewer see the selected policy action. Removing it both visually and mathematically could make a reader wonder whether it was ever part of the graph; leaving edges visually active would be worse, because it would contradict the calculation.

== J.6 Case study 6: budget feasibility with population constraints

Suppose a planner ranks school $s$ first, office $o$ second, clinic $c$ third, then roads. Let the budget be

```text
B_v=2 locations
B_p=200 modeled people
B_e=2 roads
```

The school costs 180 people. It is feasible, so it is selected. The office costs 140 more people; $180+140=320>200$, so it is skipped even though it is ranked second. The clinic costs 70 more people; $180+70=250>200$, so it is skipped. The node plan contains only the school, even though the count budget could accommodate one more node.

Next, suppose the ranked roads are $j-o$, $o-p$, $h-j$. The first two are selected because $B_e=2$. The feasible plan is

```text
V_A={s}; E_A={j-o,o-p}
|V_A|=1≤2
Σ N_v = 180≤200
|E_A|=2≤2
```

This example explains why “top two nodes” is not a valid description of the actual planner. The plan is selected in ranking order *subject to feasibility*. It also reveals an intentional limitation: the greedy filter may leave unused node-count budget because no remaining low-cost candidate fits the population budget. A global knapsack optimizer might choose a different combination. The project prefers a common, explainable greedy feasibility rule over a new hidden optimization layer.

== J.7 Case study 7: degree and betweenness diverge

Build a graph of two triangles connected by a single low-degree bridge. Let left triangle vertices be $a,b,x$, right triangle vertices be $y,c,d$, and bridge edge be $x-y$. The degrees are

```text
d(a)=2, d(b)=2, d(x)=3, d(y)=3, d(c)=2, d(d)=2
```

Degree appropriately highlights $x$ and $y$, but consider a slightly richer left cluster in which an internal hub $h$ has degree five while $x$ remains degree three. Highest Degree may choose $h$. Betweenness will often favor $x$, because every shortest route between the left and right clusters uses the bridge endpoints. If a closure budget allows one node, the difference becomes visible: one method protects a locally dense connector; the other protects an inter-community gateway.

The formula for betweenness counts proportional shortest-path participation. If there are $m$ ordered source–target pairs that require $x$, then each contributes one or a fraction to $C_B(x)$. An internal hub may have higher local degree but fewer cross-cluster dependencies. Neither method is universally correct; the graph’s shape decides which structural hypothesis is more useful.

== J.8 Case study 8: Dijkstra transformation of a transmission route

Consider two candidate paths from source $h$ to destination $c$.

```text
path A: opportunities 0.40, 0.50  => product 0.20
path B: opportunities 0.70, 0.20  => product 0.14
```

Without a transform, products are awkward for standard shortest-path accumulation. Apply $w=-ln(τ)$:

```text
cost(A) = −ln(0.40) − ln(0.50) = −ln(0.20) ≈ 1.6094
cost(B) = −ln(0.70) − ln(0.20) = −ln(0.14) ≈ 1.9661
```

Dijkstra chooses path A because $1.6094<1.9661$, which is equivalent to its greater opportunity product $0.20>0.14$. The transform is mathematically exact for positive multiplicative edge opportunities. It is not an arbitrary score conversion. The project then counts roads that appear on several selected source-to-major-destination routes and prioritizes repeated bottlenecks.

This case also explains the cap near one. If $τ=1$, then $-ln(1)=0$, which is mathematically finite but can create zero-cost chains; if $τ=0$, then $-ln(0)$ is undefined/infinite. Capping and validating input gives the algorithm a stable finite cost domain.

== J.9 Case study 9: a small max-flow/min-cut construction

Let an outbreak source $s$ connect to two intermediate nodes $a,b$, both of which connect to protected destination $t$. Give capacities

```text
c(s,a)=3; c(s,b)=2; c(a,t)=1; c(b,t)=2
```

The maximum possible flow is at most $1+2=3$ because the final two incoming capacities to $t$ sum to three. A feasible flow of three exists: send one through $s-a-t$ and two through $s-b-t$. Therefore the maximum flow equals three. The cut containing $s,a,b$ on one side and $t$ on the other has capacity $1+2=3$, so it is a minimum cut.

In the simulator’s teaching interpretation, roads $a-t$ and $b-t$ form a capacity-defined separation boundary between source region and protected destination. This does not mean physically closing the two roads is necessarily socially acceptable or epidemiologically optimal. It means the theorem identifies the lowest-total-capacity boundary under supplied capacities. If road capacities are only class proxies, the output must be interpreted as structural evidence, not a field measurement.

== J.10 Case study 10: Bayes update from symptom evidence

Suppose a location has prior infection probability $P(H)=0.10$. Let reported symptoms $E$ have likelihood $P(E|H)=0.70$ under infection and $P(E|not H)=0.20$ without infection. Bayes’ theorem gives

```text
P(H|E) = [0.70×0.10] / [0.70×0.10 + 0.20×0.90]
        = 0.07 / 0.25
        = 0.28
```

The posterior is 0.28, higher than the prior 0.10 because the evidence is more likely under the infection hypothesis. The project’s hotspot scoring uses a bounded, transparent evidence update for triage/explanation. It is not a medical diagnostic model: the likelihoods are scenario inputs, symptoms are not calibrated clinical evidence, and a posterior score cannot diagnose any individual. The main pedagogical value is to show how a prior and evidence likelihood combine, and how the resulting score can be displayed alongside graph structure without replacing it.

== J.11 Case study 11: containment and tie-aware comparison

Assume the no-intervention baseline ends with cumulative infections $C_0=150$. Two strategies produce

```text
Degree: C_D=105, modeled deaths=4
Betweenness: C_B=105, modeled deaths=4
Random: C_R=110, modeled deaths=5
```

The degree containment fraction is

```text
η_D = (150−105)/150 = 0.30
```

and betweenness has the same $η_B=0.30$. Since the primary and secondary outcome tuple is identical, the result is a tie. The interface should say “inconclusive tie between Highest Degree and Betweenness” rather than choose whichever list item appears first. Random is not best merely because a sort implementation preserves it in some order; its primary outcome is worse.

If the baseline had $C_0=0$, the containment fraction is explicitly reported as zero rather than evaluating a fraction with zero denominator. That branch reflects a logical interpretation: no baseline infections means no intervention can take credit for preventing a modeled outbreak.

== J.12 Case study 12: finite-difference sensitivity reading

Let an outcome statistic $Y(α)$ be final cumulative infections under multiplier $α$. Suppose the model gives $Y(0.70)=80$ and $Y(0.80)=105$. The forward finite-difference sensitivity around 0.70 is

```text
ΔY/Δα = (105−80)/(0.80−0.70) = 25/0.10 = 250
```

This says that in this discrete sweep interval, a one-unit change in the multiplier would correspond to approximately 250 outcome units if the local linear approximation remained valid. It does *not* claim that the true derivative exists or remains 250. The engine uses integer outcomes, thresholds, caps, and pseudo-random trial comparisons; the curve can be non-smooth. The sensitivity panel therefore correctly describes a directional parameter sweep, not a calibrated confidence interval.

== J.13 Case-study conclusion

The calculations demonstrate the project’s central methodological promise. Every displayed recommendation can be traced to a finite graph, a budget-feasible action, a defined probability rule, a deterministic scenario key, and an explicit comparison tuple. The numbers are conditional, not prophetic. Their academic value comes from being inspectable, repeatable, and challengeable.
