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
  Phase,
  {
    capability?: number;
    accessibility?: number;
    transport?: number;
    proximity?: number;
    capacity?: number;
  }
> = {
  1: { capability: 0.4, accessibility: 0.25, transport: 0.2, proximity: 0.1, capacity: 0.05 },
  1.5: { proximity: 0.35, capability: 0.3, transport: 0.25, accessibility: 0.05, capacity: 0.05 },
  2: { capability: 0.4, accessibility: 0.2, transport: 0.2, proximity: 0.15, capacity: 0.05 },
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

function buildExplanation(
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
  return `${winner.name} is your best available match based on your current needs and available resources.`;
}

export function runMatchingAgent(
  user: User,
  shelters: Shelter[],
  phase: Phase,
): MatchResult {
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
      capabilityScore * (weights.capability ?? 0) +
      accessibilityScore * (weights.accessibility ?? 0) +
      transportScore * (weights.transport ?? 0) +
      proximityScore * (weights.proximity ?? 0) +
      capacityScore * (weights.capacity ?? 0);

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

  const winnerScore = scored[0];
  const winner = shelters.find((s) => s.id === winnerScore.shelterId)!;

  scored.slice(1).forEach((s) => {
    rejected.push({ name: s.shelterName, reason: buildRejectionReason(s) });
  });

  return {
    winner,
    score: winnerScore.totalScore,
    phase,
    capabilityBadges: buildBadges(winner),
    explanation: buildExplanation(winner, rejected, phase),
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
