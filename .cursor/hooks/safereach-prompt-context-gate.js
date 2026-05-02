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
const safeReachRequest =
  /\b(safereach|safe reach|kiro|cursor|demo|deployment|deploy|refactor|ui|frontend|accessibility|sos|s\.o\.s|shelter|maria|disaster|storm active|phase\s*1\.5)\b/i.test(text)

if (!safeReachRequest) {
  process.stdout.write(JSON.stringify({ permission: "allow" }))
  process.exit(0)
}

process.stdout.write(JSON.stringify({
  permission: "allow",
  agent_message: "Before answering or editing for SafeReach, read .kiro/context/PRD.md and .kiro/context/SafeReach_Deployment_Guide.md. Do not introduce product truth outside those files."
}))
