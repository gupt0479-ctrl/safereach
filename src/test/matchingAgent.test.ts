import { describe, it, expect } from "vitest";
import { runMatchingAgent, scoreShelterForMap } from "@/agents/matchingAgent";
import { MARIA, SHELTERS } from "@/data/demo";

describe("matchingAgent", () => {
  describe("Phase 1 — Capability First", () => {
    const result = runMatchingAgent(MARIA, SHELTERS, 1);

    it("should select Dell Seton Medical Shelter as winner", () => {
      expect(result.winner.id).toBe("shelter_001");
      expect(result.winner.name).toBe("Dell Seton Medical Shelter");
    });

    it("should produce a score above 80", () => {
      expect(result.score).toBeGreaterThan(80);
    });

    it("should hard-reject shelters without backup power for electricity-dependent user", () => {
      const rejectedNames = result.rejected.map((r) => r.name);
      expect(rejectedNames).toContain("Austin Community Center");
      expect(rejectedNames).toContain("South Austin Senior Activity Center");
    });

    it("should reject Austin Community Center for no backup power", () => {
      const acc = result.rejected.find((r) => r.name === "Austin Community Center");
      expect(acc).toBeDefined();
      expect(acc!.reason).toMatch(/backup power/i);
    });

    it("should include capability badges for winner", () => {
      expect(result.capabilityBadges.length).toBeGreaterThan(0);
      expect(result.capabilityBadges.some((b) => b.includes("Generator"))).toBe(true);
      expect(result.capabilityBadges.some((b) => b.includes("Accessible"))).toBe(true);
    });

    it("should set phase to 1", () => {
      expect(result.phase).toBe(1);
    });

    it("should generate an explanation string", () => {
      expect(result.explanation.length).toBeGreaterThan(20);
    });

    it("should include a notifiedAt timestamp", () => {
      expect(result.notifiedAt).toBeTruthy();
      expect(() => new Date(result.notifiedAt)).not.toThrow();
    });
  });

  describe("Phase 1.5 — Proximity First", () => {
    const result = runMatchingAgent(MARIA, SHELTERS, 1.5);

    it("should still select Dell Seton (only viable shelter with power + transport)", () => {
      expect(result.winner.id).toBe("shelter_001");
    });

    it("should still hard-reject no-power shelters", () => {
      const rejectedNames = result.rejected.map((r) => r.name);
      expect(rejectedNames).toContain("Austin Community Center");
    });

    it("should set phase to 1.5", () => {
      expect(result.phase).toBe(1.5);
    });

    it("should generate a reachability-focused explanation", () => {
      expect(result.explanation).toMatch(/reachability|transport window|2 hours/i);
    });
  });

  describe("Phase 2 — Disaster Active", () => {
    const result = runMatchingAgent(MARIA, SHELTERS, 2);

    it("should still select Dell Seton", () => {
      expect(result.winner.id).toBe("shelter_001");
    });

    it("should set phase to 2", () => {
      expect(result.phase).toBe(2);
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
    it("should never match an electricity-dependent user to a shelter without backup power", () => {
      for (const phase of [1, 1.5, 2] as const) {
        const result = runMatchingAgent(MARIA, SHELTERS, phase);
        expect(result.winner.backupPower).toBe(true);
      }
    });
  });
});
