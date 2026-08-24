= Decision architecture: alternatives considered and selected rationale

== Decision philosophy

The design used four recurring criteria: reproducibility, interpretability, boundedness, and pedagogical fit. A choice was preferred when it could be re-run from a small set of parameters, explained to a second-year student, prevented a misleading extreme result, and left visible evidence for verification. This section records the major trade-offs. The detailed delivery ledger in Appendix A indexes every completed implementation item.

== Major alternatives

#table(
  columns: (1.05fr, 1.25fr, 1.55fr),
  inset: 6pt,
  fill: (x, y) => if y == 0 { rgb("#eaf2ff") } else { none },
  [Decision area], [Alternatives considered], [Selected approach and why],
  [City data], [Live citywide map; static synthetic graph; bounded live road graph], [Synthetic graph is default; bounded OSM road geometry is optional. This yields a reliable baseline while preserving a tangible real-data extension.],
  [Epidemic structure], [Continuous differential equations; agent-based contacts; discrete aggregated node counts], [Discrete node counts. The update steps can be inspected and the relation to binomial probability is explicit.],
  [Randomness], [Fresh random draw per run; one sequential seed; keyed deterministic trials], [Keyed deterministic trials. The event identity controls the draw, so comparing a road closure does not shift unrelated random draws.],
  [Intervention freedom], [Unlimited closures; monetary objective; count-and-population caps], [Explicit caps on roads, nodes, and population. This makes the phrase “under budget” mathematically enforceable without inventing questionable monetary values.],
  [Strategy output], [Single winner only; multi-objective Pareto surface; ordered result with tie state], [Primary order by final infections then modeled deaths, with a tie state. It is simple for a course demo while avoiding a false unique winner.],
  [Bayesian evidence], [Machine-learned classifier; explicit likelihood rule; no evidence model], [Explicit Bayes update. Parameters are inspectable and evidence is demonstrative rather than claimed as diagnosis.],
  [3D visualization], [Photorealistic city; abstract graph; miniature city], [An architectural miniature. It adds spatial texture while preserving visible graph relationships and intervention overlays.],
  [Desktop delivery], [Hosted web only; native rewrite; Electron portable shell], [Electron portable shell with local loopback runtime. It reuses tested full-stack code and supports offline fixtures without a separate native rewrite.],
)

== Why the solution is modular

The shared domain model separates $G$, epidemic parameters $theta$, budget $B$, evidence $E$, and actions $A$. This is not only a coding convention. It permits a precise causal reading of a comparison: holding $(G,theta,B,E)$ fixed, alter the rule that proposes $A$ and observe the simulated consequences. The architecture then maps naturally to tests: graph tests validate $G$; engine tests validate transitions; intervention tests validate $A$ and $B$; UI tests validate that a user can actually set and observe those variables.

== Rejected complexity

Several ideas were consciously left out. No calibration routine fits parameters to observations; no uncertainty interval is labeled as a statistical confidence interval; no social graph is inferred; no dynamic travel demand is estimated; and no user data is sent to an epidemiological model. These omissions make the artifact narrower but more defensible. An academic simulator can be excellent by making its assumptions legible rather than by simulating a false level of operational realism.
