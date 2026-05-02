import { describe, it, expect, vi, beforeEach } from "vitest";
import { runCommunicationAgent } from "@/agents/communicationAgent";
import type { CommunicationResult } from "@/agents/communicationAgent";
import { runMatchingAgent } from "@/agents/matchingAgent";
import { MARIA, SHELTERS, CONTACTS, OEM_REFERENCE } from "@/data/demo";
import type { MatchResult } from "@/agents/matchingAgent";

let match: MatchResult;

// Mock fetch globally so Claude API calls use fallback
beforeEach(async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("No network in test")));
  match = await runMatchingAgent(MARIA, SHELTERS, 1);
});

describe("communicationAgent", () => {
  describe("CommunicationResult structure", () => {
    it("should return a CommunicationResult with all required fields", async () => {
      const result: CommunicationResult = await runCommunicationAgent(match, MARIA, CONTACTS, "confirmed");
      expect(result.notifications).toBeDefined();
      expect(Array.isArray(result.notifications)).toBe(true);
      expect(result.emergencySMS).toBeDefined();
      expect(typeof result.emergencySMS).toBe("string");
      expect(result.generatedAt).toBeTruthy();
      expect(result.evacuationChoice).toBe("confirmed");
      expect(result.referenceCode).toBe("TXV-2847");
    });
  });

  describe("confirmed evacuation", () => {
    it("should generate 6 notifications (user + 2 contacts + shelter + OEM + emergency SMS log)", async () => {
      const result = await runCommunicationAgent(match, MARIA, CONTACTS, "confirmed");
      expect(result.notifications.length).toBe(6);
    });

    it("should notify the user first", async () => {
      const result = await runCommunicationAgent(match, MARIA, CONTACTS, "confirmed");
      expect(result.notifications[0].recipient).toBe(MARIA.name);
      expect(result.notifications[0].method).toBe("Large Text Alert");
      expect(result.notifications[0].status).toBe("sent");
    });

    it("should include the shelter name in user notification", async () => {
      const result = await runCommunicationAgent(match, MARIA, CONTACTS, "confirmed");
      expect(result.notifications[0].message).toContain(match.winner.name);
    });

    it("should include the OEM reference code in user notification", async () => {
      const result = await runCommunicationAgent(match, MARIA, CONTACTS, "confirmed");
      expect(result.notifications[0].message).toContain(OEM_REFERENCE);
    });

    it("should notify emergency contacts", async () => {
      const result = await runCommunicationAgent(match, MARIA, CONTACTS, "confirmed");
      const contactNotifs = result.notifications.filter((n) => n.id.startsWith("notif_contact"));
      expect(contactNotifs.length).toBe(2);
      expect(contactNotifs[0].recipient).toContain("Sarah Alvarez");
      expect(contactNotifs[1].recipient).toContain("James Okafor");
    });

    it("should notify the shelter", async () => {
      const result = await runCommunicationAgent(match, MARIA, CONTACTS, "confirmed");
      const shelterNotif = result.notifications.find((n) => n.id === "notif_shelter");
      expect(shelterNotif).toBeDefined();
      expect(shelterNotif!.recipient).toBe(match.winner.name);
    });

    it("should send OEM confirmation (not escalation) for confirmed evacuation", async () => {
      const result = await runCommunicationAgent(match, MARIA, CONTACTS, "confirmed");
      const oemNotif = result.notifications.find((n) => n.id === "notif_oem");
      expect(oemNotif).toBeDefined();
      expect(oemNotif!.status).toBe("sent");
    });

    it("should include emergency SMS log entry in notifications", async () => {
      const result = await runCommunicationAgent(match, MARIA, CONTACTS, "confirmed");
      const smsNotif = result.notifications.find((n) => n.id === "notif_emergency_sms");
      expect(smsNotif).toBeDefined();
      expect(smsNotif!.recipient).toBe("Travis County Emergency Services");
      expect(smsNotif!.method).toBe("Emergency SMS Packet");
    });
  });

  describe("cannot evacuate", () => {
    it("should escalate OEM notification for cannot-evacuate", async () => {
      const result = await runCommunicationAgent(match, MARIA, CONTACTS, "cannot");
      const oemNotif = result.notifications.find((n) => n.id === "notif_oem");
      expect(oemNotif).toBeDefined();
      expect(oemNotif!.status).toBe("escalated");
      expect(oemNotif!.message).toContain("PRIORITY WELFARE CHECK");
    });

    it("should set evacuationChoice to 'cannot'", async () => {
      const result = await runCommunicationAgent(match, MARIA, CONTACTS, "cannot");
      expect(result.evacuationChoice).toBe("cannot");
    });
  });

  describe("null evacuation choice", () => {
    it("should still generate 6 notifications", async () => {
      const result = await runCommunicationAgent(match, MARIA, CONTACTS, null);
      expect(result.notifications.length).toBe(6);
    });

    it("should default to confirmed evacuation choice", async () => {
      const result = await runCommunicationAgent(match, MARIA, CONTACTS, null);
      expect(result.evacuationChoice).toBe("confirmed");
    });

    it("should send OEM confirmation (default path)", async () => {
      const result = await runCommunicationAgent(match, MARIA, CONTACTS, null);
      const oemNotif = result.notifications.find((n) => n.id === "notif_oem");
      expect(oemNotif!.status).toBe("sent");
    });
  });

  describe("emergencySMS content", () => {
    it("should include Maria's name", async () => {
      const result = await runCommunicationAgent(match, MARIA, CONTACTS, "cannot");
      expect(result.emergencySMS).toContain("Maria Alvarez");
    });

    it("should include STRANDED / cannot self-evacuate context", async () => {
      const result = await runCommunicationAgent(match, MARIA, CONTACTS, "cannot");
      expect(result.emergencySMS).toMatch(/STRANDED|Cannot self-evacuate/i);
    });

    it("should include GPS coordinates and address", async () => {
      const result = await runCommunicationAgent(match, MARIA, CONTACTS, "cannot");
      expect(result.emergencySMS).toContain("30.2672");
      expect(result.emergencySMS).toContain("-97.7431");
      expect(result.emergencySMS).toContain("4821 S Congress Ave");
    });

    it("should include equipment information", async () => {
      const result = await runCommunicationAgent(match, MARIA, CONTACTS, "cannot");
      expect(result.emergencySMS).toMatch(/ventilator/i);
      expect(result.emergencySMS).toMatch(/wheelchair/i);
    });

    it("should include shelter phone number", async () => {
      const result = await runCommunicationAgent(match, MARIA, CONTACTS, "cannot");
      expect(result.emergencySMS).toContain("(512) 555-0311");
    });

    it("should include emergency contacts", async () => {
      const result = await runCommunicationAgent(match, MARIA, CONTACTS, "cannot");
      expect(result.emergencySMS).toContain("Sarah Alvarez");
      expect(result.emergencySMS).toContain("James Okafor");
    });

    it("should include reference code TXV-2847", async () => {
      const result = await runCommunicationAgent(match, MARIA, CONTACTS, "cannot");
      expect(result.emergencySMS).toContain("TXV-2847");
    });

    it("should be stored separately from notification log", async () => {
      const result = await runCommunicationAgent(match, MARIA, CONTACTS, "confirmed");
      // emergencySMS is a separate field, not just a notification message
      expect(result.emergencySMS.length).toBeGreaterThan(100);
      // The notification log entry for SMS is a summary, not the full packet
      const smsNotif = result.notifications.find((n) => n.id === "notif_emergency_sms");
      expect(smsNotif!.message).not.toBe(result.emergencySMS);
    });
  });

  describe("Fallback behavior — Claude API failure", () => {
    it("should return valid CommunicationResult when all Claude calls fail", async () => {
      // fetch is already mocked to reject
      const result = await runCommunicationAgent(match, MARIA, CONTACTS, "confirmed");
      expect(result.notifications.length).toBe(6);
      expect(result.emergencySMS.length).toBeGreaterThan(100);
      expect(result.referenceCode).toBe("TXV-2847");
    });

    it("should use dynamic fallback text with runtime values when fetch fails", async () => {
      const result = await runCommunicationAgent(match, MARIA, CONTACTS, "confirmed");
      // Fallback should contain actual runtime values, not static placeholders
      expect(result.notifications[0].message).toContain(match.winner.name);
      expect(result.emergencySMS).toContain(MARIA.name);
      expect(result.emergencySMS).toContain(match.winner.name);
    });

    it("should use fallback when fetch returns non-ok status", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));
      const result = await runCommunicationAgent(match, MARIA, CONTACTS, "confirmed");
      expect(result.notifications.length).toBe(6);
      expect(result.emergencySMS).toContain("Maria Alvarez");
    });
  });
});
