# SafeReach — Product Requirements Document (PRD)

> **Version:** 2.0
> **Last Updated:** 2026-05-02
> **Status:** Active — Hackathon Build
> **This document is the single source of truth for all product, design, and engineering decisions on SafeReach. If something contradicts this document, this document wins.**

---

## Changelog — v1.0 → v2.0

| Section | Change |
|---|---|
| Navigation | Reduced from 5 tabs to 4. Family merged into Profile. Alerts removed as tab. |
| App State Machine | Added DISASTER_ACTIVE. Phase 2 fully specified, not a placeholder. |
| Phase 2 | Completely redesigned. Survival-mode UI: equipment countdown, stranded/sheltered states, dispatch tracking. |
| SOS Screen | New screen. Full emergency SMS packet, call buttons, auto-ping status. |
| Agent 1 | Hybrid: deterministic scoring + Claude API for explanation only. |
| Agent 2 | Full Claude API: 5 parallel calls producing notification log + emergencySMS packet. |
| AI Architecture | Explicit reasoning for hybrid deterministic+LLM approach added. |
| Tech Stack | Map: React-Leaflet + OpenStreetMap (no API key). Backend removed — all logic in browser. |
| Demo Flow | Updated to 5 steps including Storm Active and SOS. ~3 minutes. |
| UI | Semi-transparent header, demo strip, floating SOS button, left info panel. |
| Post-Disaster | Full Phase 2 specification added. |
| Forecasting | Uri warning timeline: 24-36 hours of NWS warnings preceded grid failure. |

---

## Table of Contents

1. Problem Context
2. Product Vision
3. Users
4. Scope
5. Feature Requirements
6. Data Sources
7. System Architecture
8. Agent Specifications
9. UI Requirements
10. Demo Flow
11. Governance Model
12. Non-Requirements
13. Judging Criteria Map
14. Glossary

---

## 1. Problem Context

### The Historical Event

Winter Storm Uri struck Texas on February 13-17, 2021. ERCOT rolling blackouts left over 4.5 million homes without power. Average outage: 42 hours. Some lasted five days. Official death toll: 246. Independent analysis: 426-978.

People with disabilities were the most exposed population. Power-dependent equipment — ventilators, oxygen concentrators, powered wheelchairs, BiPAP machines — failed silently in homes across Texas. A Disability Rights Texas survey found that many STEAR registrants requested help and received none.

Emily Wolinsky woke at 3am on February 15th to her ventilator beeping — battery mode. She found out about the city-wide outage through a neighborhood group chat. No emergency alert reached her. No system knew she was ventilator-dependent and couldn't self-evacuate.

**This was not a sudden-hit disaster. NWS issued Winter Storm Warnings for all 254 Texas counties on February 14th — the first time in recorded history. The system had 24-36 hours of active warnings before Emily's ventilator beeped. The failure was not a lack of warning. It was a lack of a system to act on it.**

### The Structural Gap

The following things already exist but do not talk to each other:

- County OEMs are **legally mandated** to maintain special needs registries
- HHS emPOWER provides **free, public, ZIP-level data** on electricity-dependent Medicare beneficiaries
- NWS provides a **free public API** for real-time disaster alerts
- Shelter systems have **known capability data** (backup power, accessibility, oxygen)

SafeReach connects them.

### Scale

- People with disabilities are 2-4x more likely to die in natural disasters
- 4.6M+ Medicare beneficiaries rely on electricity-dependent DME
- No systematic solution exists for the active evacuation phase

---

## 2. Product Vision

**SafeReach makes people with disabilities visible to emergency systems before the beeping starts — and keeps them connected to help after it does.**

Three phases:

- **Phase 1 (10+ hrs):** Match to best-fit shelter based on medical equipment needs, not proximity. Notify contacts. Confirm transport.
- **Phase 1.5 (2 hrs):** Re-run matching with proximity-weighted formula. Confirm what is still reachable. Update transport urgency.
- **Phase 2 (disaster active):** Survival mode. Equipment battery countdown. Check-in monitoring. SOS screen becomes primary interface — one tap sends complete emergency data packet to county emergency services.

