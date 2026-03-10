---
layout: base.njk
title: "Case 001 — Mode Validity Drift"
lang: en
---

# Case 001 — Mode Validity Drift

## Context

An automated chemical production process operates in a predefined production mode.

The control system regulates temperature, pressure, and feed rate using stable feedback control loops and predefined setpoints.

The operating mode was selected based on an assumed composition of incoming raw materials.

## Situation

An upstream supplier changes the composition of the raw material within specification limits.

Sensors continue to report values within acceptable ranges.

Control loops remain stable and the process continues operating within configured setpoints.

Operators observe no alarms and system behaviour appears nominal.

However, the original operating mode was selected under assumptions about raw material composition that no longer hold.

## Boundary

The system has not failed.

Control execution remains technically correct.

However, the operational model under which the system continues to operate is no longer valid.

This condition represents an Applicability Boundary.

## Key Insight

An Applicability Boundary may occur even when system behaviour appears stable and formally correct.

The boundary arises when the assumptions required for the operational model no longer hold.
