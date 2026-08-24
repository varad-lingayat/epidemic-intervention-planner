= Limitations, responsible interpretation, and future work

== Mathematical limitations

The model assumes daily discrete time, fixed node populations, independent Bernoulli opportunities, simple recovery/mortality probabilities, no reinfection, and static road availability except for selected interventions. It does not include latent exposure, heterogeneous susceptibility, household mixing, age structure, vaccination, seasonality, mobility schedules, health-system feedback, behavioral adaptation, or endogenous intervention compliance. The path product $∏ q_e$ is a transparent approximation, not a derivation from contact-tracing data.

The graph is undirected even where a real road may be one-way, because the primary educational goal is connectivity and algorithm comparison. Imported OSM `oneway` metadata is retained but does not turn the simulation into a directed travel model. Capacity is a road-class proxy for the min-cut lesson, not vehicle flow, pedestrian throughput, or transmission carrying capacity. The primary winner objective treats final infections then modeled deaths lexicographically; a real decision would require values, constraints, costs, equity measures, and stakeholder governance beyond the scope of this implementation.

== Statistical limitations

The pseudo-random simulation uses a single deterministic scenario realization. Common random numbers make *relative* comparison less noisy, but they do not quantify uncertainty. There is no Monte Carlo ensemble, posterior distribution over parameters, confidence interval, or calibration to observations. A next research step could run $M$ independent seeds and report sample means and intervals, e.g.

```text
Ȳ = (1/M) Σ_(m=1)^M Y_m
SE(Ȳ) = sqrt( [1 / (M(M−1))] Σ_(m=1)^M (Y_m − Ȳ)^2 )
```

but such an extension must then explain multiple-comparison effects and the distinction between simulation variation and real-world uncertainty.

== Ethical limitations

The project purposefully rejects deterministic labels such as “this school must close.” Recommendations are scenario outputs under assumptions, and the app describes them as such. Quarantine and road closure are socially costly actions that require legal authority, public participation, proportionality, accessibility, and equity analysis in real use. A graph algorithm cannot establish any of these conditions.

The risk scoring feature is especially constrained. Symptom evidence may be incomplete, biased, and nonspecific. The prior and likelihood coefficients are illustrative. Outputs should never be used to identify or stigmatize people, neighborhoods, facilities, or communities. The most defensible classroom interpretation is that Bayes’ rule changes a numerical belief when evidence assumptions change.

== Future work, ordered by responsible value

#table(
  columns: (1.25fr, 2.75fr),
  inset: 7pt,
  fill: (x, y) => if y == 0 { rgb("#eaf2ff") } else { none },
  [Extension], [Precondition before it would be responsible],
  [Monte Carlo confidence summaries], [Document independent-seed protocol and distinguish simulation variability from real-world inference.],
  [Directed and time-varying mobility], [Use a clearly licensed, aggregate source and document how travel assumptions are generated.],
  [Richer compartments such as SEIR], [State assumptions for latency and infectiousness and add conservation and transition tests.],
  [Multi-objective intervention optimization], [Engage stakeholders to justify weights for infections, deaths, economic cost, access, and equity rather than hiding them in code.],
  [Accessibility expansion], [Conduct user testing with assistive-technology users instead of claiming compliance from static checks.],
  [Authenticated data workflows], [Establish privacy, retention, authorization, audit, and incident-response policy before accepting sensitive information.],
)
