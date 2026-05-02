import type { Shelter, User } from "@/data/demo";

export type Phase = 1 | 1.5 | 2;

interface ShelterScore {
  shelterId: string;
  shelterName: string;
  totalScore: number;
  capabilityScore: number;
  accessibilityScore: number;
  transportScore: number;
  proximityScore: number;
  capacityScore: number;
}

/** Phase 2 urgency scoring dimensions. */
interface Phase2Score {
  shelterId: string;
  shelterName: string;
  totalScore: number;
  equipmentBatteryUrgency: number;
  disabilityUrgencyTier: number;
  timeSinceLastCheckin: number;
  nearbyResourceAvailability: number;
}

export interface MatchResult {
  winner: Shelter;
  score: number;
  phase: Phase;
  capabilityBadges: string[];
  explanation: string;
  rejected: { name: string; reason: string }[];
  notifiedAt: string;
}

const PHASE_WEIGHTS: Record<
  1 | 1.5,
  {
    capability: number;
    accessibility: number;
    transport: number;
    proximity: number;
    capacity: number;
  }
> = {
  1: { capability: 0.4, accessibility: 0.25, transport: 0.2, proximity: 0.1, capacity: 0.05 },
  1.5: { proximity: 0.35, capability: 0.3, transport: 0.25, accessibility: 0.05, capacity: 0.05 },
};

const PHASE2_WEIGHTS = {
  equipment_battery_urgency: 0.35,
  disability_urgency_tier: 0.30,
  time_since_last_checkin: 0.20,
  nearby_resource_availability: 0.15,
};

function scoreCapability(user: User, shelter: Shelter): number {
  let score = 0;
  let checks = 0;
  if (user.equipment.includes("ventilator")) {
    checks++;
    if (shelter.backupPower) score++;
  }
  if (user.equipment.includes("power_wheelchair")) {
    checks++;
    if (shelter.wheelchairAccessible) score++;
  }
  if (
    user.equipment.includes("insulin") ||
    user.equipment.includes("refrigerated_meds")
  ) {
    checks++;
    if (shelter.refrigeration) score++;
  }
  return checks === 0 ? 1 : score / checks;
}

function scoreProximity(miles: number): number {
  return Math.max(0, 1 - miles / 20);
}

function scoreCapacity(used: number, total: number): number {
  const pct = used / total;
  if (pct > 0.95) return 0;
  if (pct > 0.8) return 0.4;
  if (pct > 0.6) return 0.7;
  return 1;
}

// --- Phase 2 urgency scoring functions ---

/** Equipment battery urgency: lower battery → higher urgency score (0-1). */
function scoreEquipmentBatteryUrgency(user: User, shelter: Shelter): number {
  const batteryPct = user.ventilatorBatteryPct ?? 100;
  const batteryHours = user.ventilatorBatteryHours ?? 24;
  // Urgency increases as battery decreases
  const pctUrgency = 1 - batteryPct / 100;
  const hoursUrgency = Math.max(0, 1 - batteryHours / 12);
  // Shelter with generator gets bonus for being able to recharge
  const generatorBonus = shelter.backupPower ? 0.2 : 0;
  return Math.min(1, (pctUrgency * 0.5 + hoursUrgency * 0.5) + generatorBonus);
}

/** Disability urgency tier: more severe/multiple disabilities → higher score (0-1). */
function scoreDisabilityUrgencyTier(user: User, shelter: Shelter): number {
  let tier = 0;
  if (user.disabilities.includes("respiratory")) tier += 0.4;
  if (user.disabilities.includes("mobility")) tier += 0.3;
  if (!user.canSelfEvacuate) tier += 0.2;
  // Shelter that meets more needs scores higher
  if (shelter.medicalOxygen && user.equipment.includes("ventilator")) tier += 0.1;
  return Math.min(1, tier);
}

/** Time since last check-in: simulated. Higher = more urgent (0-1). */
function scoreTimeSinceLastCheckin(_user: User, _shelter: Shelter): number {
  // In production this would use real check-in timestamps.
  // For demo: Maria hasn't checked in for ~45 min → moderate urgency.
  const minutesSinceCheckin = 45;
  return Math.min(1, minutesSinceCheckin / 120); // 2hr max scale
}

/** Nearby resource availability: shelter proximity + capacity in disaster (0-1). */
function scoreNearbyResourceAvailability(user: User, shelter: Shelter): number {
  const proxScore = scoreProximity(shelter.distanceMiles);
  const capScore = scoreCapacity(shelter.capacityUsed, shelter.capacityTotal);
  const transportScore = shelter.transportFromZip78745 ? 1 : 0;
  const accScore = shelter.wheelchairAccessible && user.requiresAccessibleTransport ? 1 : 0.2;
  return proxScore * 0.3 + capScore * 0.3 + transportScore * 0.2 + accScore * 0.2;
}

