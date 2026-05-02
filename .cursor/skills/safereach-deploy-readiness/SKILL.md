---
name: safereach-deploy-readiness
description: Applies SafeReach deployment and demo-readiness checks. Use when preparing local verification, Vercel deployment, live demo validation, or presentation backup steps.
---

# SafeReach Deploy Readiness

## Required First Step

Use `safereach-context-lock` before deployment work.

## Deployment Rule

Do not deploy a broken app. Verify P0 locally before deployment and on the live URL after deployment.

## Local Verification

Run or request:

```bash
npm run lint
npm test
npm run build
```

Then run the P0 browser checklist from `safereach-demo-guardian`.

## Live Verification

After deployment:

- Open the live URL immediately.
- Run the P0 checklist.
- Check map tiles, shelter pins, Maria's dot, demo strip, SOS visibility, and reset behavior.

## Presentation Lock

Two hours before presenting:

- Stop feature changes.
- Push only after local P0 verification.
- Verify the live deployment.
- Keep backup screenshots ready.

## Failure Handling

Fix in deployment guide priority order:

1. Map and app load failures.
2. Phase rendering failures.
3. SOS visibility failures.
4. broken reset behavior.
5. P1 and P2 polish.
