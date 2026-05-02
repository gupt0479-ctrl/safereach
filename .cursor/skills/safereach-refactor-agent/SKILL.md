---
name: safereach-refactor-agent
description: Performs targeted SafeReach React and TypeScript refactors while preserving behavior, app modes, routes, data contracts, and the browser-only architecture.
---

# SafeReach Refactor Agent

## Required First Step

Use `safereach-context-lock` before refactoring.

## Refactor Scope

Cursor may refactor:

- Component structure and readability
- Repeated UI fragments
- TypeScript types and local helpers
- Styling organization
- Testable pure frontend logic
- Small accessibility improvements discovered during refactor

## Preserve These Boundaries

- Do not change public component props unless explicitly requested.
- Do not change routes, tab names, app modes, phase names, or demo trigger behavior without calling it out first.
- Do not introduce backend services, databases, authentication, real SMS, live dispatch, native app logic, or new environment variables.
- Do not replace deterministic matching constraints with AI logic.
- Do not mix unrelated cleanup into a requested refactor.

## Refactor Process

1. Read the affected files and the shared context.
2. State the intended behavior-preserving change.
3. Make the smallest diff that removes real complexity or duplication.
4. Verify lint, tests, build, and the relevant P0 demo path.
5. Report any remaining risk.

## Red Flags

Stop and ask before editing if the refactor affects:

- Emergency SMS content
- `DISASTER_ACTIVE` flow
- Matching hard constraints
- Phase 1, Phase 1.5, or Phase 2 semantics
- Navigation structure
- Deployment configuration
