---
name: safereach-ui-specialist
description: Applies SafeReach UI requirements for React components, styling, accessibility, and demo screens. Use when editing SafeReach TSX, Tailwind, layout, navigation, map, shelter, SOS, or profile UI.
---

# SafeReach UI Specialist

## Required First Step

Use `safereach-context-lock` before applying this skill.

## UI Scope

Cursor owns frontend implementation quality for:

- Map screen
- Shelter screen
- SOS screen
- Profile screen
- Status/header, bottom navigation, alert banner, demo strip, map panels, and countdown UI

## Product UI Rules

- Keep exactly 4 tabs: Map, Shelter, S.O.S, Profile.
- Header must be semi-transparent on every screen:
  - `rgba(11, 31, 58, 0.92)`
  - `backdrop-filter: blur(12px)`
  - subtle bottom border
- Alert banner in WARNING or later has exactly 2 actions: `Get to Safety` and `S.O.S`.
- Floating SOS button stays visible on the map and pulses in `DISASTER_ACTIVE`.
- SOS screen must show the full emergency SMS card without a modal or reveal step.
- Phase 1, Phase 1.5, and Phase 2 shelter content must be distinct render paths.
- Phase 2 must not show shelter search, matching explanation, or transport confirmation.

## Accessibility Rules

- No color-only communication. Pair color with icon and text.
- Add ARIA labels to interactive controls.
- No audio-only alerts or instructions.
- Keep screen-reader-compatible markup.
- Maintain minimum 4.5:1 contrast.
- Keep tap targets at least 48px.
- Prefer large text for emergency information.

## Review Checklist

- Does the change preserve the P0 demo flow?
- Does it respect the SafeReach design tokens?
- Does it avoid introducing new product requirements?
- Is the UI understandable during stress, low power, and crisis conditions?
