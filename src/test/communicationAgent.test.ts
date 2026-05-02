import { describe, it, expect } from "vitest";
import { runCommunicationAgent } from "@/agents/communicationAgent";
import { runMatchingAgent } from "@/agents/matchingAgent";
import { MARIA, SHELTERS, CONTACTS, OEM_REFERENCE } from "@/data/demo";

describe("communicationAgent", () => {
  const match = runMatchingAgent(MARIA, SHELTERS, 1);

  describe("confirmed evacuation", () => {
    const notifications = runCommunicationAgent(match, MARIA, CONTACTS, "confirmed");

    it("should generate 5 notifications (user + 2 contacts + shelter + OEM)", () => {
      expect(notifications.length).toBe(5);
    });

    it("should notify the user first", () => {
      expect(notifications[0].recipient).toBe(MARIA.name);
      expect(notifications[0].method).toBe("Large Text Alert");
      expect(notifications[0].status).toBe("sent");
    });

    it("should include the shelter name in user notification", () => {
      expect(notifications[0].message).toContain(match.winner.name);
    });

    it("should include the OEM reference code", () => {
      expect(notifications[0].message).toContain(OEM_REFERENCE);
    });

    it("should notify emergency contacts", () => {
      const contactNotifs = notifications.filter((n) => n.id.startsWith("notif_contact"));
      expect(contactNotifs.length).toBe(2);
      expect(contactNotifs[0].recipient).toContain("Sarah Alvarez");
      expect(contactNotifs[1].recipient).toContain("James Okafor");
    });

    it("should notify the shelter", () => {
      const shelterNotif = notifications.find((n) => n.id === "notif_shelter");
      expect(shelterNotif).toBeDefined();
      expect(shelterNotif!.recipient).toBe(match.winner.name);
      expect(shelterNotif!.message).toContain("Ventilator");
    });

    it("should send OEM confirmation (not escalation) for confirmed evacuation", () => {
      const oemNotif = notifications.find((n) => n.id === "notif_oem");
      expect(oemNotif).toBeDefined();
      expect(oemNotif!.status).toBe("sent");
      expect(oemNotif!.message).toContain("Match confirmed");
    });
  });

  describe("cannot evacuate", () => {
    const notifications = runCommunicationAgent(match, MARIA, CONTACTS, "cannot");

    it("should escalate OEM notification for cannot-evacuate", () => {
      const oemNotif = notifications.find((n) => n.id === "notif_oem");
      expect(oemNotif).toBeDefined();
      expect(oemNotif!.status).toBe("escalated");
      expect(oemNotif!.message).toContain("PRIORITY WELFARE CHECK");
    });
  });

  describe("null evacuation choice", () => {
    const notifications = runCommunicationAgent(match, MARIA, CONTACTS, null);

    it("should still generate 5 notifications", () => {
      expect(notifications.length).toBe(5);
    });

    it("should send OEM confirmation (default path)", () => {
      const oemNotif = notifications.find((n) => n.id === "notif_oem");
      expect(oemNotif!.status).toBe("sent");
    });
  });
});
