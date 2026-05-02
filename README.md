# SafeReach

SafeReach is a Vite, React, TypeScript, Tailwind CSS, and shadcn-style UI prototype for the hackathon demo. The UI models disaster warning, shelter matching, notification, SOS, profile, and map flows for a registered resident who depends on electricity-powered medical equipment.

## Setup

```bash
npm install
npm run dev
```

The dev server is configured in `vite.config.ts` to run on port `8080`.

## Validation

```bash
npm run build
npm run test
npm run lint
```

## Demo Checklist

- Map loads with Leaflet tiles, Maria's pulsing location dot, shelter pins, and emPOWER ZIP circles.
- Trigger Warning changes the UI state, starts the countdown, and enables the shelter flow.
- Shelter screen shows the Phase 1 match and explanation.
- 2hrs Out reruns the matching flow for Phase 1.5.
- Storm Active switches to the emergency state and routes toward SOS.
- SOS screen shows the emergency SMS content card without requiring an extra reveal.
- Profile screen loads contact/profile details.
- Reset returns the app to the normal starting state.

## Notes

- This repository intentionally contains only the migrated UI app and frontend demo logic.
- The matching and communication modules under `src/agents` run in the browser for the demo.
- Live backend services, authentication, SMS delivery, transport dispatch, and OEM dashboards are outside the current hackathon UI scope.
