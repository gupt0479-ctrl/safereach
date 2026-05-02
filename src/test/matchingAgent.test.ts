import { describe, it, expect, vi, beforeEach } from "vitest";
import { runMatchingAgent, scoreShelterForMap } from "@/agents/matchingAgent";
import { MARIA, SHELTERS } from "@/data/demo";

// Mock fetch globally so Claude API calls use fallback
beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("No network in test")));
});

describe("matchingAgent", () => {
  describe("Phase 1 — Capability First", () => {
    it("should select Dell Seton Medical Shelter as winner", async () => {
      const result = await runMatchingAgent(MARIA, SHELTERS, 1);
      expect(result.winner.id).toBe("shelter_001");
      expect(result.winner.name).toBe("Dell Seton Medical Shelter");
    });

    it("should produce a score above 80", async () => {
      const result = await runMatchingAgent(MARIA, SHELTERS, 1);
      expect(result.score).toBeGreaterThan(80);
    });

    it("should hard-reject shelters without backup power for electricity-dependent user", async () => {
      const result = await runMatchingAgent(MARIA, SHELTERS, 1);
      const rejectedNames = result.rejected.map((r) => r.name);
      expect(rejectedNames).toContain("Austin Community Center");
      expect(rejectedNames).toContain("South Austin Senior Activity Center");
    });

    it("should reject Austin Community Center for no backup power", async () => {
      const result = await runMatchingAgent(MARIA, SHELTERS, 1);
      const acc = result.rejected.find((r) => r.name === "Austin Community Center");
      expect(acc).toBeDefined();
      expect(acc!.reason).toMatch(/backup power/i);
    });

    it("should include capability badges for winner", async () => {
      const result = await runMatchingAgent(MARIA, SHELTERS, 1);
      expect(result.capabilityBadges.length).toBeGreaterThan(0);
      expect(result.capabilityBadges.some((b) => b.includes("Generator"))).toBe(true);
      expect(result.capabilityBadges.some((b) => b.includes("Accessible"))).toBe(true);
    });

    it("should set phase to 1", async () => {
      const result = await runMatchingAgent(MARIA, SHELTERS, 1);
      expect(result.phase).toBe(1);
    });

    it("should generate an explanation string", async () => {
      const result = await runMatchingAgent(MARIA, SHELTERS, 1);
      expect(result.explanation.length).toBeGreaterThan(20);
    });

    it("should include a notifiedAt timestamp", async () => {
      const result = await runMatchingAgent(MARIA, SHELTERS, 1);
      expect(result.notifiedAt).toBeTruthy();
      expect(() => new Date(result.notifiedAt)).not.toThrow();
    });
  });

  describe("Phase 1.5 — Proximity First", () => {
    it("should still select Dell Seton (only viable shelter with power + transport)", async () => {
      const result = await runMatchingAgent(MARIA, SHELTERS, 1.5);
      expect(result.winner.id).toBe("shelter_001");
    });

    it("should still hard-reject no-power shelters", async () => {
      const result = await runMatchingAgent(MARIA, SHELTERS, 1.5);
      const rejectedNames = result.rejected.map((r) => r.name);
      expect(rejectedNames).toContain("Austin Community Center");
    });

    it("should set phase to 1.5", async () => {
      const result = await runMatchingAgent(MARIA, SHELTERS, 1.5);
      expect(result.phase).toBe(1.5);
    });

    it("should generate a reachability-focused explanation", async () => {
      const result = await runMatchingAgent(MARIA, SHELTERS, 1.5);
      expect(result.explanation).toMatch(/reachability|transport window|2 hours/i);
    });
  });

  describe("Phase 2 — Disaster Active (Urgency Dimensions)", () => {
    it("should still select Dell Seton", async () => {
      const result = await runMatchingAgent(MARIA, SHELTERS, 2);
      expect(result.winner.id).toBe("shelter_001");
    });

    it("should set phase to 2", async () => {
      const result = await runMatchingAgent(MARIA, SHELTERS, 2);
      expect(result.phase).toBe(2);
    });

    it("should return a valid MatchResult with all required fields", async () => {
      const result = await runMatchingAgent(MARIA, SHELTERS, 2);
      expect(result.winner).toBeDefined();
      expect(result.score).toBeGreaterThan(0);
      expect(result.phase).toBe(2);
      expect(result.capabilityBadges).toBeDefined();
      expect(result.explanation.length).toBeGreaterThan(10);
      expect(result.rejected.length).toBeGreaterThan(0);
      expect(result.notifiedAt).toBeTruthy();
    });

    it("should hard-reject no-backup-power shelters in Phase 2", async () => {
      const result = await runMatchingAgent(MARIA, SHELTERS, 2);
      const rejectedNames = result.rejected.map((r) => r.name);
      expect(rejectedNames).toContain("Austin Community Center");
      expect(rejectedNames).toContain("South Austin Senior Activity Center");
    });

    it("should use urgency-based scoring (different score than Phase 1)", async () => {
      const phase1 = await runMatchingAgent(MARIA, SHELTERS, 1);
      const phase2 = await runMatchingAgent(MARIA, SHELTERS, 2);
      // Phase 2 uses completely different dimensions, so scores will differ
      expect(phase2.score).not.toBe(phase1.score);
    });

    it("should generate a disaster-specific explanation", async () => {
      const result = await runMatchingAgent(MARIA, SHELTERS, 2);
      expect(result.explanation).toMatch(/disaster|generator|battery|critical|power/i);
    });
  });

  describe("scoreShelterForMap", () => {
    it("should give Dell Seton a high score", () => {
      const score = scoreShelterForMap(MARIA, SHELTERS[0]);
      expect(score).toBeGreaterThanOrEqual(80);
    });

    it("should give Austin Community Center a low score (hard-rejected)", () => {
      const score = scoreShelterForMap(MARIA, SHELTERS[1]);
      expect(score).toBeLessThanOrEqual(31);
    });

    it("should give Travis County Expo a mid-range score", () => {
      const score = scoreShelterForMap(MARIA, SHELTERS[2]);
      expect(score).toBeGreaterThan(20);
      expect(score).toBeLessThan(70);
    });
  });

  describe("Hard constraint — guard clause", () => {
    it("should never match an electricity-dependent user to a shelter without backup power", async () => {
      for (const phase of [1, 1.5, 2] as const) {
        const result = await runMatchingAgent(MARIA, SHELTERS, phase);
        expect(result.winner.backupPower).toBe(true);
      }
    });

    it("should reject ALL no-backup-power shelters across all phases", async () => {
      const noBackupShelters = SHELTERS.filter((s) => !s.backupPower);
      for (const phase of [1, 1.5, 2] as const) {
        const result = await runMatchingAgent(MARIA, SHELTERS, phase);
        for (const shelter of noBackupShelters) {
          expect(result.winner.id).not.toBe(shelter.id);
          const isRejected = result.rejected.some((r) => r.name === shelter.name);
          expect(isRejected).toBe(true);
        }
      }
    });

    it("should never select a no-backup shelter even if it is the closest", async () => {
      // Austin Community Center is 1.1mi (closest) but has no backup power
      for (const phase of [1, 1.5, 2] as const) {
        const result = await runMatchingAgent(MARIA, SHELTERS, phase);
        expect(result.winner.id).not.toBe("shelter_002");
        expect(result.winner.id).not.toBe("shelter_005");
      }
    });
  });

  describe("Fallback behavior — Claude API failure", () => {
    it("should return a valid result with fallback explanation when fetch fails", async () => {
      // fetch is already mocked to reject
      const result = await runMatchingAgent(MARIA, SHELTERS, 1);
      expect(result.winner.id).toBe("shelter_001");
      expect(result.explanation.length).toBeGreaterThan(20);
      expect(result.explanation).toMatch(/backup power|generator|ventilator/i);
    });

    it("should return fallback explanation when fetch returns non-ok", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 401 }));
      const result = await runMatchingAgent(MARIA, SHELTERS, 1);
      expect(result.winner.id).toBe("shelter_001");
      expect(result.explanation.length).toBeGreaterThan(20);
    });
  });
});
