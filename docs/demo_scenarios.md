# Classroom Demonstration Scenarios

## Scenario A — Default Fair Comparison

Use the default **Asterhaven** synthetic city and leave the provided calibrated parameters unchanged. Select one population-bearing starting location, then run the comparison. This is the primary demonstration because it visibly produces non-trivial epidemic spread and differing outcomes while retaining the same seed and intervention budget for every strategy.

| Talking point | What to show |
|---|---|
| Fairness | The scorecard's shared graph, seed, initial infection, duration, and budget framing |
| Algorithm effect | Different final cases and selected actions despite identical resources |
| Discrete-time process | The timeline scrubber, day controls, and active-infections chart |
| Model limitation | The visible academic-scenario disclaimer |

## Scenario B — Constrained Containment

Lower the maximum road closures and quarantined locations, then re-run the same city, starting location, and seed. Explain that the strategies remain comparable because they receive the *same smaller constraint*. This is useful for showing why resource allocation matters more than simply increasing the number of closures.

## Scenario C — Bayesian Evidence Update

Keep the default graph and comparison inputs, then add observed symptom evidence to a population location that is not initially infected. Compare the hotspot ranking before and after evidence is entered. Explain that the panel changes a **model priority score**, not a medical diagnosis or confirmed infection estimate.

## Scenario D — Bounded Real-Road Network

Switch to the real-road graph tab and import a small neighborhood-scale area. If the import reports an oversized-network or public-data error, reduce the radius or node cap and retry. State clearly that OpenStreetMap geometry is real road data, while location populations and all disease dynamics remain classroom simulation proxies.
