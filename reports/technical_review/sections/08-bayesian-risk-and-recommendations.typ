= Bayesian hotspot scoring and actionable recommendations

== Why a Bayesian component was included

Graph intervention identifies where the topology matters; it does not, by itself, encode the user’s stated local evidence. The application therefore includes a lightweight Bayesian hotspot module. It exposes a prior, an evidence likelihood, a false-positive likelihood, and a posterior for each population-bearing vertex. The aim is explanatory: a student can see how a prior is revised. It is *not* a diagnostic classifier; the likelihood parameters are illustrative inputs, not estimated clinical sensitivities or prevalence values.

== Prior construction

For a location $v$, the engine receives a modeled infection probability $p_v$ and forms an exposure quantity $h_v$ from connected infectious sources. The implementation accumulates a road probability, infectious count, and source-population ratio for each available incident opportunity, excluding zero-population source vertices. The clamped prior is shown below, where $C_(a,b)(x)$ means “clamp $x$ to the interval from $a$ to $b$.”

```text
P(H_v) = C_(0.001, 0.97) [ 0.015 + 0.55 p_v + 0.65 h_v ]
```

The offset $0.015$ prevents a connected but low-exposure node from becoming logically impossible; the $0.55$ and $0.65$ coefficients visibly combine current modeled state and surrounding exposure. They are deliberately *not* fitted epidemiological coefficients. This is a decision-support teaching formula, not a medical claim.

== Evidence likelihoods and posterior

If the user enters $a_v$ symptomatic observations out of $n_v$ observations and an evidence-strength control $k_v$ between zero and one, the engine uses the following transparent calculation.

```text
z_v = C_(0, 1) [ a_v / max(1, n_v) ]
L_v = C_(0.05, 0.96) [ 0.18 + 0.65 z_v k_v ]
F_v = C_(0.01, 0.42) [ 0.04 + 0.12 z_v k_v ]
P(H_v | E_v) = L_v P(H_v) / [ L_v P(H_v) + F_v (1 - P(H_v)) ]
```

Here $H_v$ denotes the model’s “hotspot” hypothesis, $E_v$ denotes the entered evidence, $L_v$ is the illustrative likelihood of that evidence under the hotspot hypothesis, and $F_v$ is its illustrative false-positive likelihood. The posterior is clamped to the unit interval, sorted descending, and assigned a rank. When no symptom evidence is supplied, the system retains the network-derived prior and explicitly states that evidence was absent. When evidence is present, the output records the observed ratio $a_v/n_v$.

== Interpretation discipline

A large posterior means only that the supplied scenario, evidence-strength setting, and illustrative likelihood rule elevate a *model hotspot score*. It does not establish disease presence, diagnostic sensitivity, specificity, medical prevalence, or clinical validity. The responsible wording is therefore: “under the supplied scenario and symptom evidence, this location is ranked for attention.”

== Recommendations

The recommendation generator takes the first five actions from the winning plan and enriches every action with a target, an action label, a rationale, an expected-impact statement, and a budget cost. For a road it averages available endpoint hotspot scores; for a node it presents that node’s score and population cost. The expected-impact text remains conditional on the chosen strategy and scenario assumptions. This decision fulfills the usability requirement to convert a mathematical output into a comprehensible action without turning the application into real-world public-health advice.
