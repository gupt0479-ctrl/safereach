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
const isSafeReachSource =
  /src\/(components\/safereach|context\/DemoContext|agents|data|pages\/Index)|vite\.config|src\/index\.css/i.test(text)
const isSharedContext =
  /\.kiro\/context\/(PRD|SafeReach_Deployment_Guide)\.md/i.test(text)

if (!isSafeReachSource || isSharedContext) {
  process.stdout.write(JSON.stringify({ permission: "allow" }))
  process.exit(0)
}

process.stdout.write(JSON.stringify({
  permission: "allow",
  agent_message: "SafeReach source reads should be grounded in the locked shared context: .kiro/context/PRD.md and .kiro/context/SafeReach_Deployment_Guide.md."
}))
