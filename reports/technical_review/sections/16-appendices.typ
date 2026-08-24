= Appendices

#pagebreak()
== Appendix A — Worked numerical day update

Take one source $u$ with $I_u=6$, road probability $tau_e=0.04$, and multiplier $alpha=0.20$. The following computation is the exact numerical interpretation of the daily edge-opportunity logic.

```text
x_e = α τ_e = 0.20 × 0.04 = 0.008
q_e = 1 − (1 − x_e)^I_u = 1 − 0.992^6 ≈ 0.0470
p_v = 1 − (1 − 0.0470)(1 − 0.030) = 0.0756
```

Now set $S_v=120$, $I_v=10$, $rho=0.06$, and $mu=0.006$. The expected transition counts (not the actual deterministic draws) are

```text
E[R_v⁺] = 10(0.06) = 0.6000
E[D_v⁺ after recovery] ≈ (10 − 0.6000)(0.006) = 0.0564
E[I_v⁺] = 120(0.0756) = 9.0720
```

If the keyed trials produce $R_v^+=1$, $D_v^+=0$, and $I_v^+=8$, the count state moves from $(S_v,I_v,R_v,D_v)=(120,10,0,0)$ to $(112,17,1,0)$. The total remains $130$. The distinction between these expectations and a reproducible integer trial is essential: the former summarizes repeated draws, while the latter is the scenario trace seen in the timeline.

#pagebreak()
== Appendix B — Worked Bayesian update

Assume modeled probability $p_v=0.08$, exposure $h_v=0.10$, $a=18$ symptomatic observations, $n=120$ observations, and evidence strength $k=0.80$. The illustrative update becomes

```text
P(H) = 0.015 + 0.55(0.08) + 0.65(0.10) = 0.1240
z = 18 / 120 = 0.1500
L = 0.18 + 0.65(0.15)(0.80) = 0.2580
F = 0.04 + 0.12(0.15)(0.80) = 0.0544
P(H | E) = [0.2580 × 0.1240] / [0.2580 × 0.1240 + 0.0544 × 0.8760] ≈ 0.4010
```

The hotspot score therefore rises from $12.4%$ to about $40.1%$ under the stated likelihood assumptions. It is an algebraic teaching calculation, not a diagnostic conclusion.

#pagebreak()
== Appendix C — Complexity and algorithmic scale

#table(
  columns: (1.45fr, 1.1fr, 1.45fr), inset: 6pt,
  fill: (x, y) => if y == 0 { rgb("#eaf2ff") } else { none },
  [Operation], [Illustrative complexity], [Why bounded scale matters],
  [Synthetic graph build], [$O(|V|+|E|)$], [Block/ring construction is linear in created objects.],
  [One SIR day, simplified traversal], [Depends on active sources and traversed connectors], [Small graphs make the transparent connector queue practical.],
  [Degree scores], [$O(|V|+|E|)$], [Every edge increments two endpoints.],
  [Brandes betweenness, unweighted], [$O(|V||E|)$], [A cap prevents centrality from dominating a desktop interaction.],
  [Dijkstra, simple unvisited scan], [$O(|V|^2+|E|)$ per source/target], [Only initial sources and five major destinations are sampled.],
  [Augmenting-path max flow], [Input dependent], [The graph cap and a single prioritized target keep the teaching computation responsive.],
  [Export/report creation], [Linear in serialized scenario size], [Large maps are rejected before they become large report payloads.],
)

#pagebreak()
== Appendix D — Exact interface contract summary

#table(
  columns: (1.2fr, 2.8fr), inset: 6pt,
  fill: (x, y) => if y == 0 { rgb("#eaf2ff") } else { none },
  [Contract], [Fields and semantic role],
  [CityNode], [Identifier, label, kind, facility type, population, block/district, planar position, optional OSM ID/coordinates.],
  [CityEdge], [Identifier, source/target IDs, distance, transmission probability, capacity, road class, optional label/OSM way ID.],
  [EpidemicParameters], [Transmission rate $alpha$, recovery $rho$, mortality $mu$, days $T$, initial infected IDs, seed $sigma$.],
  [InterventionBudget], [Maximum road closures $b_e$, maximum quarantined nodes $b_v$, maximum quarantined population $b_p$.],
  [InterventionAction], [Road closure, node quarantine, or block isolation, including target and human-readable reason.],
  [Node snapshot], [State label, infection probability, hotspot score, and four count compartments.],
  [StrategyOutcome], [Actions, budget use, timeline, hotspots, final/peak metrics, duration, containment, components, rationale.],
  [Fairness metadata], [Graph ID/fingerprint, initial infection IDs, budget, full epidemic parameters, seed, deterministic trial method.],
  [Scenario comparison], [Graph, evidence, five outcomes, winner, tie state, leading strategies, timestamp, disclaimer.],
)

