= Decision register: implementation choices and rationale

This register turns the development checklist into an auditable technical review. It records the material choices that shaped the delivered system, their motivation, and the trade-off accepted. The entries are grouped by dependency rather than chronological order; a later entry may refine an earlier one. Generated template boilerplate is excluded because it was not a project decision.

#pagebreak()
== A. Mathematical domain and graph foundations

#table(
  columns: (0.58fr, 1.42fr, 2.0fr), inset: 5pt,
  fill: (x, y) => if y == 0 { rgb("#eaf2ff") } else { none },
  [ID], [Decision], [Why it was made and trade-off],
  [D01], [Use a city graph rather than a raster map], [Graph vertices and edges make degree, shortest paths, centrality, and cuts directly computable. A conventional map layer would add visual realism but hide the discrete structure.],
  [D02], [Separate population locations from road connectors], [Junctions preserve route continuity but do not invent a population compartment. The trade-off is a simplified connector traversal rather than a full traffic model.],
  [D03], [Provide homes, schools, hospitals, offices, blocks, and roads], [Facility types make the city legible and support population heterogeneity. They remain scenario labels rather than observed land-use or occupancy data.],
  [D04], [Make synthetic generation seed-driven], [A fixed seed makes a graph and outcome repeatable for teaching, tests, and reports. It sacrifices the apparent novelty of a new random map on every refresh.],
  [D05], [Guarantee connected structure by construction], [Algorithms should have meaningful paths to compare; disconnected random graphs often create arbitrary no-path outcomes.],
  [D06], [Use road classes, distances, probabilities, and capacities], [One edge record can support visual width, probability routes, and min-cut structure. Values are proxies, not measurements.],
  [D07], [Use bounded graph-size controls], [Limits protect browser rendering and algorithm responsiveness. The trade-off is that citywide simulation is deliberately unsupported.],
  [D08], [Preserve stable graph/edge/node identifiers], [Actions, reports, tests, and fixtures must refer to the same objects across components.],
  [D09], [Use Haversine distance for imported geometry], [It gives a standard geographic crop/length calculation without needing a map SDK. It does not account for routing curvature beyond supplied way points.],
  [D10], [Use imported-junction population proxy], [The common engine needs $N_v>0$ at populated imported junctions. This allows a lesson but must never be read as census data.],
)

#pagebreak()
== B. Epidemic engine and probability choices

#table(
  columns: (0.58fr, 1.42fr, 2.0fr), inset: 5pt,
  fill: (x, y) => if y == 0 { rgb("#eaf2ff") } else { none },
  [ID], [Decision], [Why it was made and trade-off],
  [D11], [Use a discrete daily SIR-style state update], [It is intelligible to a second-year audience and supports animation. It is less expressive than continuous or agent-based epidemiology.],
  [D12], [Track deceased separately from recovered], [The brief asked for mortality outcomes, and a separate $D$ count makes transition order and reporting explicit.],
  [D13], [Use binomial event draws], [Individual opportunity logic gives $E[Y]=n p$ and bounded counts. It is a simplified independence assumption.],
  [D14], [Recover before modeled mortality each day], [This fixes an unambiguous transition order and prevents a person being both recovered and deceased in the same step.],
  [D15], [Combine exposures with a no-event complement], [It avoids invalid probability sums and treats multiple sources transparently. It assumes independent opportunities.],
  [D16], [Multiply road opportunity probabilities along a connector route], [Sequential travel suggests a product and preserves road-chain influence. It omits detailed route choice and time.],
  [D17], [Cap per-contact probability at 0.95], [The input remains valid and avoids extreme values. The cap is an implementation safeguard, not a clinical fact.],
  [D18], [Use keyed-hash pseudo-random trials], [Each node/day/event draw is stable under comparison, avoiding sequential RNG drift. It is deterministic pseudo-randomness rather than a physical process.],
  [D19], [Use an initial-infection fallback], [A blank selection still creates a teachable run. The fallback is deterministic and visible, avoiding silent all-zero results.],
  [D20], [Label every output a scenario projection], [The model is not calibrated, so forecasts or clinical claims would be misleading.],
)

#pagebreak()
== C. Intervention and comparison choices

