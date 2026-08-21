# EpiGraph Presenter Script

## Opening — 20 seconds

> “This is EpiGraph, a discrete-mathematics intervention simulator. It compares five established graph strategies under the same city graph, infection seed, epidemic assumptions, and intervention budget. The outputs are academic scenario-model projections, not public-health forecasts.”

## Guided Walkthrough — 60 to 90 seconds

| Screen | Suggested narration |
|---|---|
| Configure | “Here I define a graph, transmission, recovery, mortality, initial infection, and a limited number of closures or quarantines. The bounds make every assumption visible.” |
| Symptom evidence | “I can add symptom evidence for a selected location. Bayes’ theorem combines a model prior with the entered evidence and connected-neighbour context to rank possible hotspots. It is a decision-support score for this classroom model, not a medical diagnosis.” |
| Explore network | “Locations are nodes and movement paths are edges. I can select initial infections or apply a limited manual closure to see a what-if scenario.” |
| View outcomes | “The SIR timeline shows active infections, cumulative cases, recoveries, and modeled deaths over discrete time steps.” |
| Compare | “Every strategy has exactly the same starting conditions and resources. The scorecard compares their final cases, peak, mortality, containment, and budget use. A tie is shown honestly as a tie.” |
| Sensitivity | “This panel changes one assumption at a time, so I can explain which model inputs are driving the outcome.” |

## Demonstration Mode — Five Brief Transitions

For every preset, load the scenario, point to its **Expected leader**, then move to **Compare**. Say: “This is not a claim that one method is universally best. It demonstrates how topology, infection sources, and a fixed budget determine which established method has the best modeled outcome in this particular controlled case.”

| Preset | Emphasis |
|---|---|
| Random selection | “A baseline may occasionally align with a critical link by chance; that is why one run should never be treated as a universal rule.” |
| Highest degree | “Highly connected points can act as efficient control targets in this topology.” |
| Betweenness centrality | “Locations that bridge many shortest routes can matter even when they are not the most locally connected.” |
| Dijkstra blocking | “Likely transmission routes are prioritized by probability-aware shortest-path logic.” |
| Max-flow/min-cut | “The selected cut identifies a small containment boundary between source and target parts of the graph.” |

## Closing — 15 seconds

> “The contribution is a transparent comparison of graph algorithms under equal constraints. The best strategy depends on the stated scenario, so the simulator provides both verified demonstrations and tools to inspect assumptions rather than making a universal intervention claim.”
