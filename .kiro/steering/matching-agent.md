---
inclusion: fileMatch
fileMatchPattern: "**/matchingAgent*,**/communicationAgent*,**/demo.ts"
---

# Agent Architecture — Matching & Communication

## Matching Agent (src/agents/matchingAgent.ts)

Architecture: Deterministic TypeScript scoring. No AI for the decision itself.

### Hard Constraint (Guard Clause)
```typescript
if (user.electricityDependent && !shelter.backupPower) {
  // REJECTED — removed before scoring. Cannot be selected. Ever.
}
```
This is NOT a weight. It's a filter. Shelters without backup power are removed from the candidate pool entirely for electricity-dependent users.

### Scoring Dimensions
- capability_match: equipment requirements met (0-1)
- accessibility_match: wheelchair accessible (0 or 1)
- transport_available: transport from user's ZIP (0 or 1)
- proximity: linear decay to 20mi (0-1)
- capacity: based on occupancy percentage (0, 0.4, 0.7, or 1)

### Phase Weights

| Dimension | Phase 1 | Phase 1.5 | Phase 2 |
|---|---|---|---|
| capability | 40% | 30% | — |
| accessibility | 25% | 5% | — |
| transport | 20% | 25% | — |
| proximity | 10% | 35% | — |
| capacity | 5% | 5% | — |

Phase 2 uses different dimensions: equipment_battery_urgency 35%, disability_urgency_tier 30%, time_since_last_checkin 20%, nearby_resource_availability 15%.

### Expected Results for Maria
- shelter_001 (Dell Seton): ~94% — ALWAYS WINS
- shelter_002 (Austin Community Center): HARD REJECTED — no backup power
- shelter_005 (South Austin Senior): HARD REJECTED — no backup power
- shelter_003 (Travis County Expo): ~31% — not wheelchair accessible
- shelter_004 (Pflugerville Rec): ~58% — no transport from 78745

### MatchResult Interface
```typescript
interface MatchResult {
  winner: Shelter;
  score: number;
  phase: Phase;
  capabilityBadges: string[];
  explanation: string;
  rejected: { name: string; reason: string }[];
  notifiedAt: string;
}
```

## Communication Agent (src/agents/communicationAgent.ts)

Generates 4 notifications:
1. User alert (to Maria)
2. Contact messages (to Sarah and James)
3. Shelter intake notification
4. OEM flag (confirmed or PRIORITY WELFARE CHECK)

All notifications use string interpolation with real runtime values. Reference code: TXV-2847.

### Architecture Defense (for judges)
"The scoring is deterministic because the hard constraint — never match a ventilator user to a shelter without backup power — cannot be a probability. It must be a guarantee."
