---
inclusion: always
---

# SafeReach Project Standards

## Architecture

SafeReach is a React + TypeScript + Vite hackathon project for disaster preparedness for people with disabilities. All logic runs in the browser — no backend, no database.

### Key Architecture Decisions
- **State management**: React Context API via `DemoContext.tsx` — single source of truth for app mode, phase, match results, notifications
- **Agents**: Pure TypeScript functions in `src/agents/` — deterministic scoring (matchingAgent) + notification generation (communicationAgent)
- **Data**: Hardcoded demo data in `src/data/` — Maria's profile, 5 shelters, contacts, emPOWER ZIP data, NWS alert shape
- **Map**: React-Leaflet + OpenStreetMap tiles (no API key required)
- **Navigation**: 4-tab bottom nav (Map, Shelter, SOS, Profile) — no router-based navigation, uses `view` state in DemoContext

### File Organization
```
src/context/DemoContext.tsx       — App state machine, all shared state
src/agents/matchingAgent.ts      — Shelter scoring with phase weights
src/agents/communicationAgent.ts — Notification generation
src/data/demo.ts                 — Maria, shelters, contacts, OEM reference
src/data/zipOverlay.ts           — emPOWER ZIP overlay data
src/data/nwsAlert.ts             — NWS alert fallback data
src/components/safereach/        — All screen components
src/pages/Index.tsx              — Shell, DemoStrip, layout
```

## Coding Standards

### TypeScript
- Use strict TypeScript — avoid `any` unless absolutely necessary for hackathon speed
- Export types alongside their implementations
- Use `type` imports where possible

### React
- Functional components only
- Use `useCallback` and `useMemo` for context values
- Keep components focused — one screen per file
- Use `cn()` from `@/lib/utils` for conditional classNames

### Styling
- Tailwind CSS with custom design tokens defined in `src/index.css`
- Use semantic color names: `navy`, `surface`, `amber`, `danger`, `safe`, `info`
- All interactive elements: minimum 48px tap target (`min-h-tap`)
- Buttons: 56px (`min-h-btn`) or 64px (`min-h-btn-lg`)
- Border radius: `rounded-card` (12px)
- Font sizes: body 18px, heading 24px, alert 32px, minimum 16px

### Accessibility (Non-Negotiable)
- No color-only communication — always pair color with icon + text
- ARIA labels on all interactive elements
- No audio-only content
- Minimum contrast ratio 4.5:1
- All phone numbers must be real `tel:` links
- Large text mode is the default

### State Machine Rules
- AppMode drives global UI (banner, status pill, SOS button pulse)
- Phase drives Shelter screen content (Phase 1, 1.5, 2 are completely different)
- Phase 2 / DISASTER_ACTIVE: NO shelter search, NO matching, NO transport confirmation
- Reset must clear ALL state back to defaults

### Matching Agent Rules
- HARD CONSTRAINT: electricity-dependent user + no backup power = shelter REJECTED (guard clause, not a weight)
- Phase 1 weights: capability 40%, accessibility 25%, transport 20%, proximity 10%, capacity 5%
- Phase 1.5 weights: proximity 35%, capability 30%, transport 25%, accessibility 5%, capacity 5%
- shelter_001 (Dell Seton) always wins for Maria
- shelter_002 (Austin Community Center) always hard-rejected

## Testing
- Test runner: Vitest with jsdom environment
- Run tests: `npm test` (uses `vitest run --pool forks --reporter verbose`)
- Test files: `src/**/*.{test,spec}.{ts,tsx}`
- Setup file: `src/test/setup.ts` (includes Testing Library matchers)

## Build & Deploy
- Build: `npm run build` (Vite production build → `dist/`)
- Dev server: `npm run dev` (port 8080)
- Deploy target: Vercel (auto-deploy from GitHub)
- Map tiles: OpenStreetMap (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`)
