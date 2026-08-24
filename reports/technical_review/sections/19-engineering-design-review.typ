#pagebreak()
= Appendix G — Engineering design review and module-level rationale

This appendix records software-engineering decisions separately from mathematical decisions. A project can have correct formulas but still fail as a learning tool if its state is inconsistent, imports are unbounded, a desktop build silently depends on cloud services, or a visual animation changes the result it is meant to explain. The design adopted a full-stack TypeScript application with a shared domain layer, a browser-facing React workspace, a server-side API layer, optional persistence, and an Electron desktop wrapper. Each boundary was chosen to keep the calculation traceable rather than to maximize architectural novelty.

== G.1 Layered architecture and the shared-domain decision

The source tree divides responsibilities into a client, a server, and a shared domain layer. The client owns interaction state and renders the workspace. The server owns API procedures, persistence adapters, bounded import calls, and explanation requests. The shared layer owns graph types, graph builders, epidemic functions, intervention planners, demonstration presets, and fixture-loading contracts.

```text
client UI → typed API boundary → server services / storage adapter
                     ↕
              shared graph and model contracts
                     ↕
      deterministic engine, planners, fixtures, test modules
```

The alternative would have been to implement the algorithms directly inside React components. That was rejected for several reasons. React render functions can re-run frequently; an algorithm executed during render could produce unstable state or wasted computation. More importantly, a component-local implementation is difficult to test without a browser and difficult to reuse in the desktop server. Pure shared modules make it possible to unit-test graph construction, infection transitions, strategy planning, fixture retrieval, and 3D profile mapping independently of the visual presentation.

The shared layer also prevents semantic drift. A `CityGraph`, `CityNode`, road edge, scenario parameter vector, intervention action, and outcome summary each have one primary TypeScript contract. The chart, 2D network explorer, 3D miniature, CSV export, PDF export, and share page all consume the same interpretation. That choice is more valuable than it appears: a mismatched edge identifier between a map and an algorithm would cause a closure to be shown but not applied, which is exactly the class of hidden error an academic simulator should avoid.

== G.2 React workspace and the five-step navigation model

The application uses a desktop-first workspace that guides a user through Setup, Network, Outcomes, Comparison, and Analysis. This was chosen instead of a single dense dashboard because the project has multiple conceptual stages. A student first specifies a scenario, then inspects the graph, then watches a run, then compares strategies, then interprets a sensitivity or hotspot analysis. A one-screen dashboard would show all controls at once but would obscure this dependency order.

The sequence is guidance, not a restrictive wizard. State remains available across steps, and the user can return to a prior stage. This is important for an exploratory discrete-mathematics project: inspection of an unexpected result may legitimately lead back to the network view or parameter controls. The interface therefore uses a visual ribbon and progress context rather than a modal workflow that locks the learner into a linear path.

The design is explicitly desktop-first. The user requested no mobile-specific layout target, so engineering effort concentrated on a wide workspace with simultaneous controls, charts, and graph canvas. This is a prioritization decision, not a claim that small-screen use is impossible. Basic responsive behavior can still exist through the component system, but no feature is validated as a mobile product requirement.

== G.3 State ownership, reset semantics, and side-effect control

The Home workspace owns scenario configuration, graph choice, active intervention plan, playback state, view choice, and derived result selection. Pure calculation functions receive snapshots of this state rather than mutating UI-owned objects. The reset control deliberately restores a single standard teaching scenario. It does not merely clear fields, because an empty state is a poor starting point for a classroom demonstration and cannot establish whether the system returned to a known configuration.

The reset is a substantive product decision. A reset must restore graph identity, parameter defaults, budget defaults, initial source choice, manual actions, timeline playback, sensitivity settings, active comparisons, and display messages in a coherent order. If it reset only the sliders while retaining stale manual closures or a previous imported graph, it would create an invalid apparent baseline. The associated rendered tests verify that this workflow stays stable.

React effects are used for asynchronous import completion, saved-scenario loading, and controlled UI synchronization rather than calculating core algorithmic outputs in an effect loop. This helps prevent the familiar bug where a new object literal on each render triggers an endless query or recomputation. The state model avoids setting state during render and uses memoization for derived collections where identity stability matters.

