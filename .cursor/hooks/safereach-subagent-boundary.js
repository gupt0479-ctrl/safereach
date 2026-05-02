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
const safeReachTask =
  /\b(safereach|safe reach|maria|sos|shelter|disaster|phase|emPOWER|NWS|Kiro|Cursor)\b/i.test(text)
const heavyTask =
  /\b(heavy computation|large analysis|exhaustive|simulate|scenario analysis|broad synthesis|generate large|batch)\b/i.test(text)
const cursorTask =
  /\b(ui|frontend|tsx|react|refactor|accessibility|browser|demo|component|tailwind|verification)\b/i.test(text)

if (!safeReachTask) {
  process.stdout.write(JSON.stringify({ permission: "allow" }))
  process.exit(0)
}

let userMessage = "SafeReach subagents must use .kiro/context/PRD.md and .kiro/context/SafeReach_Deployment_Guide.md as the locked shared context."

if (heavyTask && !cursorTask) {
  userMessage += " This appears computation-heavy; prefer Kiro for the main workload and return a concise handoff to Cursor for UI/refactor work."
} else if (cursorTask) {
  userMessage += " This appears appropriate for Cursor if the work is UI, refactor, accessibility, browser verification, or demo readiness."
}

process.stdout.write(JSON.stringify({
  permission: "allow",
  user_message: userMessage
}))
