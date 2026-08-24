= Graph construction and data model

== Formal graph representation

At any point, the simulator operates on an undirected graph $G=(V,E)$. The vertex set is divided into disjoint population-bearing locations $V_P$ and movement connectors $V_C$. For every $v in V$, the contract records an identifier, label, planar display position, type, district/block metadata, and population $N_v ≥ 0$. A connector is characterized by $N_v=0$. For every edge $e={u,v} in E$, the contract records distance $d_e$, modeled transmission probability $tau_e ∈ [0,1]$, capacity $c_e$, and road class $r_e$.

This partition is an important modeling choice. A city map contains junctions that are necessary for connectivity but do not themselves represent a building population. Treating every junction as an SIR compartment would artificially invent people. Removing them would destroy road paths. The implemented engine instead traverses zero-population connectors as path intermediates while applying population transitions only at $V_P$.

== Synthetic generator

The default graph is a small connected synthetic city, rather than a random geometric graph with no narrative structure. A reproducible integer seed initializes a lightweight pseudo-random generator. The generator lays district hubs on a grid, places block intersections around each hub, attaches residences to each block, connects hub and intersection rings, attaches schools, hospitals, and offices to nearby intersections, and adds a bounded number of extra intersection roads. This constructs a graph with both local neighborhoods and cross-district corridors, allowing centrality and cuts to exhibit different behavior.

For a fixed configuration $(D,B,H,S,H_o,O,rho_G,sigma)$—districts, blocks/district, homes/block, schools, hospitals, offices, density, and seed—the output is fixed. Its stable identity incorporates the seed and main dimensions. Facility populations are generated synthetic values: homes use a bounded interval, facilities use a type-specific central value with controlled multiplicative variation. This is a pedagogical model of heterogeneous locations, not a demographic reconstruction.

The Euclidean display distance between two synthetic positions is

#align(center)[
  $d_(u,v) = sqrt((x_u-x_v)^2 + (y_u-y_v)^2),$
]

and the reported route distance is $d_e=max(0.12, d_(u,v)/9.5)$ km, rounded by the implementation to two decimal places. Long synthetic edges are classified primary or secondary; short edges local. The road class determines a capacity proxy: primary $1200$, secondary $700$, local $250$, and otherwise $80$. It also enables a consistent visual language in the 2D and miniature 3D renderers.

The configured road probability is sampled in a visible bounded interval:

#align(center)[
  $tau_e = round_3(tau_min + U_e max(0,tau_max-tau_min)),$
]

where $U_e$ is a seeded uniform deviate and $round_3$ rounds to three decimal places. The explicit minimum and maximum sliders exist so a teacher can make a network weakly or strongly coupled without editing code.

== Imported road geometry

The real-road route uses the *Overpass API* first and an official OSM small-area XML route as fallback. An import configuration contains a place label, centre latitude/longitude, radius, maximum nodes, and a footway flag. Coordinates are clamped to valid latitude and longitude ranges, the radius to $[0.05,1.5]$ km, and the maximum nodes to $[20,320]$. The defaults are intentionally neighbourhood scale. The application caches normalized imports for 15 minutes under a key based on rounded centre, radius, cap, and footway flag.

Haversine distance is used to crop road geometry and measure imported edges:

#align(center)[
  $a = sin^2(Delta phi/2)+cos(phi_1)cos(phi_2)sin^2(Delta lambda/2), quad d=2R "atan2"(sqrt(a),sqrt(1-a)),$
]

with $R=6371$ km. A way crossing the selected boundary is clipped before node-limit checking. The normalization then removes duplicate edge fragments, rejects fewer than eight nodes or seven edges, rescales coordinates for visualization, and preserves OSM IDs and attribution. Road type is converted to a model class. For example, primary roads receive $(tau_e,c_e)=(0.061,150)$ and local roads $(0.034,65)$ in the imported graph normalizer.

Crucially, a junction population is a documented proxy $N_v=45+28deg(v)$ for imported roads, not population data from OSM. This is a deliberate compromise: the graph needs count-bearing locations to run the same SIR engine, but road geometry does not supply occupancy. The report therefore never describes imported simulation outcomes as real city forecasts.

== Actions as graph transformations

An intervention action transforms graph availability, not the original serialized graph. A road closure contributes an identifier to $E_("closed")$; a quarantine contributes an identifier to $V_Q$. The active edge set on day $t$ is

#align(center)[
  $E_t^A = {e={u,v} ∈ E : e ∉ E_("closed"), u ∉ V_Q, v ∉ V_Q}.$
]

This non-destructive representation allows the baseline and all alternatives to share one original graph. It also allows a Reset control to clear manual transformations and restore the teaching scenario without rebuilding the city differently.
