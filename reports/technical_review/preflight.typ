#import "report-theme.typ": report-theme
#import "@preview/glossarium:0.5.10": make-glossary, register-glossary, print-glossary, gls, glspl

#show: make-glossary
#let entries = ((key: "sir", short: "SIR", long: "susceptible–infected–removed", description: [A compartmental epidemic-model vocabulary.]),)
#register-glossary(entries)

#show: report-theme.with(title: "Preflight", author: "Varad Lingayat", rhythm: "report")

= Import and theme preflight

The #gls("sir") definition register is available.

= Definition register

#print-glossary(entries, show-all: true, disable-back-references: true)
