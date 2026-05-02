---
inclusion: fileMatch
fileMatchPattern: "**/DemoContext*,**/DemoStrip*,**/Index.tsx,**/MapScreen*,**/ShelterScreen*,**/SosScreen*"
---

# SafeReach Demo Flow — State Transitions

This document defines the exact demo flow and state transitions. Any code touching the demo strip, state machine, or screen transitions must follow this precisely.

## Demo Strip Buttons (4 buttons, fixed at bottom of map)

1. **Trigger Warning** — Sets mode to WARNING, triggers Phase 1 match
2. **2hrs Out** — Sets phase to 1.5, re-runs match with proximity weights, navigates to Shelter
3. **Storm Active** — Sets mode to DISASTER_ACTIVE, phase to 2, auto-navigates to SOS after 1.5s
4. **Reset** — Clears ALL state to defaults, returns to Map

## State Transition Rules

### Trigger Warning
```
mode: NORMAL → WARNING
phase: stays 1
countdown: starts at 36000 (10 hours)
side effect: auto-runs matchingAgent with phase=1 if no matchResult exists
```

### 2hrs Out
```
mode: → MATCHING (1.5s) → MATCHED
phase: 1 → 1.5
side effect: re-runs matchingAgent with phase=1.5, navigates to shelter view
```

### Storm Active
```
mode: → DISASTER_ACTIVE
phase: → 2
countdown: → 0
side effect: auto-navigates to SOS view after 1.5-2 seconds
```

### Reset
```
mode: → NORMAL
phase: → 1
countdown: → 36000
matchResult: → null
notifications: → []
evacuationChoice: → null
view: → map
smsSent: → false
checkedIn: → false
transportConfirmed: → false
```

## Button Enable/Disable Logic

- **Trigger**: enabled only when mode === 'NORMAL'
- **2hrs Out**: enabled when mode !== 'NORMAL'
- **Storm Active**: enabled when mode !== 'NORMAL' AND phase >= 1.5
- **Reset**: always enabled

## Screen Auto-Navigation

- Storm Active triggers → auto-navigate to SOS after 1.5s delay
- Get to Safety (banner button) → navigate to Shelter tab
- Trigger Warning on map → stays on map (banner appears)

## Warning Banner (Map Screen)

Appears when mode is WARNING or higher. Contains exactly TWO buttons:
1. "Get to Safety" → navigates to Shelter tab
2. "S.O.S" → navigates to SOS tab

Nothing else. No explanations, no menu, no features.