function buildBadges(s: Shelter): string[] {
  const out: string[] = [];
  if (s.backupPower) out.push("⚡ Backup Generator");
  if (s.wheelchairAccessible) out.push("♿ Fully Accessible");
  if (s.medicalOxygen) out.push("🫁 Medical Oxygen");
  if (s.refrigeration) out.push("❄️ Refrigeration");
  return out;
}

function buildRejectionReason(s: ShelterScore): string {
  if (s.transportScore === 0)
    return "No accessible transport available from your ZIP code.";
  if (s.accessibilityScore === 0) return "Shelter is not wheelchair accessible.";
  if (s.capacityScore === 0) return "Shelter is at capacity.";
  return `Lower overall match score (${s.totalScore}/100) — capability or proximity constraints.`;
}

function buildPhase2RejectionReason(s: Phase2Score): string {
  if (s.nearbyResourceAvailability < 0.3)
    return "Limited nearby resources — low accessibility or transport in disaster conditions.";
  return `Lower urgency-based score (${s.totalScore}/100) — other shelters better positioned for immediate needs.`;
}

function buildFallbackExplanation(
  winner: Shelter,
  rejected: { name: string; reason: string }[],
  phase: Phase,
): string {
  const powerRejected = rejected.find((r) => r.reason.includes("backup power"));
  if (powerRejected && phase === 1) {
    return (
      `The nearest shelter (${powerRejected.name}) does not have backup power. ` +
      `Your ventilator requires continuous electricity. ${winner.name} is ${winner.distanceMiles} miles ` +
      `away but has a backup generator rated for ${winner.generatorHours}+ hours, ADA-accessible ` +
      `entrances and bathrooms, and medical oxygen on site. With 10 hours until impact, ` +
      `transport can reach you in time. This shelter keeps you alive. The closer one does not.`
    );
  }
  if (phase === 1.5) {
    return (
      `With 2 hours until impact, reachability is now the priority. ` +
      `${winner.name} is still within your transport window at ${winner.distanceMiles} miles. ` +
      `It meets all your equipment requirements. Match confirmed.`
    );
  }
  if (phase === 2) {
    return (
      `Disaster is active. ${winner.name} has a running generator (${winner.generatorHours}h capacity), ` +
      `medical oxygen, and wheelchair access. Your ventilator battery is critical. ` +
      `This shelter is your best option for immediate power and medical support.`
    );
  }
  return `${winner.name} is your best available match based on your current needs and available resources.`;
}

/**
 * Attempt one Claude API call for a human-readable explanation.
 * Returns the generated text or null if the call fails for any reason.
 */
async function fetchClaudeExplanation(
  winner: Shelter,
  rejected: { name: string; reason: string }[],
  phase: Phase,
  user: User,
): Promise<string | null> {
  try {
    const prompt = `You are SafeReach, a disaster preparedness system. In 2-3 short sentences, explain why ${winner.name} (${winner.distanceMiles} miles, ${winner.generatorHours}h generator, wheelchair accessible: ${winner.wheelchairAccessible}, medical oxygen: ${winner.medicalOxygen}) was selected for ${user.name}, a ${user.age}-year-old ventilator-dependent wheelchair user who cannot self-evacuate. Phase ${phase}. ${rejected.length} shelters were rejected. Be direct and factual.`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 120,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const text = data?.content?.[0]?.text;
    return typeof text === "string" && text.length > 10 ? text : null;
  } catch {
    // CORS, network, auth, or any other failure → fallback
    return null;
  }
}

/**
 * Score shelters using Phase 1 / Phase 1.5 weights (capability-based dimensions).
 */
function scorePhase1or15(
  user: User,
  shelters: Shelter[],
  phase: 1 | 1.5,
): { scored: ShelterScore[]; rejected: { name: string; reason: string }[] } {
  const weights = PHASE_WEIGHTS[phase];
  const scored: ShelterScore[] = [];
  const rejected: { name: string; reason: string }[] = [];

  for (const shelter of shelters) {
    // HARD CONSTRAINT: electricity-dependent + no backup power → never match
    if (user.electricityDependent && !shelter.backupPower) {
      rejected.push({
        name: shelter.name,
        reason: `No backup power. ${user.name}'s ventilator requires continuous electricity.`,
      });
      continue;
    }

    const capabilityScore = scoreCapability(user, shelter);
    const accessibilityScore = shelter.wheelchairAccessible ? 1 : 0;
    const transportScore = shelter.transportFromZip78745 ? 1 : 0;
    const proximityScore = scoreProximity(shelter.distanceMiles);
    const capacityScore = scoreCapacity(shelter.capacityUsed, shelter.capacityTotal);

    const total =
      capabilityScore * weights.capability +
      accessibilityScore * weights.accessibility +
      transportScore * weights.transport +
      proximityScore * weights.proximity +
      capacityScore * weights.capacity;

    scored.push({
      shelterId: shelter.id,
      shelterName: shelter.name,
      totalScore: Math.round(total * 100),
      capabilityScore,
      accessibilityScore,
      transportScore,
      proximityScore,
      capacityScore,
    });
  }

  scored.sort((a, b) => b.totalScore - a.totalScore);
  return { scored, rejected };
}

