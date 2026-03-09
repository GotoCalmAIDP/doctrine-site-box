---
layout: base.njk
title: "Applicability Failure Map"
description: "Conceptual diagnostic framework for identifying applicability boundary failures in complex systems."
translationKey: "applicability-failure-map"
lang: en
---

# Applicability Failure Map

**Status:** Conceptual diagnostic framework (non-claim)

**Purpose:** This page describes classes of applicability failure that may occur in complex automated and safety-critical systems. It does not describe detection methods, algorithms, or monitoring systems.

---

## Introduction

Applicability failure occurs when a system continues to operate within its behavioural parameters while the conditions that justify its operational mode are no longer met.

This type of failure is distinct from behavioural failure. The system does not malfunction. It continues to function — but its operational legitimacy has been lost.

The following failure classes describe structural patterns of applicability boundary loss. They are conceptual categories, not diagnostic procedures.

---

## Failure Classes

### Green Dashboards

The system appears compliant. All observable indicators remain within expected ranges. However, the assumptions underlying those indicators have collapsed.

The system reports health because it measures behaviour, not applicability.

### Authority Delay

Operators or governance actors cannot intervene in time because the authority topology has degraded. Decision paths that were valid under original conditions no longer connect to the operational state.

Authority exists formally but cannot reach the system in its current mode.

### Model Plausibility

System outputs appear valid and internally consistent. However, the environment in which the model was calibrated has drifted beyond its applicability boundary.

The model continues to produce plausible results from conditions it was not designed to represent.

### Mode Persistence

The system continues operating in a mode that was valid at an earlier point but is no longer justified by current conditions.

The operational mode persists because no mechanism exists to detect that its applicability conditions have changed.

---

## Architectural Symptoms

These failure classes share a common architectural symptom: the separation between behavioural correctness and operational legitimacy.

Systems that monitor only behaviour cannot detect applicability failure. The failure exists in the relationship between the system's mode and its operating conditions — not in the system's outputs.

---

## Applicability Boundary Loss

Applicability boundary loss is the condition in which the system's operational mode continues but the boundary conditions that defined its validity are no longer satisfied.

This condition may persist indefinitely if the system has no mechanism for evaluating its own applicability.

---

## Relation to Behaviour Governance

Behaviour governance defines what a system should do. Applicability architecture defines when those definitions remain valid.

A system may satisfy all behavioural governance requirements while operating in an invalid mode. The governance framework remains intact. The applicability boundary has been crossed.

---

## Failure Map

| Failure Class | Operational Symptom | Architectural Cause |
|---|---|---|
| Green Dashboards | System appears compliant | Assumptions collapsed |
| Authority Delay | Operators cannot intervene | Authority topology degraded |
| Model Plausibility | Outputs appear valid | Environmental drift |
| Mode Persistence | System continues operating | Operational mode invalid |

---

## Conclusion

Applicability failure often appears before observable behavioural failure.

Systems may remain compliant while the operational mode has already lost legitimacy.

---

## Non-Claim Integrity

This page is non-claim. It does not prescribe actions, recommend implementations, or define technical requirements. It does not describe detection methods, algorithms, or monitoring systems.

---

**End of Applicability Failure Map**
