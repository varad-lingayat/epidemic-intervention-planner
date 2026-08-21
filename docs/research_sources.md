# Research Source Notes

## Mathematical Epidemic Model

Kermack and McKendrick's 1927 article frames a contact-infection model in which affected individuals are eventually removed from the sick population through recovery or death, and discusses how infectivity, recovery, mortality, and the remaining susceptible population shape epidemic termination. This provides historical and mathematical context for the simulator's transparent susceptible–infected–recovered model with an explicit mortality outcome. The application is a discrete-time, graph-constrained educational adaptation rather than an implementation of the original continuous model.[1]

## Shortest-Path Method

Mathematics LibreTexts presents the shortest-path problem as finding a least-weight route in a weighted graph and describes Dijkstra's method as a solution method. In the application, the road transmission probability is transformed into a positive path weight using \(-\ln(p)\), so paths with greater compounded transmission probability receive lower total weights.[2]

## References

[1] [W. O. Kermack and A. G. McKendrick, “A contribution to the mathematical theory of epidemics,” *Proceedings of the Royal Society A*, 1927](https://doi.org/10.1098/rspa.1927.0118)

[2] [Mathematics LibreTexts, “Shortest Path”](https://math.libretexts.org/Bookshelves/Applied_Mathematics/Math_in_Society_(Lippman)/06%3A_Graph_Theory/6.03%3A_Shortest_Path)