#pagebreak()
== Appendix E — Test and review matrix

#table(
  columns: (1.45fr, 2.55fr), inset: 6pt,
  fill: (x, y) => if y == 0 { rgb("#eaf2ff") } else { none },
  [Area], [Representative positive, boundary, and recovery checks],
  [Graph builder], [Seed reproducibility; connected graph; facility types; no invalid population/edge fields.],
  [Engine], [Zero transmission; recoveries/deaths; quarantined node risk; valid probability bounds; count conservation.],
  [Strategies], [Budget respected; deterministic baseline; expected candidate ranking; tie-aware result.],
  [Bayes/recommendations], [No-evidence explanation; positive evidence rank; bounded posterior; target/cost/rationale text.],
  [OSM importer], [Normal fixture parse; invalid coordinate/radius; node cap; timeout/error; fallback/cache paths.],
  [Workspace controls], [Minimum/maximum input clamping; mode switch; importer pending/error; manual actions.],
  [Playback/analysis], [Day bounds; play/pause; sensitivity parameter change; reset to standard scenario.],
  [Graph UI], [Zoom; pan; selection; reset viewport; capped initial selections.],
  [Theme], [Light/dark update; persistence; document-class cleanup.],
  [Export/persistence], [CSV action; PDF component error behavior; scenario save/share contract.],
  [Desktop], [Runtime staging; no production Vite reference; fixture content in packaged assets; local store behavior.],
)

#pagebreak()
== Appendix F — Bibliography and implementation evidence

[1] W. O. Kermack and A. G. McKendrick, “A Contribution to the Mathematical Theory of Epidemics,” *Proceedings of the Royal Society A*, 1927. #link("https://doi.org/10.1098/rspa.1927.0118")[doi:10.1098/rspa.1927.0118]

[2] J. A. P. Heesterbeek, “The Kermack–McKendrick epidemic model revisited,” *Mathematical Biosciences*, 2005. #link("https://pubmed.ncbi.nlm.nih.gov/16135371/")[PubMed record]

[3] M. J. Keeling and K. T. D. Eames, “Networks and epidemic models,” *Journal of the Royal Society Interface*, 2005. #link("https://doi.org/10.1098/rsif.2005.0051")[doi:10.1098/rsif.2005.0051]

[4] U. Brandes, “A Faster Algorithm for Betweenness Centrality,” *Journal of Mathematical Sociology*, 2001. #link("https://doi.org/10.1080/0022250X.2001.9990249")[doi:10.1080/0022250X.2001.9990249]

[5] L. R. Ford Jr. and D. R. Fulkerson, “A Simple Algorithm for Finding Maximal Network Flows and an Application to the Hitchcock Problem,” *Canadian Journal of Mathematics*, 1956. #link("https://doi.org/10.4153/CJM-1956-045-5")[doi:10.4153/CJM-1956-045-5]

[6] E. W. Dijkstra, “A Note on Two Problems in Connexion with Graphs,” *Numerische Mathematik*, 1959. #link("https://doi.org/10.1007/BF01386390")[doi:10.1007/BF01386390]

[7] C. M. Bishop, *Pattern Recognition and Machine Learning*, Bayesian inference foundations. #link("https://link.springer.com/book/10.1007/978-0-387-45528-0")[Springer book page]

[8] OpenStreetMap, “Copyright and License.” #link("https://www.openstreetmap.org/copyright")[openstreetmap.org/copyright]

[9] Overpass API documentation, “Preface.” #link("https://dev.overpass-api.de/overpass-doc/en/preface/preface.html")[Overpass documentation]

[10] OpenStreetMap Wiki, “API v0.6: Map data by bounding box.” #link("https://wiki.openstreetmap.org/wiki/API_v0.6#Map_data")[OSM Wiki]

Project implementation evidence consulted for this report: shared contracts in `shared/epidemic.ts`; engine in `shared/epidemicEngine.ts`; strategies in `shared/interventions.ts`; preset catalog in `shared/demoPresets.ts`; importer in `server/osmImport.ts`; desktop package in `desktop/main.cjs` and `scripts/prepare-desktop-runtime.mjs`; quality evidence in `docs/qa-validation-summary.md` and `docs/qa-test-matrix.md`; packaging boundaries in `docs/windows-portable-package.md`; and the project checklist `todo.md`.
