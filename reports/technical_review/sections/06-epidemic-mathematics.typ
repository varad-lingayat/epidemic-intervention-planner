= Discrete epidemic mathematics

== Relationship to classical SIR

Kermack and McKendrick’s classical epidemic formulation models rates of change in susceptible, infected, and removed compartments [1]. In its familiar homogeneous form,

#align(center)[
  $d S / d t = - beta S I / N, quad d I / d t = beta S I / N - gamma I, quad d R / d t = gamma I.$
]

Those differential equations motivate the state names, but they are not the equation executed by EpiGraph. A homogeneous well-mixed $beta$ is unsuitable for showing how roads, bridges, and cuts change access between locations. The application instead uses a finite daily update on each population-bearing vertex. This distinction matters: $alpha$, $rho$, and $mu$ are scenario probabilities or multipliers, not fitted clinical rates.

At day $t$, vertex $v$ has count vector

#align(center)[
  $X_v(t)=(S_v(t), I_v(t), R_v(t), D_v(t)),$
]

where $S_v+I_v+R_v+D_v=N_v$. An initial selected population location begins with

#align(center)[
  $I_v(0)=min(12,N_v), quad S_v(0)=N_v-I_v(0),$
]

and all other initial counts are zero. If no initial location is selected, the largest population-bearing vertex becomes the deterministic fallback. This avoids a silent empty epidemic while ensuring that every comparison starts at the same location.

== Edge exposure and path transmission

For an active road $e$ leaving infectious source $u$, the per-contact daily probability is

#align(center)[
  $x_e=min(0.95, alpha tau_e).$
]

If $I_u(t)$ infectious people each contribute one simplified independent opportunity across that road, the probability of at least one opportunity is the complement of zero opportunities:

#align(center)[
  $q_e(t)=1-(1-x_e)^(I_u(t)).$
]

The cap at $0.95$ prevents a supplied multiplier from turning a transparent scenario probability into an invalid or numerically extreme probability. It is not an empirical biological ceiling.

For a route $pi=(e_1,e_2,...,e_k)$ through zero-population connectors, EpiGraph uses the sequential-product approximation

#align(center)[
  $q_pi(t)=∏_(ell=1)^k q_(e_ell)(t).$
]

The connector search retains the strongest route probability to a connector and visits it again only if that value increases. This suppresses cyclic expansion while keeping useful roadway connectivity. Multiple contributing source paths combine at a destination $v$ with a no-exposure complement:

#align(center)[
  $p_v(t)=1-∏_(u ∈ U_v)(1-q_(u→v)(t)).$
]

This aggregation makes a location’s probability increase when it has multiple modeled infectious sources without simply summing probabilities beyond $1$.

== Binomial daily transitions

The engine samples each count transition by repeated deterministic Bernoulli trials. For integer $n$ and probability $p$, a binomial variable obeys

#align(center)[
  $P(Y=k)="choose"(n,k)p^k(1-p)^(n-k), quad k=0,...,n,$
]

with expected value $E[Y]=n p$ and variance $n p(1-p)$. The implementation generates one reproducible Bernoulli decision for every index $j ∈ {0,...,n-1}$, rather than invoking an opaque external random distribution.

Given recovery probability $rho$ and mortality probability $mu$, the daily values are

#align(center)[
  $R_v^+(t) ∼ "Binomial"(I_v(t),rho),$
]

#align(center)[
  $D_v^+(t) ∼ "Binomial"(I_v(t)-R_v^+(t),mu),$
]

#align(center)[
  $I_v^+(t) ∼ "Binomial"(S_v(t),p_v(t)).$
]

The update is then

#align(center)[
  $S_v(t+1)=S_v(t)-I_v^+(t),$
]
#align(center)[
  $I_v(t+1)=I_v(t)-R_v^+(t)-D_v^+(t)+I_v^+(t),$
]
#align(center)[
  $R_v(t+1)=R_v(t)+R_v^+(t), quad D_v(t+1)=D_v(t)+D_v^+(t).$
]

Recovery is drawn before mortality, so $mu$ operates on people who remain infected that day. The state sum is conserved: adding the four right-hand sides cancels each transition, giving $N_v(t+1)=N_v(t)$. This conservation identity is a useful unit-test invariant.

== Determinism and common random numbers

An ordinary sequential random generator can make a comparison subtly unfair. If Strategy A removes an edge and thereby changes how many earlier random calls occur, later events can receive different random draws even at unchanged locations. EpiGraph uses a keyed hash $U(sigma,"key",j)$ in $[0,1)$, where the key includes event type, vertex, and day. A recovery at node $v$ on day $7$ always consults the same sequence $U(sigma,"recovery:v:day:7",j)$ in every run.

This is a common-random-numbers design. It does not remove stochasticity from a scenario, but it cancels needless random variation when comparing interventions. The deterministic trial method is preserved as `keyed_hash` in fairness metadata.

== Derived measures and interpretation

The interface reports aggregate metrics by summing vertex counts. Cumulative infections are $C(t)=sum_(v ∈ V_P)(N_v-S_v(t))$. Peak active cases are $max_t sum_v I_v(t)$, outbreak duration is the last $t$ with active infections, and modeled mortality is $sum_v D_v(T)$. A didactic effective contact proxy could be written $R_("local") ≈ alpha tau_e I_u/S_u$ under simplified conditions, but EpiGraph does not label such a proxy as a real-world $R_0$. The network is heterogeneous, interventions change availability, and parameters are not calibrated; reporting a clinical reproduction number would be unwarranted.
