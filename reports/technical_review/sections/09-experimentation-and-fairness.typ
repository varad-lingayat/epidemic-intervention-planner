= Experimentation, fairness, sensitivity, and demonstration protocol

== Fair comparison protocol

A strategy comparison is defensible only if selection rule is the variable changing. For all five strategies EpiGraph holds fixed

#align(center)[
  $(G, theta, B, E, I_0, T, sigma),$
]

where $G$ is the graph, $theta$ epidemic parameters, $B$ budget, $E$ symptom evidence, $I_0$ initial infections, $T$ duration, and $sigma$ seed. The runner first computes a no-algorithm baseline, then creates a plan for each strategy, runs the same discrete-time engine, and retains fairness metadata: graph ID/fingerprint, initial infected IDs, full parameter vector, budget, seed, and deterministic-trial method.

```ts
baseline = runDiscreteTimeSIR(graph, parameters)
for strategy in [random, degree, betweenness, dijkstra, minCut]:
  plan = planForStrategy(graph, parameters, budget, strategy)
  outcome = runDiscreteTimeSIR(graph, parameters, plan.actions)
winner = lexicographicMin(outcomes, finalInfected, modeledDeaths)
if moreThanOneOutcomeHasWinnerMetrics: status = "tied"
```

The use of a baseline is also necessary for containment: $eta=0$ when $C_0=0$, avoiding division by zero. A tied result is surfaced as inconclusive rather than assigning a winner by array order. This repair was particularly important because a naïve first-item sort could create an embarrassing false impression that Random had won.

== Sensitivity analysis

The sensitivity panel varies transmission $alpha$, recovery $rho$, mortality $mu$, and strategies across bounded ranges. Its interpretation is directional, not a calibrated statistical interval. For a reported output $Y(theta)$, a local central finite-difference sensitivity can be defined as

```text
∂Y/∂θ_j ≈ [Y(θ + δe_j) − Y(θ − δe_j)] / (2δ)
```

For a scale-free comparison, an elasticity is

```text
E_j = (θ_j / Y) (∂Y/∂θ_j)
```

when $Y ≠ 0$. These derivatives explain what a sweep visually conveys: a positive derivative with respect to $alpha$ suggests stronger modeled transmission raises the selected output locally; a negative derivative with respect to $rho$ suggests faster modeled recovery lowers it. The app does not call these causal estimates outside its declared rules.

== Curated Demonstration Mode

Five named presets use two bounded real-road fixtures: East Village, New York and Shoreditch, London. The original presets were searched and verified against bounded road graphs; static fixture copies then made the teaching sequence reproducible without a live request. The table preserves exact release parameters.

#table(
  columns: (1.15fr, 1.1fr, 1.05fr, 1.55fr),
  inset: 5pt,
  fill: (x, y) => if y == 0 { rgb("#eaf2ff") } else { none },
  [Preset], [Claimed unique winner], [$alpha,rho,mu,T,sigma$], [Budget and verified outcome],
  [Chance alignment], [Random], [$0.22,0.06,0.006,16,28$], [$b_e=1$, 3,264 final infections; 140 modeled deaths],
  [Hub protection], [Highest degree], [$0.18,0.06,0.006,16,998244353$], [$b_e=1$, 7,037 final infections; 167 modeled deaths],
  [Bridge containment], [Betweenness], [$0.26,0.08,0.012,20,101$], [$b_e=1$, 14,402 final infections; 932 modeled deaths],
  [Likely-route blocking], [Dijkstra], [$0.18,0.06,0.006,16,101$], [$b_v=1,b_p=1800$, 12 final infections; 1 modeled death],
  [Minimum cut], [Max-flow/min-cut], [$0.18,0.06,0.006,16,20260820$], [$b_e=2$, 7,087 final infections; 147 modeled deaths],
)

These are not benchmark claims that the named strategy dominates outside its fixture. Each scene exists to demonstrate a structural lesson: chance can align; hubs can dominate; bridges can matter more than degree; a likely route can be blocked; or a small cut can separate a source region. The live importer test is opt-in because public data can change or be unavailable; fixture verification is the routine reproducibility control.

== Manual what-if mode

Manual closures and quarantines are deliberately kept separate from the five-way comparison. They let a user pose “what if this road is closed?” without contaminating the algorithm-selected action sets. The manual runner computes a new baseline and then evaluates the user actions through the same engine. This preserves a clean distinction between an algorithm comparison and exploratory scenario play.
