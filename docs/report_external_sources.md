# External Sources for the Comprehensive Technical Report

This source log preserves the external references gathered during report preparation. The report will distinguish these general mathematical foundations from the project-specific implementation evidence in the repository.

1. W. O. Kermack and A. G. McKendrick, “A Contribution to the Mathematical Theory of Epidemics,” *Proceedings of the Royal Society A*, 1927. https://doi.org/10.1098/rspa.1927.0118
2. J. A. P. Heesterbeek, “The Kermack–McKendrick epidemic model revisited,” *Mathematical Biosciences*, 2005. https://pubmed.ncbi.nlm.nih.gov/16135371/
3. M. J. Keeling and K. T. D. Eames, “Networks and epidemic models,” *Journal of the Royal Society Interface*, 2005. https://doi.org/10.1098/rsif.2005.0051
4. U. Brandes, “A Faster Algorithm for Betweenness Centrality,” *Journal of Mathematical Sociology*, 2001. https://doi.org/10.1080/0022250X.2001.9990249
5. L. R. Ford Jr. and D. R. Fulkerson, “A Simple Algorithm for Finding Maximal Network Flows and an Application to the Hitchcock Problem,” *Canadian Journal of Mathematics*, 1956. https://doi.org/10.4153/CJM-1956-045-5
6. E. W. Dijkstra, “A Note on Two Problems in Connexion with Graphs,” *Numerische Mathematik*, 1959. https://doi.org/10.1007/BF01386390
7. C. M. Bishop, *Pattern Recognition and Machine Learning*, Chapter 1, Bayesian inference foundations. https://link.springer.com/book/10.1007/978-0-387-45528-0
8. OpenStreetMap, “Copyright and License.” https://www.openstreetmap.org/copyright
9. Overpass API documentation, “Preface.” https://dev.overpass-api.de/overpass-doc/en/preface/preface.html
10. OpenStreetMap Wiki, “API v0.6: Map data by bounding box.” https://wiki.openstreetmap.org/wiki/API_v0.6#Map_data

## Verified notes from consulted source pages

- Kermack and McKendrick’s 1927 article frames an epidemic as contact transmission from affected to susceptible people, followed by removal from the sick population through recovery or death. The report uses this as historical context only; the application is a discrete, graph-constrained classroom model rather than a clinical implementation.
- Brandes (2001) reports an algorithmic complexity of \(O(nm)\) time for unweighted betweenness centrality and \(O(nm+n^2\log n)\) for weighted networks, with \(O(n+m)\) space.
- Ford and Fulkerson’s 1956 network-flow work introduces a maximal-flow setting in which every link has an assigned capacity. The report uses capacity as an explicitly modeled road-class proxy, not as an observed human-mobility measurement.
- The selected `glossarium` Typst package version 0.5.10 documents the exact public imports `make-glossary`, `register-glossary`, `print-glossary`, `gls`, and `glspl`; its documented workflow requires `#show: make-glossary` before glossary references, registration of an entry list, and `print-glossary` to render entries.
