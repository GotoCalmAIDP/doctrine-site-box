---
layout: base.njk
title: "Case 001 — Mode Validity Drift"
lang: en
---

# Case 001 — Mode Validity Drift

## Context

An automated industrial process operates in a predefined production mode.

Control systems regulate the process using stable feedback loops and predefined operational targets.

## Situation

A change occurs upstream in the production environment.

Input conditions affecting the process change, but remain within measurable system limits.

Controllers continue to execute correctly.

Operators observe stable system behaviour.

However, the assumptions that originally justified the selected operating mode are no longer valid.

## Boundary

The system has not failed.

Control execution remains technically correct.

However, the operational model under which the system continues to operate is no longer valid.

This condition represents an Applicability Boundary.

## Key Insight

An Applicability Boundary may occur even when system behaviour appears stable and formally correct.

The boundary arises when the assumptions required for the operational model no longer hold.