== G.4 2D graph explorer: faithful interaction before visual decoration

The 2D explorer provides a legible graph-level view. Nodes and roads have consistent semantic colors, roads can show closure state, selected elements expose details, and pan/zoom make a moderate graph inspectable. The 2D view was retained even after the 3D miniature was enhanced because it is the more faithful analytic display. Topology, intervention selection, and path structure can be read without occlusion or perspective distortion.

The graph interaction model uses a transform consisting of translation and scale. Wheel input modifies zoom within a bounded range; pointer drag changes pan; selection is a separate click interpretation. These rules are tested because graph interaction bugs are deceptive: a failure to reset a transform can make it appear that a node disappeared, while the underlying graph data is correct.

The decision not to use a full geographic GIS library for the graph explorer is deliberate. The project needs a teaching graph with imported coordinates as an option, not turn-by-turn navigation or tile-based cartography. A bespoke SVG/canvas-style graph interaction is lighter, easier to test, and avoids an unrelated map-rendering dependency taking over the project.

== G.5 3D architectural miniature: explanatory realism, not photorealism

The 3D view uses React Three Fiber and supporting Three.js utilities to render a high-detail architectural miniature. Building footprints, rooflines, streets, parcel surfaces, buffers, district lighting, outbreak halos, and quarantine fencing provide spatial cues. Facility type is expressed through differentiated geometry. Roads use surfaced strips and markings rather than bare graph lines. The tabletop camera creates a composed “city model” impression rather than a first-person scene.

This upgrade was a response to a user request for a prettier map, but its implementation is constrained by the academic purpose. Photorealism would make an invented synthetic population and probability field look too authoritative. The miniature style signals that the city is a model while still making hubs, corridors, blocks, and interventions intuitively visible. The 2D view remains available to guard against a 3D scene becoming the only evidence.

The 3D component delegates building-profile and facility geometry rules to a pure model module. That extraction is not merely code cleanup. It makes visual semantics testable: a hospital profile, an office profile, a road surface, or a quarantine fence can be validated without spinning up WebGL. It also keeps React rendering concerns from being entangled with the model’s classification logic.

== G.6 Data import: bounded OpenStreetMap access and semantic transformation

The real-road option imports a deliberately bounded network from OpenStreetMap. The importer is not a general geographic-data pipeline. It validates a compact request, uses a small search region, applies endpoint failover, caches results, reduces source geometry to bounded nodes and edges, classifies road style, and fails explicitly when the network would be too large. This protects both classroom response time and the user from an opaque “loading forever” experience.

Imported road geometry must not be confused with imported disease data. OpenStreetMap supplies road-network geometry and road-class metadata. It does not supply household population, infection prevalence, movement intensity, clinical outcomes, or policy authority. The application therefore generates or asks for synthetic model inputs after geometry import. This separation is prominently documented because a real-looking map can lead users to infer that every displayed number is real.

An endpoint failover policy was selected because public OSM services can be rate-limited, unavailable, or temporarily slow. It is a resilience layer, not a guarantee. Error messages distinguish unavailable service, unsupported/oversized result, and invalid response. The test suite covers importer pending and error states; live importer verification is opt-in because a public service changes independently of source code.

== G.7 Demonstration fixtures and offline-first teaching reliability

The original curated scenarios use bounded real-road extracts from East Village and Shoreditch. A prior desktop failure exposed an important delivery lesson: a Demonstration button that reaches a live network endpoint is not a demonstration mode. The corrected architecture stores curated road-graph snapshots as JSON fixtures and exposes a shared fixture loader. The client calls that loader for each preset instead of issuing an OpenStreetMap request.

The fixture import is bundled into the client-side build. Electron packaging validation searches for stable preset and graph identifiers in the produced assets rather than assuming that a source export name survives minification. This detail matters because a minified bundle can legitimately rename symbols; the relevant verification is that actual fixture content is present. The final validation confirmed fixture preset data in the packaged assets and verified that no Vite development-plugin reference leaked into the production archive.

