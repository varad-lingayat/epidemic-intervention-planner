#import "report-theme.typ": report-accent, report-theme
#import "@preview/glossarium:0.5.10": make-glossary, register-glossary, print-glossary, gls, glspl
#import "glossary.typ": entries

#show: make-glossary
#register-glossary(entries)
#show: report-theme.with(
  title: "EpiGraph Epidemic Intervention Planner",
  author: "Varad Lingayat",
  rhythm: "report",
  body-size: 12pt,
  running-header: true,
)
#set text(lang: "en", region: "us")

// ---------- Title page ----------
#page(margin: (top: 26%, x: 2.2cm), numbering: none, header: none)[
  #set par(first-line-indent: 0em)
  #align(center)[
    #text(size: 26pt, weight: "bold", fill: report-accent)[EpiGraph Epidemic Intervention Planner]
    #v(0.45em)
    #text(size: 14pt, fill: luma(80))[Comprehensive Technical, Mathematical, and Decision Review]
    #v(1.8em)
    #line(length: 42%, stroke: 0.5pt + luma(160))
    #v(1.8em)
    #text(size: 12pt)[Author: Varad Lingayat \
      Academic context: Second-year discrete mathematics project \
      Version: Final technical review \
      Date: #datetime.today().display("[day] [month repr:long] [year]")]
    #v(2.7em)
    #box(fill: rgb("#eef5ff"), inset: 14pt, radius: 5pt)[
      #text(size: 10pt)[
        #strong[Scope notice.] This document describes an educational scenario model. It does not provide public-health forecasts, clinical guidance, or operational recommendations. Real-road geometry may be imported from OpenStreetMap; location populations, contact probabilities, and disease outcomes remain explicit synthetic model inputs.
      ]
    ]
  ]
]

// ---------- Executive document navigation ----------
#page(numbering: none, header: none)[
  #outline(title: [Contents], indent: 1.45em, depth: 3)
]

// ---------- Main body ----------
#counter(page).update(1)

#include "sections/01-executive-summary.typ"
#include "sections/02-problem-and-requirements.typ"
#include "sections/03-decision-architecture.typ"
#include "sections/04-system-architecture.typ"
#include "sections/05-graph-and-data-model.typ"
#include "sections/06-epidemic-mathematics.typ"
#include "sections/07-intervention-algorithms.typ"
#include "sections/08-bayesian-risk-and-recommendations.typ"
#include "sections/09-experimentation-and-fairness.typ"
#include "sections/10-interface-visualization-and-exports.typ"
#include "sections/11-data-governance-and-desktop.typ"
#include "sections/12-verification-and-quality.typ"
#include "sections/13-limitations-and-ethics.typ"
#include "sections/14-conclusion.typ"
#include "sections/15-decision-register.typ"
#include "sections/16-appendices.typ"
#include "sections/17-formal-model-audit.typ"
#include "sections/18-algorithm-tracebook.typ"
#include "sections/19-engineering-design-review.typ"
#include "sections/20-verification-catalog.typ"
#include "sections/21-alternatives-and-rationale.typ"
#include "sections/22-worked-mathematical-case-studies.typ"
#include "sections/23-module-and-data-flow-audit.typ"
#include "sections/24-proof-and-complexity-compendium.typ"
#include "sections/25-reviewer-traceability-and-defense.typ"

#pagebreak()
= Glossary of terms and notation

#print-glossary(entries, show-all: true, disable-back-references: true)
