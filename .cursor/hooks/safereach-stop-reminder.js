#!/usr/bin/env node

const message = [
  "Before the final SafeReach response, include verification status for:",
  "- npm run lint",
  "- npm test",
  "- npm run build",
  "- Browser P0 checklist when UI, state, routing, or demo behavior changed",
  "Also flag any skipped or blocked checks."
].join("\n")

process.stdout.write(JSON.stringify({ followup_message: message }))
