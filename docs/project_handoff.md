# Epidemic Intervention Planner

## Project Summary

This is a **desktop-first discrete mathematics demonstration** that compares established graph algorithms for epidemic intervention planning. It models a small synthetic city or a bounded neighborhood-scale road graph as a network, runs a reproducible discrete-time susceptible–infected–recovered (SIR) scenario, and evaluates five interventions under exactly the same graph, starting infections, model parameters, random seed, duration, and resource budget.

> **Important limitation:** Every numerical result is an academic scenario-model projection. It is not a real public-health forecast, diagnosis, or operational recommendation.

| Area | What the application provides |
|---|---|
| Graph model | Synthetic city with homes, schools, hospitals, offices, blocks, weighted roads, and a bounded OpenStreetMap road import option |
| Epidemic model | Deterministic, discrete-time SIR progression with configured transmission, recovery, mortality, starting locations, duration, and seed |
| Fair comparison | Five strategies receive identical outbreak conditions and identical road/population intervention limits |
| Visual analysis | Zoomable graph, facility markers, spread timeline, charts, scorecard, recommendations, and light/dark themes |
| Decision support | Bayesian hotspot ranking, plain-English explanation, persisted report, public share link, and PDF download |

## Demonstration Workflow

Start with the default **Asterhaven** synthetic city. Select one to three population locations as initial infections, adjust the outbreak assumptions and intervention limits if desired, then choose **Run fair comparison**. The resulting scorecard displays the same outbreak under Random selection, Highest Degree, Betweenness Centrality, Dijkstra Blocking, and Max-Flow/Min-Cut. The selected strategy is the outcome with the lowest final modeled infections, with modeled mortality used as a tie-breaker.

For a strong classroom demonstration, first show the default outcome table and timeline. Then explain that the scorecard is a controlled comparison: the differences arise from *where* the fixed budget is allocated, not because one algorithm was given more closures, time, or initial information. Finally, add symptom evidence for a location and use the Bayesian hotspot panel to explain why the posterior ranking changes.

| Step | Suggested explanation to the teacher or examiner |
|---|---|
| 1. Graph construction | “Locations are vertices, movement corridors are edges, and edge probabilities represent simplified daily transmission opportunity.” |
| 2. Disease progression | “At every time step, infected population may transmit through connected roads, recover, or enter the modeled mortality count.” |
| 3. Fair budget | “Each strategy receives the same maximum road closures, location quarantines, and quarantined population.” |
| 4. Algorithm comparison | “The study compares known graph methods; it does not claim to invent a new public-health algorithm.” |
| 5. Evidence update | “Observed symptom evidence updates a location’s model risk score; it is not a medical diagnosis.” |

## Mathematical Methods

The SIR family of epidemic models distinguishes susceptible, infected, and removed population. The original Kermack–McKendrick work describes contact infection together with removal by recovery or death; this project uses a simpler, inspectable graph-constrained discrete-time adaptation with a separate mortality outcome.[1]

The application compares five intervention-selection methods. **Random selection** acts as a controlled baseline. **Highest degree** prioritizes highly connected nodes. **Betweenness centrality** identifies nodes that lie on many shortest routes; the implementation uses the Brandes-style unweighted centrality approach. **Dijkstra blocking** transforms an edge transmission probability \(p\) into a positive route cost \(-\ln(p)\), then prioritizes roads repeatedly appearing on likely transmission routes. This transformation makes a path’s summed cost correspond to the negative logarithm of its compounded probability. **Max-Flow/Min-Cut** finds a capacity bottleneck separating infected locations from high-population targets, interpreting selected cut edges as containment points.

For each population-bearing location, the Bayesian panel combines a model-derived prior with local symptom evidence. In standard probability language, it produces a posterior value proportional to likelihood times prior. The posterior is a **ranking feature** for the classroom simulation; it is deliberately not presented as a clinical probability.

## Data, Scope, and Limitations

The real-network option fetches only a user-selected, neighborhood-scale road area, normalizes it into the same city-graph structure, clips it to the requested radius, and rejects oversized imports. This keeps the classroom simulation responsive and prevents it from implying city-wide operational coverage. OpenStreetMap data is made available under the Open Database License; where OSM-derived data is shown, the project provides OpenStreetMap attribution and identifies the data source.[3]

The system deliberately omits demographic calibration, age structure, testing delays, vaccination, real disease surveillance, medical validation, and uncertainty intervals. Its purpose is to teach graph modeling, constrained optimization, probability updates, and reproducible algorithm comparison rather than to forecast a disease outbreak.

## Desktop Support Boundary

The interface is intentionally designed and verified for a desktop classroom demonstration. It supports globally switchable light and dark themes, ordinary keyboard controls for interactive graph elements, and reduced-motion preferences. Dedicated mobile layouts and specialized assistive-technology workflows are not part of this academic scope; this boundary should be stated plainly in any project presentation.

## Verification Evidence

The project was validated with TypeScript checking and **26 automated tests** across eight test files. These tests cover synthetic graph generation, SIR transitions, initial-infection selection, budget enforcement, five-strategy fairness, Bayesian scoring, recommendation structure, OSM normalization/failover/size limits, explanation fallback behavior, report creation/retrieval, and a server-rendered persisted report preview.

The persisted-report rendering test verifies that the public-share/PDF target contains the scenario configuration, final graph snapshot, plain-English explanation, selected interventions, comparison charts, and recommendations. The PDF control now reports a clear error message if the report target is unavailable or the export process fails. A desktop visual review also confirmed that the report preview renders these sections together in the dashboard.

## References

[1] [W. O. Kermack and A. G. McKendrick, “A contribution to the mathematical theory of epidemics,” *Proceedings of the Royal Society A*, 1927](https://doi.org/10.1098/rspa.1927.0118)

[2] [Mathematics LibreTexts, “Shortest Path”](https://math.libretexts.org/Bookshelves/Applied_Mathematics/Math_in_Society_(Lippman)/06%3A_Graph_Theory/6.03%3A_Shortest_Path)

[3] [OpenStreetMap, “Copyright and License”](https://www.openstreetmap.org/copyright)
