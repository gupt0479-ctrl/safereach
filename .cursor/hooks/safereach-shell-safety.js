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

function findCommand(value) {
  if (!value || typeof value !== "object") return ""
  return value.command || value.cmd || value.shell_command || value.input?.command || value.tool_input?.command || ""
}

const input = readInput()
const command = String(findCommand(input))

const destructive =
  /\b(git\s+reset\s+--hard|git\s+checkout\s+--|git\s+clean\b|rm\s+(-rf|-fr)|sudo\b|chmod\s+-R|chown\s+-R)\b/i.test(command)
const deploymentOrEnv =
  /\b(vercel(\s|$)|vercel\s+env|npm\s+publish|dotenv|\.env|export\s+[A-Za-z_][A-Za-z0-9_]*=)\b/i.test(command)
const dependencyChange =
  /\b(npm\s+(install|i|add)|pnpm\s+(install|add)|yarn\s+(install|add)|bun\s+(install|add))\b/i.test(command)

if (destructive || deploymentOrEnv || dependencyChange) {
  process.stdout.write(JSON.stringify({
    permission: "ask",
    user_message: "This command can change files, dependencies, deployment, environment, or git state. Review it before continuing.",
    agent_message: "SafeReach shell safety gate triggered. Confirm the command is necessary and grounded in the PRD/deployment guide before running."
  }))
  process.exit(0)
}

const verification =
  /\b(npm\s+run\s+(lint|build|build:dev|preview|dev)|npm\s+test|vitest|tsc)\b/i.test(command)

process.stdout.write(JSON.stringify({
  permission: "allow",
  agent_message: verification
    ? "Verification command allowed. Report whether it passed, failed, was skipped, or was blocked."
    : undefined
}))