Proactive, not reactive. Acts before the user has to ask.

---

## 3. Users

### Primary — Registered Resident

**Demo persona: Maria Alvarez, 58, Travis County TX, ZIP 78745**

| Attribute | Value |
|---|---|
| Disability | Mobility (power wheelchair), respiratory (ventilator) |
| Equipment | Ventilator (continuous power), power wheelchair (charging) |
| Self-evacuation | Cannot — requires accessible transport |
| Communication | Large text, high contrast, no audio-only |
| Living situation | Lives alone |
| Emergency contacts | Sarah Alvarez (daughter), James Okafor (aide) |
| Address | 4821 S Congress Ave, Austin TX 78745 |
| GPS | 30.2672, -97.7431 |

### Secondary — Emergency Contact / Caregiver

Sarah and James. Receive AI-generated notifications from Communication Agent. Do not manage Maria's profile.

### Tertiary — County OEM

Receives OEM status flag from Communication Agent. Full coordinator view (all users, statuses, welfare checks) identified as next build priority beyond hackathon.

---

## 4. Scope

### Runs Live

| Feature | Implementation |
|---|---|
| NWS Alert Ingestion | api.weather.gov/alerts/active?zone=TXZ192. Silent fallback to local demo data. |
| HHS emPOWER Data | Local zipOverlay.ts with real Travis County figures. Amber circles on map. |
| Matching Agent | Deterministic TypeScript scoring. Phase weights run as real code. Claude API generates explanation. |
| Communication Agent | 5 parallel Claude API calls. Notification log + emergencySMS packet. All calls have fallbacks. |
| My Shelter Screen | 3 fully distinct phase states — different content, different logic, different UI for each. |
| SOS Screen | Full emergency SMS packet always visible. Generated at runtime. Direct call buttons. |
| Profile Screen | Maria's profile + equipment + contacts + notification log. |
| Map Screen | React-Leaflet, shelter pins, family dots, emPOWER circles, left info panel. |

### Mocked / Simulated

| Feature | How Handled |
|---|---|
| User registration | Maria's profile hardcoded. No signup form. |
| Shelter database | 5 synthetic Travis County shelters. |
| Transport dispatch | "ADA van — ETA 8h 30min." No live API. |
| Equipment battery | Hardcoded values. No sensors. |
| Real SMS delivery | SMS content displayed only. Nothing transmitted. |
| OEM dashboard | Referenced in notification log. Not built. |
| Phase 2 check-in ping | Static "Last ping: 3:17 AM." No live system. |

---

## 5. Feature Requirements

### F-01 — User Profile (P0)

Pre-populated with Maria's data. Displayed on Profile screen.

Fields: name, age, address, ZIP, county, disability types, equipment (with electricity-dependency flags), self-evacuation capability, communication mode, emergency contacts, medical notes, OEM verification badge.

Emergency contacts and family displayed in Profile screen — no separate Family tab.

---

### F-02 — NWS Alert Ingestion (P0)

Endpoint: https://api.weather.gov/alerts/active?zone=TXZ192
Auth: None required.
Fallback: DEMO_NWS_ALERT from src/data/nwsAlert.ts (matches real NWS response shape).
Demo override: "Trigger" button in demo strip sets WARNING state.

Alert must never be audio-only. Large text always.

---

### F-03 — Matching Agent (P0)

**Architecture:** Deterministic TypeScript scoring + one Claude API call for explanation.

**Why hybrid, not pure AI:**
The hard constraint — never match a ventilator user to a shelter without backup power — cannot be a probability. It must be a guarantee. Claude generates only the human-readable explanation of a decision that has already been made deterministically.

**Hard Constraint (Guard Clause):**
If user.electricityDependent === true AND shelter.backupPower === false:
Shelter removed from candidates before scoring. No score. Cannot be selected. Applies in all phases.

