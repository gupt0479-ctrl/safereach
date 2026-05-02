import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { runCommunicationAgent } from "@/agents/communicationAgent";
import { runMatchingAgent } from "@/agents/matchingAgent";
import { MARIA, SHELTERS, CONTACTS, OEM_REFERENCE } from "@/data/demo";

function makeResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

describe("communicationAgent", () => {
  const match = runMatchingAgent(MARIA, SHELTERS, 1);

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeResponse(500, {})));
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("confirmed evacuation", () => {
    it("should generate 5 notifications (user + 2 contacts + shelter + OEM)", async () => {
      const result = await runCommunicationAgent(
        match,
        MARIA,
        CONTACTS,
        "confirmed",
      );
      expect(result.notifications).toHaveLength(5);
    });

    it("should notify the user first", async () => {
      const result = await runCommunicationAgent(
        match,
        MARIA,
        CONTACTS,
        "confirmed",
      );
      expect(result.notifications[0].recipient).toBe(MARIA.name);
      expect(result.notifications[0].method).toBe(MARIA.commMode);
      expect(result.notifications[0].status).toBe("sent");
    });

    it("should use the correct reference code", async () => {
      const result = await runCommunicationAgent(
        match,
        MARIA,
        CONTACTS,
        "confirmed",
      );
      expect(result.referenceCode).toBe(OEM_REFERENCE);
    });

    it("should notify emergency contacts with correct recipients", async () => {
      const result = await runCommunicationAgent(
        match,
        MARIA,
        CONTACTS,
        "confirmed",
      );
      expect(result.notifications[1].recipient).toBe(CONTACTS[0].name);
      expect(result.notifications[2].recipient).toBe(CONTACTS[1].name);
    });

    it("should notify the shelter", async () => {
      const result = await runCommunicationAgent(
        match,
        MARIA,
        CONTACTS,
        "confirmed",
      );
      const shelterNotif = result.notifications.find(
        (n) => n.id === "notif_shelter",
      );
      expect(shelterNotif).toBeDefined();
      expect(shelterNotif!.recipient).toBe(match.winner.name);
    });

    it("should send OEM confirmation (not escalation) for confirmed evacuation", async () => {
      const result = await runCommunicationAgent(
        match,
        MARIA,
        CONTACTS,
        "confirmed",
      );
      const oemNotif = result.notifications.find((n) => n.id === "notif_oem");
      expect(oemNotif).toBeDefined();
      expect(oemNotif!.status).toBe("sent");
    });

    it("should include emergencySMS data packet", async () => {
      const result = await runCommunicationAgent(
        match,
        MARIA,
        CONTACTS,
        "confirmed",
      );
      expect(result.emergencySMS.length).toBeGreaterThan(100);
    });
  });

  describe("cannot evacuate", () => {
    it("should escalate OEM notification for cannot-evacuate", async () => {
      const result = await runCommunicationAgent(
        match,
        MARIA,
        CONTACTS,
        "cannot",
      );
      const oemNotif = result.notifications.find((n) => n.id === "notif_oem");
      expect(oemNotif).toBeDefined();
      expect(oemNotif!.status).toBe("escalated");
    });
  });

  describe("null evacuation choice", () => {
    it("should still generate 5 notifications", async () => {
      const result = await runCommunicationAgent(match, MARIA, CONTACTS, null);
      expect(result.notifications).toHaveLength(5);
    });

    it("should send OEM confirmation (default path)", async () => {
      const result = await runCommunicationAgent(match, MARIA, CONTACTS, null);
      const oemNotif = result.notifications.find((n) => n.id === "notif_oem");
      expect(oemNotif!.status).toBe("sent");
    });
  });
});
