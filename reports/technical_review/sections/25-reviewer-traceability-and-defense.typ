#pagebreak()
= Appendix M — Reviewer traceability matrix and technical-defense guide

This appendix turns the report into a usable examination document. It identifies the claim a reviewer may hear, the implementation evidence that supports it, the qualification that prevents overclaiming, and a concise way to demonstrate the claim in the application. It is deliberately included because an academic project should be defensible under questions, not merely attractive during a silent demo.

== M.1 Claim-to-evidence matrix

| Project claim | Technical evidence | Demonstration method | Required qualification |
|---|---|---|---|
| The city is modeled as a graph | Typed nodes/edges, adjacency, 2D/3D views | Select a node and inspect connecting roads | Synthetic graph semantics are not a cadastral city record |
| Disease progression is discrete-time SIR-style | Compartment transition engine and timeline | Step one day, inspect S/I/R/D totals | It is a scenario model, not a clinical forecast |
| Strategies are compared fairly | Shared runner, same seed/parameters/graph/budget | Run five-way comparison and inspect metadata | Equal conditions do not make strategies universally equivalent |
| The plan observes budget | Common feasibility filter and cost display | Lower budget and observe skipped candidates | Greedy feasibility is not global optimization |
| Dijkstra identifies likely routes | Negative-log edge transformation | Compare a high-product route to a low-product route | Opportunity values are modeling proxies |
| Min-cut identifies a containment boundary | Residual network and cut-edge output | Load cut-separation demonstration preset | Capacity is structural proxy, not a real closure order |
| Bayesian scoring updates a prior | Evidence controls and posterior hotspot score | Change symptom evidence and observe score | Not diagnosis or clinical triage |
| Real-road input is bounded | OSM importer caps/cache/error states | Request an oversized or unavailable import path | Road geometry is real when imported; population/disease values are synthetic |
| Demonstrations work offline | Bundled fixtures and preset loader | Start a curated scenario without map request | General live OSM import still requires connectivity |
| Desktop package is portable | Electron portable artifact and checksum | Run from writable Windows folder | User-device security policies can differ |
| Quality checks exist | Type check, test suite, QA matrices | Review validation documents and rerun suite | Passing tests do not prove absence of all defects |

This matrix is a safeguard against a common presentation failure: replacing a precise claim with a grander but less defensible claim. For example, the statement “the simulator predicts a pandemic” is neither needed nor supported. The statement “the simulator projects finite academic scenarios under explicitly displayed assumptions” is accurate and technically stronger.

== M.2 Requirement-to-module traceability

| Requirement family | Primary modules | Secondary modules | Observable artifact |
|---|---|---|---|
| Synthetic city graph | Graph builder, shared types | 2D/3D views | Resettable standard scenario |
| Real-road exploration | OSM importer | Cache, error UX | Import panel and provenance notices |
| SIR progression | Epidemic engine | Timeline panel | Daily state chart and totals |
| Five interventions | Planner | Comparison scorecard | Strategy columns and selected actions |
| Fairness | Comparison runner | Seed/key helper | Same-condition metadata |
| Budget constraints | Feasibility filter | Recommendations | Road/node/population costs |
| Bayesian evidence | Hotspot calculation | Analysis panel | Prior/evidence/posterior explanation |
| What-if actions | Workspace controls | Active graph | Manual closure/quarantine labels |
| Sensitivity | Parameter sweep controls | Charts | Controlled input-outcome trace |
| Persistence/share | Server routes/local store | Share page | Saved scenario/public view |
| PDF/CSV export | Export components | Summary data contract | Downloadable artifacts |
| Light/dark interface | Theme context | All view components | Global color mode |
| Desktop delivery | Electron main/runtime staging | Local storage | Portable Windows executable |

Traceability prevents “feature drift.” A feature cannot be considered complete merely because a button exists. It must map to a module that changes state or produces a defined result and to an artifact a reviewer can inspect. The matrix also makes maintenance more manageable: when a shared type changes, it identifies the UI, import, engine, and export surfaces likely to require review.

== M.3 Mathematical-defense questions and model answers

**Question: Why use SIR-like compartments rather than a full agent-based disease model?**

The discrete compartment system is selected for an undergraduate discrete-mathematics project because it exposes state transitions, graph adjacency, probability, and counting in an inspectable form. A full agent-based model would require individual attributes, contact schedules, calibration data, and performance controls. The educational model still supports the relevant formal questions: how does a transition preserve counts; how does probability accumulate through a graph; and how do graph actions change available connectors?

**Question: How can a stochastic model be fair if different strategies could get lucky?**

The comparison locks the graph, initial state, parameters, horizon, budget, and seed. Keyed deterministic trials ensure that equal opportunities use comparable threshold values. Thus, when a strategy produces a different result under the same scenario description, the difference is attributable to altered graph connectivity and action selection, rather than an unrelated fresh random sequence. The report does not claim that one deterministic trace estimates an expected population outcome; it claims counterfactual comparability.

**Question: Why are probabilities combined with a product rather than summed?**

For independent simplified opportunities, the probability that none occurs is the product of their complements. Taking one minus that product yields the probability that at least one occurs. Direct addition is only valid in special disjoint-event conditions and can exceed one. The independence assumption is a model simplification, but the complement identity is mathematically bounded and correct under that stated simplification.