**Scoring Dimensions:**
- capability_match: does shelter have what user's equipment requires?
- accessibility_match: does shelter meet user's mobility needs?
- transport_available: is accessible transport available from user's ZIP?
- proximity: distance in miles (scored 0-1, linear decay to 20mi)
- capacity: available spots (>95% full=0, >80%=0.4, >60%=0.7, else=1)

**Phase 1 Weights (10+ hrs — Capability First):**

| Dimension | Weight |
|---|---|
| capability_match | 40% |
| accessibility_match | 25% |
| transport_available | 20% |
| proximity | 10% |
| capacity | 5% |

**Phase 1.5 Weights (2 hrs — Reachability First):**

| Dimension | Weight |
|---|---|
| proximity | 35% |
| capability_match | 30% |
| transport_available | 25% |
| accessibility_match | 5% |
| capacity | 5% |

**Phase 2 Weights (Disaster Active — Urgency First):**

| Dimension | Weight |
|---|---|
| equipment_battery_urgency | 35% |
| disability_urgency_tier | 30% |
| time_since_last_checkin | 20% |
| nearby_resource_availability | 15% |

**AI Explanation:** One Claude API call after scoring selects winner. claude-sonnet-4-20250514, max_tokens: 120. Hardcoded fallback if API fails.

**Match Output:**
```typescript
interface MatchResult {
  winner: Shelter
  score: number
  phase: Phase
  capabilityBadges: string[]
  explanation: string        // Claude-generated or fallback
  rejected: { name: string; reason: string }[]
  notifiedAt: string
}
```

**Verification:**
```typescript
const result = await runMatchingAgent(MARIA, SHELTERS, 1)
// result.winner.id must be 'shelter_001'
// result.score must be > 80
// result.rejected must include Austin Community Center
```

---

### F-04 — Communication Agent (P0)

**Architecture:** Full AI. 5 parallel Claude API calls via Promise.all. Every call has hardcoded fallback using string interpolation with real runtime values (fallback is still dynamic).

**Trigger:** User confirms shelter (taps "Confirm I'll Be Ready" or "Confirm Pickup Now")

**5 Outputs:**

Output 1 — User Alert (100 tokens): To Maria. Large text. 3 short sentences. Most urgent fact first. Reference code TXV-2847.

Output 2 — Contact Message (80 tokens): To Sarah and James (same message). Shelter name, transport ETA, shelter phone, reference code.

Output 3 — Shelter Intake (180 tokens): To Dell Seton intake system. Clinical format. Equipment needs with power requirements, transport ETA, entrance instructions, emergency contact.

Output 4 — OEM Flag (120 tokens):
- evacuationChoice='confirmed': match confirmation with transport status
- evacuationChoice='cannot': PRIORITY WELFARE CHECK with address, GPS, equipment battery, dispatch request

Output 5 — Emergency SMS Packet (400 tokens): Full data packet for SOS screen. Must include: full name/age/gender, status STRANDED, address+GPS, all equipment with battery remaining, transport requirements, physical instructions to reach her, confirmed shelter with phone and generator status, all emergency contacts, SafeReach profile ID, reference code.

**CommunicationResult:**
```typescript
interface CommunicationResult {
  notifications: Notification[]  // 5 entries for Profile log
  emergencySMS: string           // full packet for SOS screen
  generatedAt: string
  evacuationChoice: 'confirmed' | 'cannot'
  referenceCode: 'TXV-2847'
}
```

**Loading state:** SOS screen shows grey shimmer on SMS card area. Profile shows amber "Generating notifications..." Both resolve when Promise.all completes.

---

### F-05 — Map Screen (P0)

Map fills entire viewport. React-Leaflet + OpenStreetMap. No API key.
Center: [30.2672, -97.7431], zoom 13.

Layers:
- Maria's pulsing blue dot (red in DISASTER_ACTIVE)
- 5 color-coded shelter pins with tap popups
- Sarah and James family dots
- emPOWER ZIP amber circles (5 Travis County ZIPs)
- emPOWER legend card (bottom-left)