#table(
  columns: (0.58fr, 1.42fr, 2.0fr), inset: 5pt,
  fill: (x, y) => if y == 0 { rgb("#eaf2ff") } else { none },
  [ID], [Decision], [Why it was made and trade-off],
  [D21], [Compare five established strategies], [The course objective is understanding/comparison, not invention. The selected set spans baseline, local connectivity, bridge connectivity, route likelihood, and cut separation.],
  [D22], [Include seeded Random], [A baseline prevents overclaiming and supports a chance-alignment teaching case. It is not framed as recommended policy.],
  [D23], [Use degree as a local-hub heuristic], [It is simple to explain and test. It may miss low-degree structural bridges.],
  [D24], [Use unweighted Brandes betweenness], [Topological bridges are the lesson and the runtime is bounded. It does not use probability-weighted centrality.],
  [D25], [Transform route probability by $-ln(tau)$], [Products become additive nonnegative costs so Dijkstra applies. It assumes an edge probability can stand in for route opportunity.],
  [D26], [Target five largest non-infected destinations in Dijkstra], [This creates a small meaningful destination set and remains fast. It is a design heuristic rather than a complete all-pairs calculation.],
  [D27], [Run min-cut from source to hospital/large destination], [It gives an interpretable containment story. The target selection is a policy proxy, not a full multi-sink flow optimization.],
  [D28], [Use road-class capacity proxy], [Required for min-cut and visible in the graph model. It is not observed movement capacity.],
  [D29], [Constrain roads, nodes, and population], [A budget becomes enforceable and comparable. Monetary/social costs are not fabricated.],
  [D30], [Select feasible nodes before roads], [The selection procedure is deterministic and readable. It is not a joint global optimum.],
  [D31], [Use lower infections then modeled deaths as winner order], [This makes the scorecard decisive while revealing remaining metrics. It is not a normative real policy function.],
  [D32], [Represent equal outcomes as ties], [Prevents false unique winners created by sort order and improves scientific honesty.],
  [D33], [Keep manual actions outside algorithm comparison], [Exploration should not mutate or contaminate a fair five-way result.],
)

#pagebreak()
== D. Bayesian, recommendation, and experiment choices

#table(
  columns: (0.58fr, 1.42fr, 2.0fr), inset: 5pt,
  fill: (x, y) => if y == 0 { rgb("#eaf2ff") } else { none },
  [ID], [Decision], [Why it was made and trade-off],
  [D34], [Use explicit Bayes-rule hotspot update], [It demonstrates prior, likelihood, posterior, and evidence strength visibly. It is not a diagnostic model.],
  [D35], [Build prior from exposure plus current simulation probability], [It connects graph dynamics to evidence reasoning. Coefficients are illustrative rather than estimated.],
  [D36], [Let users enter symptom count, observed population, and strength], [Inputs make the update inspectable and support “what if” teaching. They are constrained to valid ranges.],
  [D37], [Write recommendations from winning actions], [A score becomes a concrete target/rationale/cost line. The recommendation text remains conditional.],
  [D38], [Keep LLM explanation optional and downstream], [Plain language helps decision-makers, but numerical calculations must remain deterministic and inspectable.],
  [D39], [Use a compact LLM payload], [It avoids server input-limit failure and prevents unnecessary graph serialization.],
  [D40], [Record fairness metadata in the comparison], [Users and exported reports can audit which conditions were held fixed.],
  [D41], [Provide sensitivity sweep rather than confidence labels], [Directional parameter dependence can be taught honestly; calibrated uncertainty cannot be claimed.],
  [D42], [Create five curated strategy-winning scenes], [A presentation needs distinct examples. Each scene teaches contextual performance rather than global superiority.],
  [D43], [Make demonstration order fixed], [A presenter can reliably step through the same proof-of-concept sequence.],
)

#pagebreak()
== E. Interface, visualisation, and teaching choices

