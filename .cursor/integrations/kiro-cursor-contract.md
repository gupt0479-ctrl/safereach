# Cursor-Kiro SafeReach Contract

## Purpose

This is the one-time collaboration contract for Cursor and Kiro on SafeReach. Both agents operate from the same locked context and use complementary responsibilities.

## Locked Shared Context

The only authoritative shared context files are:

- `.kiro/context/PRD.md`
- `.kiro/context/SafeReach_Deployment_Guide.md`

The PRD is the source of truth for product, design, UI, accessibility, engineering, agent behavior, data sources, and non-requirements.

The deployment guide is the source of truth for priority order, demo readiness, local verification, deployment readiness, live checks, presentation flow, and fallback procedures.

## Context Access Rules

- Both agents must read both shared context files before SafeReach work.
- Both agents must reload both files after either file changes.
- Both agents must cite decisions back to these files, not private memory.
- Cursor may derive implementation tasks from the shared context, but may not write new product truth into it unless explicitly asked.
- Kiro may produce analysis from the shared context, but may not expand scope beyond it unless explicitly asked.
- If implementation conflicts with the PRD, flag the conflict before editing.
- If implementation conflicts with the deployment guide P0 order, fix P0 first.

## Role Split

Cursor owns:

- UI implementation
- React and TypeScript refactoring
- Accessibility review
- Component organization
- Styling consistency
- Browser verification
- Demo-readiness checks
- Small behavior-preserving frontend fixes

Kiro owns:

- Heavy computation
- Broad scenario analysis
- Exhaustive reasoning
- Large generated artifacts
- High-volume simulations
- Computation-heavy validation outside normal frontend checks

## Routing Rule

```ts
type AgentOwner = 'cursor' | 'kiro'

interface AgentTask {
  affectsUI?: boolean
  affectsRefactor?: boolean
  requiresBrowserVerification?: boolean
  requiresHeavyComputation?: boolean
  requiresLargeScenarioAnalysis?: boolean
}

function routeSafeReachTask(task: AgentTask): AgentOwner {
  if (task.requiresHeavyComputation || task.requiresLargeScenarioAnalysis) return 'kiro'
  if (task.affectsUI || task.affectsRefactor || task.requiresBrowserVerification) return 'cursor'
  return 'cursor'
}
```

## Shared State Contract

Derived coordination state is optional and non-authoritative. It exists only to hand off current work between agents.

```ts
interface AgentCoordinationState {
  contextVersion: {
    prdPath: '.kiro/context/PRD.md'
    deploymentGuidePath: '.kiro/context/SafeReach_Deployment_Guide.md'
    loadedAt: string
  }
  owner: 'cursor' | 'kiro'
  taskType: 'ui' | 'refactor' | 'verification' | 'heavy-compute' | 'analysis'
  currentFocus: string
  affectedFiles: string[]
  decisions: Array<{
    source: 'PRD' | 'DeploymentGuide'
    reference: string
    summary: string
  }>
  verification: Array<{
    commandOrChecklist: string
    status: 'pending' | 'passed' | 'failed' | 'blocked'
    notes?: string
  }>
  openRisks: string[]
}
```

## Handoff Payload

Every handoff between Cursor and Kiro should use this shape:

```ts
interface AgentHandoff {
  from: 'cursor' | 'kiro'
  to: 'cursor' | 'kiro'
  reason: string
  sharedContext: [
    '.kiro/context/PRD.md',
    '.kiro/context/SafeReach_Deployment_Guide.md'
  ]
  taskSummary: string
  affectedFiles: string[]
  relevantRequirements: Array<{
    source: 'PRD' | 'DeploymentGuide'
    topic: string
    summary: string
  }>
  assumptions: string[]
  expectedOutput: string
  verificationStatus: AgentCoordinationState['verification']
  openRisks: string[]
}
```

## Handoff Examples

Cursor to Kiro:

```json
{
  "from": "cursor",
  "to": "kiro",
  "reason": "Large scenario analysis needed before frontend implementation",
  "sharedContext": [
    ".kiro/context/PRD.md",
    ".kiro/context/SafeReach_Deployment_Guide.md"
  ],
  "taskSummary": "Analyze whether the existing demo flow covers all P0 judging risks.",
  "affectedFiles": [],
  "relevantRequirements": [
    {
      "source": "DeploymentGuide",
      "topic": "P0 checklist",
      "summary": "Map, Trigger, Shelter phases, Storm Active, SOS visibility, and Reset must work."
    }
  ],
  "assumptions": ["No new product requirements may be introduced."],
  "expectedOutput": "Concise risk list with PRD/deployment references.",
  "verificationStatus": [],
  "openRisks": []
}
```

Kiro to Cursor:

```json
{
  "from": "kiro",
  "to": "cursor",
  "reason": "Frontend implementation and browser verification needed",
  "sharedContext": [
    ".kiro/context/PRD.md",
    ".kiro/context/SafeReach_Deployment_Guide.md"
  ],
  "taskSummary": "Update the Shelter screen so Phase 2 does not reuse matching UI.",
  "affectedFiles": ["src/components/safereach/ShelterScreen.tsx"],
  "relevantRequirements": [
    {
      "source": "PRD",
      "topic": "Phase 2 Shelter screen",
      "summary": "Phase 2 is disaster active survival mode with no shelter search or confirmation."
    }
  ],
  "assumptions": ["Routes and app mode names remain unchanged."],
  "expectedOutput": "Small targeted patch plus lint, test, build, and P0 browser status.",
  "verificationStatus": [
    {
      "commandOrChecklist": "npm run lint",
      "status": "pending"
    }
  ],
  "openRisks": ["Phase 2 affects emergency demo flow."]
}
```

## Conflict Resolution

Resolve disagreements in this order:

1. `.kiro/context/PRD.md`
2. `.kiro/context/SafeReach_Deployment_Guide.md`
3. Current code
4. User clarification

Stop before editing if a conflict affects auth, schema, routing, public interfaces, state flow, emergency behavior, deployment configuration, or environment configuration.

## Safety-Critical Guardrails

- Do not remove the backup-power hard rejection for electricity-dependent users.
- Do not turn life-safety constraints into AI-generated decisions.
- Do not hide the emergency SMS card behind a button, modal, accordion, hover, or delayed reveal.
- Do not add backend, database, auth, real SMS, live dispatch, OEM dashboard, multi-county support, native mobile, HIPAA infrastructure, or trained ML unless the shared context is explicitly changed.
- Do not deploy until local P0 verification passes.
