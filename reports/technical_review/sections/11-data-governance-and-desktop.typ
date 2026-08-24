= Data provenance, governance, and desktop packaging

== Road geometry versus model variables

OpenStreetMap contributes road geometry, labels, classes, and identifiers under its published attribution and licence terms [8]. The app preserves an attribution string in the normalized graph. It does not source people, symptoms, infections, deaths, or travel volumes from OSM. Every such quantity used by the simulation is synthetic or user-configured. This distinction is repeated in import guidance, generated reports, and portable-package documentation because a realistic-looking street map can otherwise create an unwarranted impression of real epidemiology.

The primary public-data route uses bounded Overpass queries [9]. The query filters road types and a radius around a selected point. The implementation performs one attempt per public endpoint instead of unbounded retries. Each attempt has an eight-second timeout, while the overall import orchestration has a 28-second deadline. If public interpreters fail, the app requests a bounded official OSM XML map extraction [10]. Failure is represented as a named status such as upstream unavailable, oversized network, invalid area, or empty network. The visible workspace error state remains on screen so a learner can recover by reducing the area.

== Import safety measures

#table(
  columns: (1.25fr, 2.75fr),
  inset: 7pt,
  fill: (x, y) => if y == 0 { rgb("#eaf2ff") } else { none },
  [Measure], [Reason it was selected],
  [Radius clamp: 0.05–1.5 km], [Limits query scale and supports a network that can be meaningfully read in a class session.],
  [Node clamp: 20–320], [Keeps graph algorithms, WebGL rendering, and comparison UI responsive; checks happen before normalization.],
  [Boundary clipping], [A way may contain full geometry beyond the chosen circle. Clipping before the cap prevents an adjacent long road from causing a misleading oversize rejection.],
  [Cache: 15 minutes], [Avoids repeatedly asking public services for the identical neighborhood and improves repeat use.],
  [Multiple endpoints and one official fallback], [Public availability varies; bounded failover improves resilience without hammering third-party infrastructure.],
  [Attribution and proxy flag], [Makes provenance explicit and records that modeled junction population is not source data.],
  [Offline fixtures for demos], [Protects the teaching path from public-service availability, rate limits, and mutable upstream geometry.],
)

== Portable Windows package

Electron Builder produces a portable Windows x64 executable rather than a traditional installer. The portable executable is suitable for copying to a writable directory and launching directly. Local scenario/report data is stored beside the executable; an unsigned-file warning may require normal Windows user approval. The packaged runtime deliberately avoids statically importing Vite development plugins. This resolved a production launch failure in which server code accidentally captured JSX/development configuration that should not exist in a runtime bundle.

Demonstration Mode initially depended on live OSM, which created a user-visible “map could not load” failure in a setting where demonstrations should be reliable. The repair moves the curated East Village and Shoreditch graph snapshots into fixture JSON files imported by a shared module. The client calls the fixture loader for named presets rather than making a live request. Package validation searched for stable scenario identifiers and fixture data in minified client assets, not merely a TypeScript export name that a bundler is free to erase. The final artifact was copied with a verified SHA-256 checksum and has a separately pending user-device smoke confirmation.

== Security and privacy observations

The hosted application uses managed authentication and database infrastructure for persistence. The portable desktop variant uses local persistence and does not require a user account to run core simulations. No secret is hard-coded into the mathematical engine. External connection failure is handled as a degraded capability, not a silent fallback that changes the model. Public share links should be treated as intentionally published scenario reports; they are not a substitute for sensitive-data storage governance.
