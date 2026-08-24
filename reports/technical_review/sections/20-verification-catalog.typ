#pagebreak()
= Appendix H — Verification catalog, quality evidence, and residual test boundaries

Software verification is not the same as asserting that an application “looks finished.” This project has deterministic algorithms, asynchronous imports, interactive graph transforms, user-entered boundaries, persistence paths, visual themes, desktop packaging, and a public-data dependency. A serious quality argument therefore requires several kinds of evidence. This appendix explains the test strategy, the properties checked, the release gate, and the limits of the evidence.

== H.1 Verification philosophy

The testing approach follows a layered claim. A pure mathematical routine should be checked with unit tests that make its input and expected output explicit. A rendered interaction should be checked in a component test that invokes events and observes user-visible state. A packaging claim should be checked through staging/asset inspection and local runtime smoke coverage. A live external service should have a bounded opt-in verifier rather than being required for every deterministic source test.

| Layer | Main question | Typical evidence | Why this layer is necessary |
|---|---|---|---|
| Pure model | Does an algorithm return the prescribed result? | Unit tests for graph, SIR, planners, fixture loader | Fast deterministic proof of local behavior |
| Component interaction | Does a control update the intended view state? | Rendered tests with clicks, values, pointer actions | Catches wiring and state-ownership errors |
| Service boundary | Does a request fail safely and return shaped data? | Router/import/error-path tests | Makes external failures understandable |
| Integration/package | Does the staged app contain the right runtime resources? | Production build, desktop smoke, archive/asset checks | Detects missing files and dev-only leakage |
| Human review | Is a result legible and correctly framed? | Screenshot inspection, QA matrix, documentation review | Prevents technically correct but misleading delivery |

No single layer substitutes for another. A 100% unit-tested intervention planner can still have a broken “Run comparison” button. A visually polished dashboard can still call an outdated routine. A portable file can be large and present but omit an offline fixture. The value of the release process is in crossing these boundaries deliberately.

== H.2 Mathematical core obligations

The epidemic engine tests cover more than nominal curve generation. They exercise deterministic replay from the same seed, validity of count bounds, recovery/mortality ordering, source handling, intervention removal, no-infection boundary conditions, and timeline aggregation. Each of these corresponds to a formal property documented in Appendix E.

```text
P1. Same (G, θ, actions, seed) produces identical outcome trace.
P2. For every population-bearing node, S+I+R+D remains equal to N.
P3. Counts never become negative or exceed available population.
P4. A closed road or quarantined node has no active transmission connector.
P5. A zero baseline does not produce undefined containment.
P6. A strategy comparison uses identical inputs except strategy selection rule.
```

The test suite also examines deterministic trial keys. A more ordinary `Math.random()` implementation could create plausible outputs but would not permit a fair outcome-by-outcome comparison. Reproducibility tests therefore verify repeated calls and seed-controlled variation. This is a pedagogical quality condition: a lecturer should be able to repeat a demonstration and get the same stated winner.

Graph-construction tests check node categories, generated locations, weighted edges, road distances, population counts, and bounded synthetic topology. These tests do not prove that a synthetic city is realistic; they prove it meets its own declared contract. The report maintains this distinction throughout: implementation correctness is not empirical calibration.

== H.3 Strategy-specific obligations

Each intervention method has a testable structural expectation. The Random strategy must use a reproducible shuffle and return an eligible ordering. Highest Degree must score endpoint incidence correctly. Betweenness must identify expected bridge-like vertices on small hand-checkable graphs. Dijkstra must convert probabilities to nonnegative route costs and return roads on selected paths. Min-cut must create a valid residual process and identify crossing cut candidates. The common budget filter must not exceed road, node, or population limits regardless of candidate order.

An especially important test set addresses fairness metadata. The comparison result carries graph identity or fingerprint, initial infected identifiers, complete parameter values, budgets, seed, and deterministic-trial configuration. The goal is not merely to show a winner; it is to make a winner falsifiable. A reviewer can inspect whether two strategies really used the same scenario.

Tie handling has a dedicated assertion. If multiple strategies have the same primary and secondary outcome tuple, the output must say that the result is tied or inconclusive. It must not select the first array member and call it best. This is an example of a small UI condition with substantive methodological significance. The user specifically noticed that a false “Random wins” result would undermine credibility; the corrected behavior is tested rather than left as a visual convention.

== H.4 Input boundaries, invalid values, and recovery states

The workspace controls are tested across valid, boundary, invalid, and recovery states. This is not busywork. The app is intended to let students explore slider combinations, budgets, infection levels, and manual actions. Without boundary tests, a negative budget or invalid population could propagate into a later algorithm where the resulting error becomes difficult to explain.

The test matrix distinguishes several classes of behavior:

| Input/interaction class | Required system response | Example |
|---|---|---|
| Valid normal case | Update scenario and recompute or enable run | A legal transmission slider change |
| Lower/upper boundary | Clamp or present permitted endpoint | Probability at $0$ or $1$ |
| Malformed or incomplete | Keep stable state and show clear guidance | Empty import query or invalid parsed number |
| Resource violation | Refuse safely with reason | Imported network beyond cap |
| Pending external action | Indicate work without stale false success | OSM import in progress |
| Recoverable service failure | Preserve workspace and explain next step | OSM endpoint unavailable |
| Reset/retry | Return to a known coherent state | Standard teaching reset |

