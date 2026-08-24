= System architecture and information flow

== Logical architecture

EpiGraph is a full-stack TypeScript application. The browser client provides the five-step teaching workspace, 2D/3D graph explorers, timeline, sensitivity controls, charts, exports, theme selection, and Demonstration Mode. The server exposes typed tRPC procedures for scenario persistence, sharing, public-data import, and optional explanatory text. Shared modules implement the graph generator, epidemic engine, interventions, presets, and contracts. This arrangement keeps the algorithms independent from the visual layer and makes the same mathematical model available to server-side procedures, test code, and desktop runtime staging.

#align(center)[
  #box(fill: rgb("#f5f9ff"), inset: 9pt, radius: 4pt)[
    #text(weight: "bold", fill: rgb("#285787"))[Client workspace] $arrow.r$ #text(weight: "bold", fill: rgb("#285787"))[typed server procedures] $arrow.r$ #text(weight: "bold", fill: rgb("#285787"))[shared graph and simulation modules] $arrow.r$ #text(weight: "bold", fill: rgb("#285787"))[persisted report / local desktop store]
  ]
]

== Domain contract

The core contracts distinguish three kinds of vertex: population-bearing facilities such as homes, schools, hospitals, and offices; zero-population road intersections; and optional transit connectors. An edge contains identifiers, endpoints, a distance, a modeled transmission probability, a capacity, and a road class. A graph is therefore not a map image. It is a typed mathematical object with stable identifiers that can be serialized into a report or fixture.

The epidemic parameter vector is

#align(center)[
  $theta = (alpha, rho, mu, T, I_0, sigma)$,
]

where $alpha$ is the global transmission multiplier, $rho$ the per-day recovery probability, $mu$ the per-day mortality probability among people who remain infected after recovery draws, $T$ the number of days, $I_0$ the initial infected vertex set, and $sigma$ the simulation seed. The intervention budget is

#align(center)[
  $B = (b_e, b_v, b_p),$
]

where $b_e$ limits road closures, $b_v$ limits quarantined nodes, and $b_p$ limits the sum of populations in quarantined nodes.

== Portable runtime architecture

The Windows package launches Electron, starts a local Express server, and opens a Chromium window to the local loopback address. This design keeps front-end routing, server procedures, and desktop persistence behavior close to the hosted application. Production staging copies the built client and server runtime into the Electron package. The packaged application uses local file-based persistence instead of depending on the cloud database for saved desktop scenarios and reports.

The desktop boundary is intentionally explicit. Offline: synthetic graphs, all five algorithms, simulator computation, 2D/3D exploration, reports stored locally, CSV/PDF export, and fixture-backed Demonstration Mode. Online only: fresh OSM imports, LLM explanations, and public share links. This distinction was tested by inspecting the packaged client assets for stable curated-fixture identifiers rather than relying on an unminified TypeScript export name.

== Trust and failure boundaries

The interface never assumes a public service will respond. OSM import has small radius defaults, an input cap, a cache, a per-endpoint timeout, bounded endpoint failover, an official OSM XML fallback, and named error states. The LLM explanation is separate from the simulation engine and receives a compact payload. Thus a failed external explanation or map fetch cannot change the underlying mathematical comparison; it only reduces an optional presentation capability.