/**
 * Score shelters using Phase 2 urgency dimensions.
 * Hard constraint still applies: no backup power → rejected.
 */
function scorePhase2(
  user: User,
  shelters: Shelter[],
): { scored: Phase2Score[]; rejected: { name: string; reason: string }[] } {
  const scored: Phase2Score[] = [];
  const rejected: { name: string; reason: string }[] = [];

  for (const shelter of shelters) {
    // HARD CONSTRAINT: electricity-dependent + no backup power → never match
    if (user.electricityDependent && !shelter.backupPower) {
      rejected.push({
        name: shelter.name,
        reason: `No backup power. ${user.name}'s ventilator requires continuous electricity.`,
      });
      continue;
    }

    const equipmentBatteryUrgency = scoreEquipmentBatteryUrgency(user, shelter);
    const disabilityUrgencyTier = scoreDisabilityUrgencyTier(user, shelter);
    const timeSinceLastCheckin = scoreTimeSinceLastCheckin(user, shelter);
    const nearbyResourceAvailability = scoreNearbyResourceAvailability(user, shelter);

    const total =
      equipmentBatteryUrgency * PHASE2_WEIGHTS.equipment_battery_urgency +
      disabilityUrgencyTier * PHASE2_WEIGHTS.disability_urgency_tier +
      timeSinceLastCheckin * PHASE2_WEIGHTS.time_since_last_checkin +
      nearbyResourceAvailability * PHASE2_WEIGHTS.nearby_resource_availability;

    scored.push({
      shelterId: shelter.id,
      shelterName: shelter.name,
      totalScore: Math.round(total * 100),
      equipmentBatteryUrgency,
      disabilityUrgencyTier,
      timeSinceLastCheckin,
      nearbyResourceAvailability,
    });
  }

  scored.sort((a, b) => b.totalScore - a.totalScore);
  return { scored, rejected };
}

export async function runMatchingAgent(
  user: User,
  shelters: Shelter[],
  phase: Phase,
): Promise<MatchResult> {
  let winnerId: string;
  let winnerScore: number;
  const rejected: { name: string; reason: string }[] = [];

  if (phase === 2) {
    // Phase 2: urgency-based scoring with completely different dimensions
    const result = scorePhase2(user, shelters);
    rejected.push(...result.rejected);

    const top = result.scored[0];
    winnerId = top.shelterId;
    winnerScore = top.totalScore;

    // Add non-winners to rejected
    result.scored.slice(1).forEach((s) => {
      rejected.push({ name: s.shelterName, reason: buildPhase2RejectionReason(s) });
    });
  } else {
    // Phase 1 or 1.5: capability-based scoring
    const result = scorePhase1or15(user, shelters, phase);
    rejected.push(...result.rejected);

    const top = result.scored[0];
    winnerId = top.shelterId;
    winnerScore = top.totalScore;

    // Add non-winners to rejected
    result.scored.slice(1).forEach((s) => {
      rejected.push({ name: s.shelterName, reason: buildRejectionReason(s) });
    });
  }

  const winner = shelters.find((s) => s.id === winnerId)!;

  // Build deterministic fallback explanation first
  const fallbackExplanation = buildFallbackExplanation(winner, rejected, phase);

  // Attempt one Claude explanation call — use fallback if it fails
  const claudeExplanation = await fetchClaudeExplanation(winner, rejected, phase, user);
  const explanation = claudeExplanation ?? fallbackExplanation;

  return {
    winner,
    score: winnerScore,
    phase,
    capabilityBadges: buildBadges(winner),
    explanation,
    rejected,
    notifiedAt: new Date().toISOString(),
  };
}

/** Per-shelter match score for map popups (independent of phase). */
export function scoreShelterForMap(user: User, shelter: Shelter): number {
  if (user.electricityDependent && !shelter.backupPower) return 31;
  const cap = scoreCapability(user, shelter);
  const acc = shelter.wheelchairAccessible ? 1 : 0;
  const trans = shelter.transportFromZip78745 ? 1 : 0;
  const prox = scoreProximity(shelter.distanceMiles);
  const total = cap * 0.4 + acc * 0.25 + trans * 0.2 + prox * 0.1 + 0.05;
  return Math.round(total * 100);
}