Manual what-if actions receive additional care. A manual closure is allowed to change a scenario result, but it must remain distinct from an algorithmic plan. Tests verify the control surfaces and state transitions, while the comparison workflow continues to use only its own selected plan. This prevents a stale manual action from silently contaminating a supposedly fair five-strategy result.

== H.5 Timeline, sensitivity, and graph-interaction coverage

The animated timeline is tested at both ends: it must not advance beyond the final day, must handle a reset or replay correctly, and must display consistent boundary information. These are subtle bugs because animation often works during a short manual inspection but fails when a user rapidly clicks play, pauses at the end, switches scenarios, or starts a sensitivity sweep.

Sensitivity controls are similarly tested for parameter selection, range changes, playback state, and output rendering. The tests do not validate that a sweep is a scientific uncertainty interval—the report explicitly says it is directional—but they validate that the requested parameter actually drives the displayed model runs and that a user cannot place the UI into an impossible playback state.

The 2D network test set covers zoom, pan, selection, and reset. Pointer-driven graphs are particularly prone to regression after styling work: an overlay may intercept a click, a transform may persist into a new scenario, or a selected node could become inaccessible after panning. The tests target these behaviors at the rendered interaction level rather than assuming that component code inspection is enough.

== H.6 Theme, document, export, and share coverage

Global dark/light themes are tested not only for an isolated toggle but also for persistence and cleanup of the document root class. A theme bug can be technically harmless yet highly visible in a polished classroom application: text can become unreadable if a semantic background token is paired with the wrong foreground token. The tests and shared theme context reduce this risk.

Export features are bounded by their medium. CSV tests verify strategy-comparison serialization and expected fields. PDF export is implemented with browser-side rendering tools and must show a fallback when browser capture is unavailable. Share-page procedures check scenario identifiers and public-view retrieval semantics. The test claim is therefore “the application prepares and returns these artifacts as designed,” not “every viewer’s printer, browser, or network will render them identically.”

== H.7 Importer and public-service evidence

The OpenStreetMap importer is a deliberate external boundary. It has tests for request formation, bounded result transformation, oversized-network errors, cache use, fallback behavior, pending state, and error display. A live request test exists as an opt-in verification only. The reason is methodological: a live Overpass/OSM endpoint can change, rate-limit, or fail while the source code is unchanged. Requiring a live request for the whole release gate would make a deterministic code-release assertion dependent on public-service conditions.

This does not mean the importer is untested. It means the evidence is correctly classified. Mocked/service-contract tests establish local behavior; an opt-in live test establishes a time-specific integration observation; documented fixtures establish reproducible Demonstration Mode. The project never uses fixture success to claim that all OpenStreetMap requests will work, nor does it use a transient OSM outage to claim the simulation itself is broken.

== H.8 Desktop-package validation

The desktop release has its own quality path. A production client build and production server bundle are staged into the Electron runtime folder. A local runtime smoke test validates that the launcher can serve the packaged application path. Archive inspection confirms that development-only Vite plugin references are absent. Client-asset inspection confirms that actual demonstration fixture/preset content is present after minification and packaging.

The last point was learned through a real release failure. Searching for a source identifier such as an exported constant is not sufficient, because minifiers can rename or remove that literal. The corrected validation searches for stable data values such as preset identifiers and graph-fixture content. This is a general lesson in packaged-artifact testing: test the observable resource necessary for behavior, not a fragile implementation symbol.

The final portable executable is accompanied by a recorded file size and SHA-256 digest. This supports a simple release check on Windows. It does not mathematically prove that all hardware, antivirus environments, or user permissions will behave the same way. A user-side Windows smoke test remains the most direct confirmation of the packaged user experience, and it is explicitly distinguished from source-level test success.

== H.9 Release-gate evidence and limitations

At the quality-assured release gate, TypeScript checking completed without errors and the automated suite contained 62 passing tests across 24 test files, with one intentionally skipped opt-in live verifier. This is meaningful evidence, but it must be stated with precision. Passing tests show that the listed checks passed on the project environment at that time. They do not establish clinical validity, predict future external-service availability, or prove absence of every possible defect.

The project’s QA documentation includes a traceable matrix covering valid, boundary, invalid, and recovery states. It also records external-service boundaries and visual-review notes. The value of this documentation is that a reviewer can locate what was actually checked, what was deliberately left contingent, and why.

== H.10 Residual risk register

| Residual risk | Why it remains | Mitigation in the delivered project | Appropriate next step |
|---|---|---|---|
| Public OSM outage or rate limit | External services are not under project control | Endpoint failover, cache, bounded error message, fixtures | Monitor service policy; use local data source for a production system |
| Browser PDF variability | Canvas/font/cross-origin behavior differs by environment | Client fallback and alternate CSV/share exports | Server-rendered report service if required |
| Windows environmental differences | Antivirus, permissions, graphics drivers vary | Portable package, local data, release checksum, smoke procedure | Test on target hardware before a presentation |
| Numerical model uncertainty | Parameters are illustrative and not calibrated | Prominent scenario-model labels and limitations | Calibrate and validate against approved data in future research |
| Algorithm objective mismatch | Graph heuristics optimize proxies, not social policy | Five-way comparison and rationale disclosure | Multi-objective participatory optimization with governance review |

The verification conclusion is therefore intentionally modest and strong at the same time. The application has reproducible source-level evidence for its declared software behavior, an explicit package-validation path, and documented residual risks. It does not pretend that a test count turns an educational model into an operational epidemic-control system.
