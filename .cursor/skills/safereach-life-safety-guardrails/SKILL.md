---
name: safereach-life-safety-guardrails
description: Guards SafeReach life-safety behavior. Use when work touches matching constraints, disaster state, emergency SMS, NWS or emPOWER assumptions, shelter status, transport, or SOS behavior.
---

# SafeReach Life-Safety Guardrails

## Required First Step

Use `safereach-context-lock` before touching safety-critical behavior.

## Non-Negotiable Invariants

- A user with electricity-dependent equipment must never be matched to a shelter without backup power.
- The backup-power rule is a guard clause, not a score weight.
- Phase 2 is disaster active survival mode, not a shelter search flow.
- The SOS screen must show a complete emergency SMS packet.
- Emergency content must include status, address, GPS, equipment, battery, transport needs, physical access instructions, confirmed shelter, contacts, profile ID, and reference code when available.
- NWS API has no auth and must retain fallback behavior.
- HHS emPOWER is local ZIP overlay data for the hackathon build.

## Stop Conditions

Stop and ask before changing:

- Matching weights or hard constraints
- Phase state semantics
- Emergency SMS fields
- `DISASTER_ACTIVE` navigation behavior
- NWS, emPOWER, or Claude assumptions
- Any route, schema, auth, deployment, or environment behavior

## Review Lens

Ask: could this change make Maria less visible, less reachable, or less accurately triaged during a power failure? If yes, treat it as safety-critical.