#table(
  columns: (0.58fr, 1.42fr, 2.0fr), inset: 5pt,
  fill: (x, y) => if y == 0 { rgb("#eaf2ff") } else { none },
  [ID], [Decision], [Why it was made and trade-off],
  [D44], [Use a desktop-first five-step ribbon workspace], [The target is a laptop classroom demonstration; steps reduce control overload. Mobile-specific layouts were deliberately out of scope.],
  [D45], [Show timeline playback and scrubbing], [The dynamic model becomes inspectable at every day, not only at a final chart.],
  [D46], [Provide 2D graph zoom, pan, selection, reset], [Learners need direct structural inspection and recovery from a lost viewport.],
  [D47], [Provide 3D architectural miniature], [Visual engagement improves while preserving visible topology. It avoids false photorealism.],
  [D48], [Add facility geometry, road markings, parcels, buffers, lighting], [These visual cues make districts and intervention points readable without altering graph semantics.],
  [D49], [Display outbreak halos and quarantine fences], [The intervention and state change remain visible in 3D rather than only in a table.],
  [D50], [Use global light/dark tokens], [Theme consistency avoids page-by-page contrast errors and persists user preference.],
  [D51], [Honor reduced-motion preferences], [Animation is supportive, not required for comprehension.],
  [D52], [Offer standard scenario reset], [Presenter recovery must be one-click; it also protects repeatable demonstrations.],
  [D53], [Add presenter notes/script], [Mathematical interpretation needs a concise spoken path, not only controls.],
  [D54], [Add CSV, PDF, and share page], [A project needs evidence beyond live UI. Multiple exports serve data, printable, and link-based review.],
)

#pagebreak()
== F. External-data, resilience, and desktop choices

#table(
  columns: (0.58fr, 1.42fr, 2.0fr), inset: 5pt,
  fill: (x, y) => if y == 0 { rgb("#eaf2ff") } else { none },
  [ID], [Decision], [Why it was made and trade-off],
  [D55], [Use bounded OSM imports], [Real road geometry is engaging, but citywide import would be fragile, slow, and too complex for the lesson.],
  [D56], [Use Overpass then official XML fallback], [Different public routes reduce availability risk. The system still communicates failure rather than fabricating geometry.],
  [D57], [Cache imports for 15 minutes], [This respects public infrastructure and improves repeated classroom use.],
  [D58], [Clip ways before node limit], [The cap measures the selected neighborhood, not unrelated geometry continuing beyond it.],
  [D59], [Surface oversized/empty/unavailable errors], [Failure modes are teachable and recoverable instead of indefinite loading.],
  [D60], [Keep OSM attribution], [Geometry source must remain clear in graph/report data.],
  [D61], [Bundle fixture JSON for demos], [A classroom demo must not depend on upstream OSM availability or changing data.],
  [D62], [Use Electron portable Windows x64], [The user preferred a robust desktop artifact; the shell reuses the full-stack codebase.],
  [D63], [Start local Express loopback in Electron], [Server procedures work locally without hosted dependencies.],
  [D64], [Use local desktop JSON persistence], [Core desktop saves should work without database access.],
  [D65], [Exclude Vite development plugin from production runtime], [A packaged desktop app cannot rely on build-only JSX tooling.],
  [D66], [Validate package contents and checksum], [Runtime inspection catches packaging errors that source tests alone cannot.],
)

#pagebreak()
== G. Verification, release, and handoff choices

#table(
  columns: (0.58fr, 1.42fr, 2.0fr), inset: 5pt,
  fill: (x, y) => if y == 0 { rgb("#eaf2ff") } else { none },
  [ID], [Decision], [Why it was made and trade-off],
  [D67], [Write pure-module tests for math and visuals], [Logic remains verifiable without browser/3D runtime noise.],
  [D68], [Add rendered interaction tests], [A control that is present but fails to update state is a product defect, even if pure functions pass.],
  [D69], [Document QA matrix and validation summary], [Release evidence should be reviewable and not depend on oral memory.],
  [D70], [Keep live OSM verifier opt-in], [Third-party availability should not make the deterministic local release suite flaky.],
  [D71], [Check TypeScript at release gate], [Shared contracts and component refactors can introduce unsafe mismatches caught before delivery.],
  [D72], [Run full 62-test release suite], [Regression coverage protects earlier completed capabilities during finishing work.],
  [D73], [Save project checkpoints], [The user can restore auditable milestone states rather than trusting a mutable working directory.],
  [D74], [Create a private GitHub repository], [Source control and project handoff are preserved without exposing work by default.],
  [D75], [Provide Windows CLI guidance], [The user completed their own authenticated repository push and learns a reproducible workflow.],
  [D76], [Attach final portable executable separately], [The requested primary deliverable is usable without a hosted site.],
  [D77], [Leave external Windows smoke test honestly pending], [A Linux sandbox cannot prove every Windows device will launch; recording that uncertainty is more rigorous than pretending it was tested.],
)
