---
layout: base.njk
title: "Applicability Incident Lens"
lang: en
---

# Applicability Incident Lens

**Status:** Conceptual analysis lens (non-claim)

---

## Disclaimer

The Applicability Incident Lens is a conceptual framework for analysing incidents in complex automated, AI-enabled and safety-critical systems, including systems operating in regulated or high-consequence environments.

It does not replace formal safety investigations conducted by regulatory authorities.

---

## Introduction

Traditional incident analysis focuses on component failure, human error, or procedural deviation. The Applicability Incident Lens introduces an additional layer: the question of whether the system was operating within the conditions that justified its operation at the time of the incident.

This lens does not replace existing investigation methods. It extends the analytical vocabulary by introducing the concept of applicability boundaries as a structural factor in incident interpretation.

---

## Behaviour vs Applicability

A system may behave correctly according to its design specification and still operate outside the conditions that justify its operation.

Behavioural correctness describes whether the system performs as designed.

Applicability describes whether the conditions under which the system was designed to operate still hold.

These are independent dimensions. A system can be behaviourally correct and applicability-invalid simultaneously.

---

## Operational Assumptions

Every complex automated system operates under a set of assumptions about its environment, inputs, authority structure, and operational context.

These assumptions are rarely made explicit in operational documentation.

When these assumptions collapse — silently, gradually, or suddenly — the system continues to operate, but the justification for its operation no longer holds.

---

## Applicability Boundary in Incident Context

An applicability boundary marks the point beyond which a system's operational justification can no longer be confirmed.

In incident analysis, this boundary is relevant because:

- The system may have crossed the boundary before the incident occurred.
- The crossing may not have been detected by monitoring systems.
- The system may have continued to produce outputs that appeared valid.
- Operators may have had no indication that the operational context had changed.

---

## Interpretation Layers

The Applicability Incident Lens proposes the following interpretation layers for incident analysis:

**Layer 1 — State Applicability:**
Was the observed system state within the conditions that justified operation?

**Layer 2 — Trajectory Applicability:**
Was the sequence of system states consistent with the intended operational trajectory?

**Layer 3 — Authority Applicability:**
Was the authority structure that governed the system still valid at the time of the incident?

**Layer 4 — Update Applicability:**
Had the system's operational assumptions been updated to reflect the current environment?

---

## Core Thesis

Incidents often occur not because systems fail, but because systems continue operating after the conditions that justified their operation have already disappeared.

---

## Conclusion

The Applicability Incident Lens does not provide conclusions about specific incidents. It provides a conceptual vocabulary for asking whether the system was still operating within its justified conditions at the time of an event.

This lens is non-prescriptive. It does not recommend actions, assign responsibility, or replace regulatory investigation.

---

## Related Conceptual Pages

- [Applicability Failure Map](/doctrine-site-box/en/applicability-failure-map/) — Structural failure classes in applicability boundaries.
- [Applicability Boundary — Definition](/doctrine-site-box/en/applicability-boundary-definition/) — Formal definition of the applicability boundary concept.
- [Framework Overview](/doctrine-site-box/en/framework-overview/) — Overview of the complete conceptual framework.

---

End of Applicability Incident Lens