Header: semi-transparent blur on ALL screens. rgba(11,31,58,0.92) + blur(12px). Never solid.

Disaster Alert Banner (WARNING+ only): full-width, slides down, TWO BUTTONS ONLY: "Get to Safety" and "S.O.S". Nothing else.

Left info panel: AI Summary card + Active Alert card + Help Status card.

Floating SOS button: fixed bottom-right, red circle, always visible on map, pulses in DISASTER_ACTIVE.

Demo strip: 4 buttons fixed at bottom — Trigger | 2hrs Out | Storm Active | Reset.

---

### F-06 — My Shelter Screen — 3 Fully Distinct Phases (P0)

Phase indicator bar: 3 nodes, connecting line. Active=amber filled. Complete=green. Upcoming=outline.

**Phase 1** (MATCHED, phase=1):
- Phase banner: "10 hours until storm impact"
- Matched shelter card: name, address, distance, 3 capability pills, score, capacity
- Explanation card: white, blue left border, shadow, Claude-generated text — visual anchor of screen
- Other shelters dropdown (collapsed, 4 rejected with reasons)
- Transport card: "ADA van — ETA 8h 30min"
- "Confirm I'll Be Ready" button
- Shelter direct line (tel: link, always visible)

**Phase 1.5** (phase=1.5) — COMPLETE REPLACEMENT of Phase 1:
- Phase shift banner: "FORMULA UPDATED — 2 Hours Remaining" amber
- 1.5 second re-matching animation
- Updated explanation (reachability focus)
- Transport urgency: "ADA van ETA: 1h 45min" amber bold 22px
- "I'm Ready — Confirm Pickup Now" button

**Phase 2** (DISASTER_ACTIVE) — COMPLETE REPLACEMENT. NO shelter search. NO matching. NO transport confirmation:
- Red disaster banner: "DISASTER ACTIVE — Power Outage Confirmed"
- Ventilator battery countdown card (amber bar, ~5h 52min)
- Power wheelchair battery card (green bar, ~3h 20min)
- Shelter status (Dell Seton open, generator running)
- Phase 2 formula display (4 metrics with percentage bars)
- Stranded state variant (demo toggle)

---

### F-07 — SOS Screen (P0)

App auto-navigates here 1.5s after "Storm Active" is triggered.

Structure (all always visible — no modals, no reveals):
1. Current status card: name, age, equipment, GPS, battery, transmission status
2. Send Emergency SMS button (red, full-width, min-h-btn-lg)
3. Emergency SMS content card — ALWAYS VISIBLE, monospace, amber left border
4. Three call buttons (real tel: links): Shelter, Sarah, OEM
5. Auto-ping status card: green dot, last/next ping timestamps

---

### F-08 — Profile Screen (P1)

Replaces Family tab entirely.

Sections:
1. Personal info + OEM verification badge
2. Equipment/disability needs (2x2 grid)
3. Communication preferences (toggles)
4. Emergency contacts and family (Sarah + James contact cards, Add Contact button)
5. Notification log (generated by Communication Agent at runtime)
6. emPOWER footer (source attribution)

---

## 6. Data Sources

### NWS API
Endpoint: https://api.weather.gov/alerts/active?zone=TXZ192
Auth: None. Fallback: local nwsAlert.ts.

### HHS emPOWER
Implementation: local zipOverlay.ts with real Travis County data.
5 ZIPs: 78701 (312), 78745 (489), 78702 (271), 78741 (403), 78723 (218).
County total: 4,200+.

### Claude API
Endpoint: https://api.anthropic.com/v1/messages
Model: claude-sonnet-4-20250514
Auth: Handled by environment — no Authorization header in fetch calls.
Used by: Agent 1 (1 call), Agent 2 (5 parallel calls).
All calls: try/catch with hardcoded fallbacks.

### Synthetic Shelter Database

