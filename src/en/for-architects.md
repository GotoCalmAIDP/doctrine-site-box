---
layout: base.njk
title: "Applicability Boundaries in System Architecture"
description: "Stakeholder perspective: architectural relevance of applicability boundaries."
translationKey: "for-architects"
lang: en
---

# Applicability Boundaries in System Architecture

**Status:** Stakeholder perspective (non-claim)

**Purpose:** This page describes how the concept of applicability boundaries relates to system architecture. It does not provide implementation guidance or design specifications.

---

## Introduction

System architecture defines the structural organisation of complex systems, including the relationships between components, the conditions under which they operate, and the assumptions that govern their behaviour.

The Applicability Boundary Doctrine introduces a conceptual layer that addresses the validity of these assumptions rather than the correctness of system behaviour.

---

## Conceptual Relevance for System Architecture

Applicability boundaries are relevant to system architecture in contexts where the structural assumptions of a system may cease to hold while the system continues to function:

- **Complex automation:** Systems with multiple interacting automated components may cross applicability boundaries when the interaction patterns assumed during design no longer reflect the operational environment.

- **AI-enabled systems:** Systems that incorporate artificial intelligence may operate beyond their applicability boundary when the conditions under which their models were trained or validated no longer correspond to the operational context.

- **Human-machine interaction:** Systems that depend on specific patterns of human-machine interaction may lose applicability when the nature of that interaction changes in ways not anticipated by the system design.

- **System mode transitions:** Systems that transition between operational modes may encounter applicability boundaries when the conditions that justify a mode transition are no longer present, yet the transition occurs or fails to occur.

---

## Limits of Operational Assumptions

The doctrine helps reason about the limits of operational assumptions in system architecture. It provides a vocabulary for describing conditions where:

- the system operates correctly but beyond the validity of its design assumptions,
- the operational mode is maintained but is no longer justified by the environment,
- the governance structure does not account for the gap between behavioural correctness and operational legitimacy.

---

## Scope Limitation

This page does not provide implementation guidance, design patterns, or architectural recommendations. It describes the conceptual relevance of applicability boundaries to system architecture without prescribing how they should be addressed in practice.

---

## Related Conceptual Pages

- [Applicability Boundary — Definition](/doctrine-site-box/en/applicability-boundary-definition/)
- [Applicability Architecture](/doctrine-site-box/en/architecture/)
- [Applicability Failure Map](/doctrine-site-box/en/applicability-failure-map/)
- [Terminology Authority](/doctrine-site-box/en/terminology-authority/)

---

## Non-Claim Integrity

This page is non-claim. It does not prescribe actions, recommend implementations, or define technical requirements.

---

**End of Applicability Boundaries in System Architecture**
