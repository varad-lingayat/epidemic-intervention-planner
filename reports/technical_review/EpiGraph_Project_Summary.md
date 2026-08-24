# EpiGraph Epidemic Intervention Planner — Project Summary

## Purpose and academic framing

EpiGraph is a desktop-first academic decision-support simulator created for a second-year discrete mathematics project. Its purpose is to demonstrate how established ideas from graph theory, probability, algorithms, and basic epidemic modelling can be combined to compare possible outbreak-intervention strategies. The application does **not** claim to predict real epidemics or provide public-health, clinical, or operational advice. Instead, it produces reproducible **scenario-model projections** from synthetic parameters and graph inputs that are visible to the user. This boundary is central to the project: the application is designed to teach and explain mathematical structure, not to make real-world disease forecasts.

The central problem is stated as follows: if a disease spreads through a connected city-like network and decision-makers can close only a limited number of roads, quarantine only a limited number of locations, or affect only a limited modeled population, which graph-based intervention approach performs best under the *same* conditions? The project answers that question by constructing a city graph, simulating a discrete-time epidemic, applying five strategies under one shared budget, and comparing their outcomes fairly.

## Graph and city model

The simulator represents a city as a graph $G=(V,E)$. Each vertex $v \in V$ represents a location, such as a home, school, office, hospital, block, or road intersection. Population-bearing vertices carry a modeled local population; road intersections may act as zero-population connectors. Each edge $e=(u,v) \in E$ represents a movement route or road. Edges have road classes, lengths, and synthetic transmission-opportunity weights. This design makes graph structure visible while giving intervention recommendations meaningful labels rather than anonymous vertex numbers.

Two graph sources are supported. The first is a reproducible synthetic city generator, which creates districts, facility types, road classes, weighted roads, hubs, and bridges. It is the default teaching environment because it can be inspected and reset reliably. The second is a bounded OpenStreetMap road importer. It converts a small selected neighborhood road network into a normalized graph, using size limits, caching, endpoint failover, and clear failure messages. Imported geometry is real road geometry, but population, disease state, transmission opportunities, and intervention costs remain model inputs rather than observed public-health data.

The user can explore the result in an interactive 2D graph or in a high-detail architectural-minature 3D city view. The 2D view is kept because it is best for analyzing topology, road closures, bridges, and routes. The 3D view supports presentation and spatial context, but it does not alter simulation state or mathematical outcomes.

## Epidemic mathematics

EpiGraph uses a deterministic, seeded, discrete-time susceptible–infected–recovered–deceased model. At each population-bearing location, the state is represented by compartment counts $(S_t,I_t,R_t,D_t)$. A day update creates new infections, recoveries, and deaths, then applies the conservation-aware bookkeeping rule

$$
S_{t+1}=S_t-Y_t, \quad
I_{t+1}=I_t+Y_t-Z_t-W_t, \quad
R_{t+1}=R_t+Z_t, \quad
D_{t+1}=D_t+W_t.
$$

Here $Y_t$ is the number of new infections, $Z_t$ the number of recoveries, and $W_t$ the number of modeled deaths. The engine enforces the intuitive constraints $0 \leq Y_t \leq S_t$ and $0 \leq Z_t+W_t \leq I_t$, so counts do not become negative. Summing the four equations proves conservation of the modeled population: $S_t+I_t+R_t+D_t=N$ at every location and time step.

Exposure is constrained by the active road graph. When multiple neighbouring sources create simplified exposure opportunities $q_1,q_2,\ldots,q_k$, the engine uses the bounded complement-product expression

$$
p_{\text{exposure}}=1-\prod_{i=1}^{k}(1-q_i).
$$

This is preferred to naïvely summing opportunities because it remains in the interval $[0,1]$. The model assumes simplified independence between opportunities; that assumption is stated openly as a limitation. Seeded pseudo-random event keys make repeated runs reproducible, which is essential for fair comparisons.

## Five intervention strategies

