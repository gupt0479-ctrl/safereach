#!/usr/bin/env node

const message = [
  "SafeReach context is locked to these shared files:",
  "- .kiro/context/PRD.md",
  "- .kiro/context/SafeReach_Deployment_Guide.md",
  "Read both before SafeReach UI, refactor, demo, deployment, Cursor, or Kiro coordination work.",
  "Treat the PRD as product/design/engineering truth and the deployment guide as demo/deployment truth."
].join("\n")

process.stdout.write(JSON.stringify({ additional_context: message }))