| ID | Name | Distance | Power | Wheelchair | O2 | Transport | Phase 1 Score |
|---|---|---|---|---|---|---|---|
| shelter_001 | Dell Seton Medical Shelter | 4.2mi | YES 72hr | YES | YES | YES | 94% |
| shelter_002 | Austin Community Center | 1.1mi | NO | YES | NO | YES | 12% REJECTED |
| shelter_003 | Travis County Expo Center | 7.8mi | YES 48hr | NO | NO | NO | 31% |
| shelter_004 | Pflugerville Rec Center | 16.2mi | YES 96hr | YES | YES | NO | 58% |
| shelter_005 | South Austin Senior Center | 3.1mi | NO | YES | NO | YES | 18% REJECTED |

Shelter_001 always wins: only shelter with backup power + wheelchair + oxygen + transport from 78745.
Shelter_002 always hard-rejected: no backup power, ventilator dependency.

---

## 7. System Architecture

### Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript + Vite |
| Styling | Tailwind CSS with custom tokens |
| Map | React-Leaflet + OpenStreetMap (no API key) |
| Icons | Lucide React |
| State | React Context API |
| Agent Logic | TypeScript functions (browser) |
| AI | Claude API via fetch |
| Weather | NWS REST API |
| Population Data | Local zipOverlay.ts |
| Deployment | Vercel |

No backend. No database. No paid APIs except Claude. All logic runs in browser.

### Navigation — 4 Tabs

```
Tab 1: Map (default)
Tab 2: Shelter
Tab 3: S.O.S
Tab 4: Profile
```

### App State Machine

```
NORMAL
  └► [Trigger] ──► WARNING
                       │
                  [Get to Safety]
                       │
                   MATCHING (1.5s)
                       │
                    MATCHED
                    /      \
         [Confirm]          [Cannot Evacuate]
              /                    \
        EVACUATING          CANNOT_EVACUATE
                                   │
                             FLAGGED_OEM

MATCHED or EVACUATING
  └► [Storm Active] ──► DISASTER_ACTIVE
```

Phase (separate from AppMode):
PHASE_1 → PHASE_1_5 → PHASE_2

Phase drives Shelter screen content. AppMode drives everything else.

### File Structure

```
src/
├── pages/Index.tsx
├── context/DemoContext.tsx
├── agents/
│   ├── matchingAgent.ts
│   └── communicationAgent.ts
├── data/
│   ├── demo.ts
│   ├── zipOverlay.ts
│   └── nwsAlert.ts
└── components/safereach/
    ├── StatusBar.tsx
    ├── BottomNav.tsx
    ├── MapView.tsx
    ├── AlertBanner.tsx
    ├── LeftInfoPanel.tsx
    ├── ShelterScreen.tsx
    ├── Phase1Content.tsx
    ├── Phase15Content.tsx
    ├── Phase2Content.tsx
    ├── SOSScreen.tsx
    ├── ProfileScreen.tsx
    ├── DemoStrip.tsx
    └── CountdownBar.tsx
```

---

## 8. Agent Specifications

### Agent 1 — Matching Agent

File: src/agents/matchingAgent.ts
Architecture: Hybrid — deterministic TypeScript scoring + Claude explanation

Process:
1. Hard constraint filter (guard clause, not a weight)
2. Score remaining shelters on 5 dimensions using phase weights
3. Sort by total score
4. Build rejection reasons for all non-winners
5. Call Claude for explanation (async, with fallback)
6. Return MatchResult

Architecture defense for judges:
"The scoring is deterministic because the hard constraint cannot be a probability — it must be a guarantee. Claude generates only the explanation because human-readable reasoning is exactly where a language model adds value over a formula."

### Agent 2 — Communication Agent

File: src/agents/communicationAgent.ts
Architecture: Full AI — 5 parallel Claude calls via Promise.all

All 5 calls have hardcoded fallbacks using string interpolation with real runtime values. Fallbacks are dynamic, not static.