The project compares five established strategies. **Random** provides a deterministic seeded baseline and shows what a budget allocation looks like without graph intelligence. **Highest Degree** prioritizes highly connected vertices or roads, based on the hypothesis that local hubs sustain many contacts. **Betweenness Centrality** prioritizes bridges that lie on many shortest paths between other locations. **Dijkstra Blocking** identifies high-opportunity transmission routes. Because opportunities multiply along a route, each positive edge opportunity $\tau_e$ is transformed to an additive cost $w_e=-\ln(\tau_e)$; minimizing the sum of these costs maximizes the route’s product opportunity. **Max-Flow/Min-Cut** identifies a low-capacity structural boundary separating an outbreak source from an important destination, such as a hospital or major facility.

These methods are not presented as universally optimal. Each represents a different structural hypothesis: chance, local connectivity, global bridging, probable route interruption, or source–target separation. A common feasibility filter checks every proposed plan against the same road, location, and modeled-population budgets. All five simulations then use identical graphs, parameters, starting infections, duration, seed scheme, and budgets. The comparison ranks lower final infections first and lower modeled deaths second, while detecting ties rather than inventing a false winner.

## Bayesian evidence and decision support

The simulator also includes Bayesian hotspot scoring. A location begins with a prior risk and receives simplified evidence from symptoms and nearby epidemic state. In general form,

$$
P(H\mid E)=\frac{P(E\mid H)P(H)}{P(E\mid H)P(H)+P(E\mid \neg H)P(\neg H)}.
$$

The resulting risk score is used to explain why a location may deserve attention. It is explicitly a teaching example of Bayesian updating, not a medical diagnostic system. Recommendations identify a target, action, rationale, expected modeled impact, and budget cost. An optional LLM explanation translates completed deterministic results into plain English, but it is separated from the computational pipeline and cannot alter strategy selection or epidemic outcomes.

## Interface, demonstrations, and exports

The workflow is organized into five steps: setup, network exploration, outcomes, strategy comparison, and sensitivity analysis. Users can select initial infections, alter rates and budgets, apply manual road closures or location quarantines, reset to the standard teaching scenario, and examine parameter sweeps. CSV export preserves comparison data; PDF export preserves presentation context; scenario persistence and public share links support review. Light and dark themes apply across the application.

A guided Demonstration Mode contains five curated scenarios designed so that Random, Highest Degree, Betweenness, Dijkstra Blocking, and Max-Flow/Min-Cut each lead at least once under a transparent fixed scenario. These presets are pedagogical illustrations, not proof that each method is generally best. The final desktop package bundles the curated road-graph fixtures so Demonstration Mode does not require live OpenStreetMap access.

## Engineering, validation, and limitations

The application uses React, TypeScript, Tailwind, tRPC, Express, Drizzle, and MySQL/TiDB for the web stack, with Electron for the portable Windows application. Shared domain types keep graph, scenario, intervention, outcome, and export contracts consistent across client, server, engine, fixtures, and desktop runtime. The portable application uses local JSON persistence when it runs offline.

Validation included TypeScript checking and 62 automated tests across 24 files. The tests cover graph generation, epidemic transitions, budget enforcement, fairness, Bayesian scoring, recommendations, exports, importer boundaries, workspace controls, timeline playback, sensitivity controls, theme switching, and graph interaction. A final 100-page technical review documents all major decisions, alternatives, mathematical derivations, proofs, complexity considerations, QA evidence, limitations, and examiner questions.

The remaining limitations are intentionally visible. The model is not calibrated to real epidemiological data; parameters are educational inputs. Map data does not establish contact behavior. The strategies are constrained heuristics rather than exact global optimization. The Bayesian component is illustrative, the LLM is explanatory only, and real deployment would require empirical validation, privacy safeguards, domain experts, and broader uncertainty analysis. Within its stated academic scope, however, EpiGraph provides a rigorous, visual, and reproducible way to compare discrete-mathematics intervention ideas.
