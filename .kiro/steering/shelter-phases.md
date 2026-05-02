---
inclusion: fileMatch
fileMatchPattern: "**/ShelterScreen*,**/Phase1*,**/Phase15*,**/Phase2*"
---

# Shelter Screen — Three Distinct Phases

The Shelter screen has THREE completely separate render paths. They are NOT variations of the same layout — they are different screens.

## Phase 1 (mode=MATCHED, phase=1) — Best-Fit Focus

Content:
- Phase banner: "10 hours until storm impact"
- Matched shelter card: Dell Seton, 4.2mi, capability badges, score, capacity
- **Explanation card** (MOST IMPORTANT ELEMENT): white background, blue left border, shadow
  - "Why SafeReach chose this shelter"
  - Must explain WHY Austin Community Center was rejected (no backup power)
  - Must explain WHY Dell Seton was chosen (72hr generator, wheelchair, oxygen)
- Other shelters dropdown (collapsed, 4 rejected with reasons)
- Transport card: "ADA van — ETA 8h 30min"
- "Confirm I'll Be Ready" button
- Shelter direct line (tel: link)

## Phase 1.5 (phase=1.5) — COMPLETE REPLACEMENT

Content:
- Amber phase-shift banner: "FORMULA UPDATED — 2 Hours Remaining"
- 1.5 second re-matching animation (Loader2 spinner)
- Updated explanation (reachability focus, NOT best-fit)
- Transport urgency: "ADA van ETA: 1h 45min" in amber bold 22px
- "I'm Ready — Confirm Pickup Now" button

Key differences from Phase 1:
- Banner is amber, not informational
- Explanation text focuses on reachability, not capability
- Transport ETA is 1h 45min (not 8h 30min)
- Button text changes to "Confirm Pickup Now"

## Phase 2 (mode=DISASTER_ACTIVE) — COMPLETE REPLACEMENT

**Phase 2 must NOT have:**
- Explanation card
- Matching logic
- Transport confirmation
- "Confirm I'll Be Ready" button

**Phase 2 must ONLY have:**
- Red disaster banner: "DISASTER ACTIVE — Power Outage Confirmed"
- Ventilator battery countdown card (amber bar, ~5h 52min)
- Power wheelchair battery card (green bar, ~3h 20min)
- Shelter status card (Dell Seton open, generator running)
- Phase 2 formula display (4 metrics: equipment urgency 35%, disability tier 30%, last check-in 20%, nearby resources 15%)
- Stranded/Sheltered state variant

## Phase Indicator Bar

3 nodes with connecting line:
- Node 1: "10hrs out" — green filled when past, amber when active
- Node 2: "2hrs out" — green filled when past, amber when active
- Node 3: "During Storm" — red pulsing when active (DISASTER_ACTIVE)
