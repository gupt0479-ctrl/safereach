/**
 * Unit tests for `runCommunicationAgent`
 *
 * Requirements: 1.1, 1.3, 5.3, 5.4
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { runCommunicationAgent } from "../communicationAgent";
import type { MatchResult } from "../matchingAgent";
import type { User } from "../../data/demo";
import { CONTACTS } from "../../data/demo";

const testMatch: MatchResult = {
  winner: {
    id: "shelter_test",
    name: "Austin Convention Center Shelter",
    address: "500 E Cesar Chavez St, Austin, TX 78701",
    phone: "(512) 555-0100",
    lat: 30.2627,
    lng: -97.7404,
    distanceMiles: 3.5,
    backupPower: true,
    generatorHours: 72,
    wheelchairAccessible: true,
    medicalOxygen: true,
    refrigeration: true,
    transportFromZip78745: true,
    capacityTotal: 500,
    capacityUsed: 100,
  },
  score: 95,
  phase: 1,
  capabilityBadges: ["⚡ Backup Generator", "♿ Fully Accessible"],
  explanation: "Best match for medical and mobility needs.",
  rejected: [],
  notifiedAt: new Date().toISOString(),
};

const testUser: User = {
  id: "user_test",
  name: "Maria Gonzalez",
  initials: "M",
  age: 72,
  address: "Austin, TX 78745",
  zip: "78745",
  lat: 30.2187,
  lng: -97.7992,
  disabilities: ["mobility", "respiratory"],
  equipment: ["wheelchair", "oxygen concentrator"],
  electricityDependent: false,
  canSelfEvacuate: false,
  requiresAccessibleTransport: true,
  commMode: "large_text",
  verifiedByOEM: true,
  ventilatorBatteryHours: 0,
  ventilatorBatteryPct: 0,
};

function makeResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

describe("runCommunicationAgent", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeResponse(500, {})));
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns exactly 6 notifications", async () => {
    const result = await runCommunicationAgent(
      testMatch,
      testUser,
      CONTACTS,
      "confirmed",
    );
    expect(result.notifications).toHaveLength(6);
  });

  it('sets notif_oem.status to "escalated" when evacuationChoice is "cannot"', async () => {
    const result = await runCommunicationAgent(
      testMatch,
      testUser,
      CONTACTS,
      "cannot",
    );
    const oemNotif = result.notifications.find((n) => n.id === "notif_oem");
    expect(oemNotif).toBeDefined();
    expect(oemNotif!.status).toBe("escalated");
  });

  it('sets notif_oem.status to "sent" when evacuationChoice is "confirmed"', async () => {
    const result = await runCommunicationAgent(
      testMatch,
      testUser,
      CONTACTS,
      "confirmed",
    );
    const oemNotif = result.notifications.find((n) => n.id === "notif_oem");
    expect(oemNotif).toBeDefined();
    expect(oemNotif!.status).toBe("sent");
  });

  it('returns referenceCode === "TXV-2847"', async () => {
    const result = await runCommunicationAgent(
      testMatch,
      testUser,
      CONTACTS,
      "confirmed",
    );
    expect(result.referenceCode).toBe("TXV-2847");
  });

  it("returns a valid ISO string for generatedAt", async () => {
    const result = await runCommunicationAgent(
      testMatch,
      testUser,
      CONTACTS,
      "confirmed",
    );
    const parsed = new Date(result.generatedAt);
    expect(parsed.toString()).not.toBe("Invalid Date");
    expect(result.generatedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
    );
  });
});
