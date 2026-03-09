---
layout: base.njk
title: "Interpretation Note — Applicability"
description: "Interpretation note on the distinction between applicability and behaviour correctness."
translationKey: "notes-applicability"
lang: en
---

# Interpretation Note — Applicability

**Status:** Interpretation note (non-claim)

**Purpose:** This note clarifies the conceptual distinction between applicability and behaviour correctness. It does not prescribe algorithms, system logic, or operational procedures.

---

## Core Distinction

Applicability is not behaviour correctness.

A system may behave correctly while operating in an invalid operational mode.

Applicability concerns legitimacy, not correctness.

---

## Explanation

Behaviour correctness describes whether a system performs its defined functions as expected. A system that produces correct outputs, follows its rules, and meets its performance criteria is behaviourally correct.

Applicability describes whether the conditions under which the system operates remain within its defined boundaries. A system may function correctly in every observable way and still operate outside the conditions under which its behaviour is considered legitimate.

---

## Implication for Observation

When observing a system, the absence of behavioural errors does not confirm that the system is operating within its applicability boundary.

Correct behaviour is necessary but not sufficient for operational legitimacy.

---

## What This Note Does Not Do

This note does not:
- define detection mechanisms,
- prescribe monitoring procedures,
- recommend actions when applicability is lost,
- or provide algorithms for assessing operational modes.

---

## Non-Claim Integrity

This note is non-claim. It describes a conceptual distinction only.

---

**End of Interpretation Note — Applicability**
