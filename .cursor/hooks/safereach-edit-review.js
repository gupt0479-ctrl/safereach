#!/usr/bin/env node

import fs from "node:fs"

function readInput() {
  try {
    const raw = fs.readFileSync(0, "utf8").trim()
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

const input = readInput()
const text = JSON.stringify(input)
const touchesSafeReachUi =
  /src\/components\/safereach\/|src\/context\/DemoContext\.tsx|src\/pages\/Index\.tsx|src\/index\.css|vite\.config\.ts/i.test(text)
const touchesSafetyLogic =
  /src\/agents\/(matchingAgent|communicationAgent)\.ts|emergencySMS|DISASTER_ACTIVE|backupPower|electricityDependent|Phase2|Phase15|SOS/i.test(text)

if (!touchesSafeReachUi && !touchesSafetyLogic) {
  process.stdout.write(JSON.stringify({}))
  process.exit(0)
}

const reviewContext = [
  "SafeReach edit review required:",
  "- Re-check the affected change against .kiro/context/PRD.md.",
  "- Re-check demo impact against .kiro/context/SafeReach_Deployment_Guide.md P0 order.",
  "- Preserve 4-tab navigation, phase-specific UI, visible SOS SMS, reset behavior, and accessibility rules.",
  "- If matching constraints, emergency SMS, DISASTER_ACTIVE, routing, state flow, deployment, or env config changed, flag the risk before finalizing."
].join("\n")

process.stdout.write(JSON.stringify({ additional_context: reviewContext }))
