---
layout: base.njk
title: "Applicability Architecture"
description: "Conceptual architecture of operational applicability boundaries."
translationKey: "architecture"
lang: en
---

# Applicability Architecture

**Status:** Conceptual architecture (non-claim)

**Purpose:** This page describes the conceptual architecture of applicability boundaries. It does not prescribe implementation, detection, or operational procedures.

---

## Introduction

Applicability Architecture describes the conceptual structure through which systems define and maintain the boundaries of their operational legitimacy.

It is not a technical architecture. It does not specify components, interfaces, or protocols.

It concerns the conditions under which operational modes remain valid, and the boundaries beyond which they do not.

---

## Architecture Layers

The conceptual architecture consists of four layers, each defining a distinct aspect of operational applicability:

**Behaviour Governance**
The set of conditions, rules, and constraints that define the legitimate operational boundaries of a system.

**Operational Mode**
A defined configuration of system behaviour that determines how the system operates within its environment at a given time.

**Applicability Boundary**
The limit beyond which a system's operational mode can no longer be considered valid under its stated assumptions.

**Invalid Operational Mode**
A state in which a system continues to function but operates outside the conditions under which its behaviour can be considered legitimate.

---

## Conceptual Diagram

```
Behaviour Governance
        ↓
  Operational Mode
        ↓
Applicability Boundary
        ↓
Invalid Operational Mode
```

This diagram is conceptual only. It does not represent a technical flow, data pipeline, or system architecture.

---

## Relation to Governance Systems

Applicability Architecture does not replace governance systems. It describes the conceptual conditions under which governance applies.

Governance defines what is permitted. Applicability Architecture describes when those permissions remain valid.

The distinction is between authority (governance) and validity (applicability).

---

## Related Conceptual Pages

- [Applicability Boundary — Definition](/doctrine-site-box/en/applicability-boundary-definition/) — Concept definition of the Applicability Boundary.
- [Applicability Failure Map](/doctrine-site-box/en/applicability-failure-map/) — Conceptual diagnostic framework for identifying applicability boundary failures.
- [For Operators](/doctrine-site-box/en/for-operators/) — Applicability boundaries in operational contexts.
- [For Regulators](/doctrine-site-box/en/for-regulators/) — Applicability boundaries and regulatory context.
- [For System Architects](/doctrine-site-box/en/for-architects/) — Applicability boundaries in system architecture.

---

## Non-Claim Integrity

This page is non-claim. It does not prescribe actions, recommend implementations, or define technical requirements.

---

**End of Applicability Architecture**
