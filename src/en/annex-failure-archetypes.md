---
layout: base.njk
title: "Annex — Failure Archetypes"
description: "Conceptual archetypes of applicability failure modes."
translationKey: "annex-failure-archetypes"
lang: en
---

# Annex — Failure Archetypes

**Status:** Annex (non-claim)

**Purpose:** This annex describes three conceptual archetypes of applicability failure. These are narrative illustrations only. They do not prescribe detection algorithms, monitoring logic, or system implementation.

---

## Archetype 1 — Green Dashboards / Invalid Operational Mode

A system displays indicators that suggest normal operation. All metrics are within expected ranges. All dashboards report green status.

However, the conditions under which those indicators were designed to be meaningful have changed. The operational mode is no longer within its applicability boundary.

The dashboard remains green because it measures what it was built to measure. It does not measure whether its measurements remain valid.

This archetype illustrates that visible indicators of correctness do not confirm operational legitimacy.

---

## Archetype 2 — Delayed Authority Reattachment

A system operates under a governance framework that was valid at the time of its initial deployment. Over time, the conditions that justified that governance framework change.

The governance framework remains formally in place. Authority has not been revoked. But the conditions under which that authority was legitimate no longer hold.

The system continues to operate under authority that is formally present but substantively detached from the conditions that justified it.

This archetype illustrates that formal authority does not guarantee continued applicability.

---

## Archetype 3 — Correct Behaviour / Invalid Assumptions

A system behaves exactly as designed. It produces correct outputs. It follows its rules. It meets its performance criteria.

However, the assumptions under which those rules were defined no longer hold. The environment has changed in ways that the system's design did not anticipate.

The system is behaviourally correct but operationally invalid. Its assumptions have been exceeded without any observable failure in behaviour.

This archetype illustrates that correctness and validity are independent conditions.

---

## Strict Prohibition

This annex does not contain:
- detection algorithms,
- monitoring logic,
- system implementation details,
- or operational recommendations.

Only conceptual narratives are provided.

---

## Non-Claim Integrity

This annex is non-claim. It describes conceptual patterns only.

---

**End of Annex — Failure Archetypes**
