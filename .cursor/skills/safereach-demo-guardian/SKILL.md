---
name: safereach-demo-guardian
description: Protects SafeReach hackathon demo readiness. Use when testing, fixing, or reviewing the P0 demo flow, local build, live deployment, or presentation-critical UI.
---

# SafeReach Demo Guardian

## Required First Step

Use `safereach-context-lock` before demo or deployment work.

## P0 Checklist

Do not consider work complete until the relevant P0 checks pass:

- Map loads with shelter pins and Maria's dot.
- Trigger Warning shifts UI and shows the banner with exactly 2 buttons.
- Shelter screen shows Phase 1 match and explanation card.
- 2hrs Out shows Phase 1.5 with different content.
- Storm Active shows Phase 2 with battery countdown.
- SOS screen shows the full SMS card without extra tapping.
- Reset returns everything to the initial state cleanly.

## Priority Order

- Fix P0 failures before P1 polish.
- Fix P1 failures before P2 improvements.
- Do not deploy a broken app.
- Run local checks before live deployment checks.

## Verification Commands

Use the scripts available in `package.json`:

```bash
npm run lint
npm test
npm run build
```

Use browser verification for the visible demo sequence after code changes that affect UI, state, or routing.

## Final Response Requirement

When finishing implementation work, list exact verification commands and whether they were run, skipped, passed, failed, or blocked.
