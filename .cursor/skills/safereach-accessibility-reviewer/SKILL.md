---
name: safereach-accessibility-reviewer
description: Reviews SafeReach UI changes for crisis-accessibility requirements. Use when editing interactive controls, visual states, emergency alerts, forms, navigation, map panels, or SOS flows.
---

# SafeReach Accessibility Reviewer

## Required First Step

Use `safereach-context-lock` before accessibility review.

## Crisis Accessibility Standard

SafeReach is designed for a ventilator-dependent power wheelchair user under disaster stress. Accessibility is a product requirement, not polish.

## Checklist

- Interactive targets are at least 48px.
- Emergency actions use clear text and iconography.
- Color is never the only signal for status or severity.
- All buttons, links, toggles, map actions, and emergency controls have usable labels.
- Text remains large and readable in warning and disaster states.
- Alert content is not audio-only.
- SOS content is visible without relying on hover, hidden menus, or modal reveal.
- Screen reader users can understand current status, active phase, and emergency actions.

## Review Output

When reviewing, lead with blocking issues:

- Missing accessible name
- Tap target too small
- Color-only state
- Hidden emergency information
- Contrast risk
- Keyboard or screen-reader trap

Then include concise suggested fixes.