emergencySMS field: stored separately from notification log. Rendered on SOS screen. Contains every field emergency services need before dispatch.

Token budgets:
- User alert: 100 tokens
- Contact message: 80 tokens
- Shelter intake: 180 tokens
- OEM flag: 120 tokens
- Emergency SMS: 400 tokens

Architecture defense for judges:
"We use Claude where it adds value: generating natural language that real people read. Sarah shouldn't get a template — she should get a message written for her specific situation. The SMS to emergency services should read like it was written by someone who knows Maria, not generated by a string formatter."

---

## 9. UI Requirements

### Design Tokens

```
navy:    #0B1F3A  background
surface: #132744  cards
amber:   #F5A623  warning
danger:  #D94F3D  emergency
safe:    #2ECC71  confirmed
muted:   #8A9BB0  secondary text
blue:    #3B82F6  info/explanation accent

font-min:    16px
font-body:   18px
font-heading: 24px
font-alert:   32px

tap-min:  48px
btn:      56px
btn-lg:   64px
radius:   12px
```

### Header Rule — Every Screen, No Exceptions

background: rgba(11, 31, 58, 0.92)
backdrop-filter: blur(12px)
border-bottom: 1px solid rgba(255,255,255,0.06)

### Screen Inventory

| Screen | Tab | Priority |
|---|---|---|
| Map | 1 | P0 |
| My Shelter (3 phases) | 2 | P0 |
| S.O.S | 3 | P0 |
| Profile | 4 | P1 |

### App Mode to UI Mapping

| Mode | Status Pill | SOS Button |
|---|---|---|
| NORMAL | Green "Safe" | Static red |
| WARNING | Amber "Warning" | Static red |
| MATCHING | Amber "Matching..." | Static red |
| MATCHED | Green "Matched" | Static red |
| EVACUATING | Green "En Route" | Static red |
| CANNOT_EVACUATE | Red "OEM Notified" | Pulsing red |
| DISASTER_ACTIVE | Red "DISASTER ACTIVE" | Pulsing red |

### Accessibility Rules

- No color-only communication — always pair color with icon + text
- ARIA labels on all interactive elements
- No audio-only content
- Screen reader compatible markup
- Minimum contrast ratio 4.5:1
- Minimum tap target 48px

---

## 10. Demo Flow

5 steps. ~3 minutes. Both people run this from memory.

Setup: App on Map, NORMAL state, Maria's profile loaded.

**Step 1 — Trigger (0:00-0:30)**
T: Tap "Trigger" in demo strip.
Banner slides down, status turns amber.
P: "A Winter Storm Warning. SafeReach ingests it from the NWS API. Maria's ventilator depends on electricity. She cannot self-evacuate. The system does not wait for her to call 911."

**Step 2 — Match (0:30-1:10)**
T: Tap "Get to Safety." Navigate to Shelter tab. Wait 1.5s.
P: "The nearest shelter is 1.1 miles away. SafeReach rejected it. No backup power. Dell Seton is 4.2 miles away — 72-hour generator, wheelchair access, medical oxygen. That extra distance keeps her alive. The closer shelter doesn't."

**Step 3 — Phase Shift (1:10-1:35)**
T: Tap "2hrs Out" in demo strip. Animation plays.
P: "Two hours left. The algorithm shifts its own weights. Proximity now dominates. No existing emergency system does this — it changes its own formula as time collapses. Same shelter. Still reachable. Match confirmed."

**Step 4 — Disaster + SOS (1:35-2:15)**
T: Tap "Storm Active." App navigates to SOS after 1.5s. SMS card visible.
P: "Power has failed. Maria is alone. One tap. GPS coordinates, ventilator battery time, physical access instructions, what vehicle to send, who to call. Everything emergency services need before they leave the station."
T: Tap "Send Emergency SMS." Confirmation appears.

**Step 5 — Map (2:15-2:50)**
T: Navigate to Map. Tap green pin. Tap red pin. Point at amber circles.
P: "Green — 94% match. Red — rejected. 1.1 miles away, useless to Maria. Every amber zone: electricity-dependent residents. HHS emPOWER data. Real. Federal. On the map right now."