The alternative of copying a fixture at application startup was less reliable, because it would create a path-resolution dependency inside an ASAR archive. Bundling it as a client import makes the demonstration graph available wherever the front-end bundle runs. The fixture is intentionally limited to curated teaching scenes; it is not an offline substitute for arbitrary map import.

== G.8 Server procedures, persistence, sharing, and explanation boundaries

The server exposes typed procedures for durable scenario records, share identifiers, reports, bounded import work, and an optional plain-English explanation. Typed procedures were preferred to ad hoc untyped fetch calls because the same schema is validated across client and server. Public share pages carry a share identifier rather than exposing account or database internals. A user can create a reproducible view of a scenario without granting edit access to every reader.

The explanation endpoint deliberately receives a compact structured summary rather than the entire graph or a raw model trace. This decision has three motivations: a long graph payload adds latency and can exceed service limits; a decision-maker explanation requires conclusions and assumptions rather than every node; and a compact request reduces the chance that a generative explanation invents a detail from a vast irrelevant payload. The server prompt constrains language toward plain English and marks results as academic scenario projections.

Explanations remain secondary. The primary result, metrics, selected actions, raw plan, and formula-driven hotspot scores are produced by deterministic application code. An LLM cannot change the winning plan, fabricate an intervention cost, or provide a medical diagnosis. If the explanation service is unavailable, the simulator still runs and presents its non-generative evidence.

== G.9 Export decisions: CSV, PDF, and permanent share link

The export design offers three different artifacts because they serve distinct review contexts. A CSV captures strategy comparison data for spreadsheet checking. A client-side PDF captures the visible report-oriented interface for a teacher or presentation. A share page provides a persistent linked scenario for a viewer. Treating these as one feature would be misleading: a PDF is frozen visual evidence, a CSV is a data extract, and a share page is an interactive record.

PDF generation uses browser-side rendering tools so that the scenario visual can be captured without a separate server-rendering pipeline. The code includes a safe fallback/error message, because image capture can fail on constrained browsers or complex canvases. The project does not claim that a PDF is an archival medical report; it is a classroom export of a bounded model view.

== G.10 Electron portable desktop package

The desktop application uses Electron’s main process to launch a local production server, open a BrowserWindow, manage lifecycle, and select a portable data folder beside the executable. The application does not depend on the cloud database when running in portable desktop mode. A local JSON store replaces cloud persistence for scenarios and reports. This decision supports the user’s preference for a Windows executable and reduces reliance on browser hosting for demonstrations.

Desktop packaging required several production-specific choices. Development Vite plugins must not be statically captured by production serving code, because the Electron package contains a built client and server rather than a JSX-transform environment. The server static-serving module was corrected to avoid that production leak. A staging script copies the production server bundle and built client assets into an Electron runtime layout; electron-builder produces a Windows x64 portable artifact. Runtime smoke coverage verifies the local serving path, while package inspection validates archive content.

The final release documentation reports a portable executable checksum, ensuring that a user can distinguish the validated artifact from an earlier build. This is a modest but meaningful software-engineering control: it makes “the final file” a verifiable object rather than a vague instruction to download the latest attachment.

== G.11 Security, privacy, and non-goals

No real personal health data is collected or required. Real-road import requests are bounded geographic queries, while population and infection values are synthetic educational values. Scenario persistence stores project state, not identity-sensitive health records. The design intentionally avoids claims of regulatory compliance, clinical safety, or operational authorization.

The project also does not attempt continuous background surveillance, scheduled refresh, real emergency notification, payment handling, or a general-purpose city operations platform. Each omitted capability is a boundary choice. Adding it would introduce data-governance, authentication, reliability, and policy responsibilities far beyond the stated discrete-mathematics objective.

== G.12 Engineering review conclusion

The implemented architecture is intentionally modest where correctness and reproducibility matter, and richer where explanation benefits: a pure shared mathematical core, typed service boundary, guided desktop workspace, analytical 2D graph, expressive but model-like 3D city, bounded import, offline demonstrations, and a portable Windows package. The most consequential engineering decision is not a framework selection. It is the refusal to let interface state, live web services, generative prose, or rendering decoration silently alter the mathematical scenario being compared.
