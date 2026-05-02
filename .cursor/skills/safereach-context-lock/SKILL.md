---
name: safereach-context-lock
description: Loads and enforces the locked SafeReach shared context. Use before any SafeReach implementation, UI, refactor, demo, deployment, Cursor, or Kiro collaboration task.
---

# SafeReach Context Lock

## Required Context

Before SafeReach work, read both files:

1. `.kiro/context/PRD.md`
2. `.kiro/context/SafeReach_Deployment_Guide.md`

Treat these files as the only authoritative shared knowledge base for the one-time Cursor and Kiro setup.

## Operating Rules

- The PRD wins for product, design, engineering, UI, accessibility, agent behavior, and non-requirements.
- The deployment guide wins for demo priority, verification order, release readiness, and day-of-demo behavior.
- Do not invent product requirements, routes, state fields, APIs, environment variables, data sources, schemas, or agent responsibilities.
- If current code conflicts with the PRD or deployment guide, flag the conflict before editing.
- If the user explicitly updates either shared context file, reload both files before continuing.

## SafeReach Invariants

- The app is React + TypeScript + Vite with Tailwind, React Context state, and browser-only logic.
- There is no backend, database, user authentication, real SMS delivery, live transport dispatch, native mobile app, or OEM dashboard in the hackathon build.
- Matching hard constraints are deterministic. Do not replace them with AI reasoning.
- Claude is used for explanation and communication text, with fallbacks.
- The SOS emergency SMS packet must remain visible and complete.

## Collaboration Rule

Cursor and Kiro must cite decisions back to the same two context files. Private memory, inferred goals, or external assumptions are not product truth.