**Close (2:50-3:00)**
P: "The infrastructure exists. The mandate exists. The data exists. SafeReach connects them."
T: Map is the last thing judges see.

---

## 11. Governance Model

**Who operates:** County OEMs — already legally mandated to maintain special needs registries.

**Who verifies registrations:** Local DOH medical staff within the OEM.

**Who maintains shelter database:** Same OEM agency that runs shelter operations.

**Next build priority (beyond hackathon):** OEM Coordinator View — table of all registered users, match statuses, transport statuses, priority welfare check queue. This is what the county sheriff actually uses. Identified as the missing second product that makes SafeReach a full emergency management platform.

**Pitch line:**
"We're not reinventing emergency management. We're making the people who need it most visible to the people already responsible for them. The mandate exists. The data exists. SafeReach connects them."

---

## 12. Non-Requirements

Do not build these:

- User authentication
- Real SMS delivery
- Live transport dispatch
- Phase 2 real battery sensors
- OEM coordinator dashboard (next priority, not demo)
- Multi-county support
- Native mobile app
- HIPAA compliance infrastructure
- Trained ML model or neural network for matching

---

## 13. Judging Criteria Map

| Criterion | How SafeReach Wins |
|---|---|
| **Real Impact** | Uri had 24-36 hours of warnings. The system had time to act. SafeReach shows a ventilator-dependent woman navigating from warning to matched shelter to emergency SOS in under 3 minutes. |
| **Strong Execution** | Matching Agent: real TypeScript scoring with phase-adaptive weights. Communication Agent: 5 parallel Claude API calls. NWS API live. emPOWER data real. All 3 phases distinct and working. Emergency SMS generated at runtime. |
| **Inclusive by Design** | Alert format driven by communication profile. Large text, no audio-only. 48px tap targets. SOS designed for one-tap use in crisis. All phone numbers are real tel: links. SMS contains physical access instructions. |
| **Original Thinking** | Phase-shifting formula: no existing emergency system changes its own weights as time collapses. Proximity explicitly rejected as primary criterion. AI used where it adds value (language) not where it introduces risk (life-safety decisions). |
| **Practical Potential** | OEMs already have the mandate. emPOWER is already public. NWS is already free. Uri had 24-36 hours of warnings the system never used. SafeReach exists to use them. |

---

## 14. Glossary

| Term | Definition |
|---|---|
| emPOWER | HHS program: ZIP-level counts of Medicare beneficiaries using electricity-dependent DME |
| DME | Durable Medical Equipment: ventilators, oxygen concentrators, power wheelchairs, BiPAP |
| OEM | Office of Emergency Management: county-level disaster preparedness agency |
| STEAR | State of Texas Emergency Assistance Registry: failed during Uri |
| NWS | National Weather Service: free real-time alerts via public API |
| Phase 1 | 10+ hours before impact. Capability-first matching. |
| Phase 1.5 | 2 hours before impact. Proximity-first matching. |
| Phase 2 | Disaster active. No shelter matching. Survival mode: battery countdown, dispatch, SOS. |
| Hard constraint | Guard clause: removes no-power shelters for electricity-dependent users before scoring. Cannot be overridden. |
| emergencySMS | Full data packet on SOS screen. Contains everything emergency services need before dispatch. |
| Matching Agent | Agent 1: deterministic scoring + Claude explanation. |
| Communication Agent | Agent 2: 5 parallel Claude calls producing notification log + emergencySMS. |
| Cannot Evacuate path | User cannot reach shelter. OEM notification escalates to PRIORITY WELFARE CHECK. |
| Demo strip | 4-button control bar on map: Trigger / 2hrs / Storm / Reset. |
| Winter Storm Uri | Feb 13-17 2021. Texas. 4.5M without power. 24-36 hours of NWS warnings preceded grid failure. Primary design motivation. |