**Question: Why does the Dijkstra transform contain a logarithm?**

Transmission-route opportunity is represented multiplicatively along a route, but Dijkstra solves additive nonnegative shortest-path problems. The map $w=-ln(τ)$ converts a product into a sum. Minimizing the sum is equivalent to maximizing the positive product because negative logarithm reverses order. The transform is therefore a derivation, not a hand-tuned score.

**Question: Does Max-Flow/Min-Cut tell a city which roads to close?**

No. It identifies a low-capacity boundary in the supplied graph for chosen source and target regions. The output is a structural candidate for discussion. The capacity inputs are proxies, and actual closure decisions require legal, social, mobility, health-service, and empirical information outside the model.

**Question: Why not declare a winner whenever one strategy sorts first?**

Sorting order may contain arbitrary stable implementation effects. The comparison uses an explicit outcome tuple and detects equal outcomes. A tie-aware result is more honest. It teaches that graph heuristics can be indistinguishable under a particular scenario and that evidence is conditional on the chosen metric.

== M.4 Engineering-defense questions and model answers

**Question: Why use a shared domain layer?**

Graph nodes, actions, parameters, outcomes, and strategy identifiers are consumed by the client, server, simulation engine, fixtures, exports, and desktop runtime. Shared types make their agreement a compile-time property. Without them, an import response might use one road identifier shape while the 3D scene or export expects another, producing subtle runtime errors.

**Question: Why have both a web application and a desktop executable?**

The web application supports development, public sharing, and browser-oriented workflows. The portable executable is the primary final delivery because a presentation environment may be offline, unfamiliar, or sensitive to hosted services. Electron packages the production client/server runtime with local persistence. The two routes share model code, reducing divergence.

**Question: Why bundle only demonstration fixtures instead of all possible map data?**

Curated fixtures solve a specific offline reliability requirement. Bundling arbitrary city data would inflate the executable and create stale-data/provenance questions. The application retains a bounded live importer for exploratory use when network access exists, while the teaching presets use a compact, verified offline set.

**Question: Why separate optional LLM explanation from computation?**

An explanation service can make deterministic results easier to understand, but it should not decide the graph plan or change outcome counts. Separating it makes its failure nonfatal, limits payload size, and makes the causal chain auditable. The outcome exists before explanatory prose is generated.

**Question: Why verify package contents rather than trust a successful build?**

A build process can produce an executable that launches yet lacks a runtime asset needed for a particular branch. The offline fixture issue illustrates the difference. Checking the packaged client bundle for stable fixture/preset content gives an additional release gate; an end-user Windows smoke test remains the final environment check.

== M.5 Formal review checklist

A reviewer who wants to audit the mathematics can apply this list.

| Check | Method | Expected result |
|---|---|---|
| State total | Sum S, I, R, D at a node before/after day | Same modeled population |
| Probability bounds | Test p=0, p=1, multiple sources | Output remains in [0,1] |
| Recovery/death availability | Use small I with high parameters | No negative infected count |
| Action feasibility | Set low budgets | Plan cost never exceeds caps |
| Edge removal | Close bridge road | No path can use that road |
| Degree ranking | Use known star/hub graph | Hub is ranked above leaves |
| Betweenness | Use two clusters with bridge | Bridge ranks highly |
| Dijkstra transform | Compare route products | Higher product has lower transformed cost |
| Min-cut | Use small capacity network | Cut equals max-flow value |
| Bayesian update | Evidence more likely under H | Posterior exceeds prior |
| Tie handling | Construct equal outcomes | Result is a tie, not arbitrary winner |

The checklist is intentionally a mixture of algebraic boundary tests and graph-structure tests. An epidemic graph simulator can fail either way: its formulas may be correct while the graph action is wrong, or its graph action may be correct while the transition violates conservation.

== M.6 Presentation sequence for a 12–15 minute review

1. Begin with the decision problem: limited interventions on a connected city graph.
2. State the model boundary: academic scenario projections, not forecasts.
3. Show the graph contract and explain typed locations/roads.
4. State the daily compartments and one conservation equation.
5. Show the five strategy families and their distinct structural hypotheses.
6. Explain fairness controls before showing any winner.
7. Load a curated offline demonstration and run a comparison.
8. Inspect the selected actions in 2D view, then use 3D view for spatial context.
9. Change an input or manual action to show what-if behavior.
10. Show sensitivity and evidence scoring as controlled auxiliary analysis.
11. Demonstrate export/share or desktop portability.
12. End with limitations, ethical boundary, and future validation work.

This order is defensible because it moves from assumptions to algorithms to evidence to limitations. Starting with an attractive 3D scene may engage an audience, but it risks making visualization look like the project’s core proof. The mathematical and experimental controls should arrive before the animated result.

== M.7 Final reviewer note

The project’s strongest defensible contribution is not the claim that it has discovered a new containment algorithm. It is a carefully integrated educational decision-support simulator that makes established discrete-mathematics tools comparable under shared conditions. The report records each major choice, its alternative, its computational consequence, and its limitation. That is the standard against which the project should be reviewed.
