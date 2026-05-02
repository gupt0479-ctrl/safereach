/**
 * Unit tests for `callClaude` (tested indirectly via `runCommunicationAgent`)
 *
 * Requirements: 7.5, 7.6
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

describe("callClaude — tested via runCommunicationAgent", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns fallback on non-2xx HTTP response (status 500)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeResponse(500, {})));

    const result = await runCommunicationAgent(
      testMatch,
      testUser,
      CONTACTS,
      "confirmed",
    );

    for (const notification of result.notifications) {
      expect(notification.message.length).toBeGreaterThan(0);
    }
    expect(result.emergencySMS.length).toBeGreaterThan(0);
  });

  it("returns fallback on network error (fetch throws)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network failure")),
    );

    const result = await runCommunicationAgent(
      testMatch,
      testUser,
      CONTACTS,
      "confirmed",
    );

    for (const notification of result.notifications) {
      expect(notification.message.length).toBeGreaterThan(0);
    }
    expect(result.emergencySMS.length).toBeGreaterThan(0);
  });

  it("returns fallback when response has no text block in content array", async () => {
    const bodyWithNoTextBlock = {
      content: [{ type: "tool_use", id: "tool_1", name: "some_tool", input: {} }],
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(makeResponse(200, bodyWithNoTextBlock)),
    );

    const result = await runCommunicationAgent(
      testMatch,
      testUser,
      CONTACTS,
      "confirmed",
    );

    for (const notification of result.notifications) {
      expect(notification.message.length).toBeGreaterThan(0);
    }
    expect(result.emergencySMS.length).toBeGreaterThan(0);
  });

  it("returns trimmed text on successful 2xx response with a text block", async () => {
    const claudeText = "  This is the Claude-generated message.  ";
    const expectedText = claudeText.trim();

    const successBody = { content: [{ type: "text", text: claudeText }] };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(makeResponse(200, successBody)),
    );

    const result = await runCommunicationAgent(
      testMatch,
      testUser,
      CONTACTS,
      "confirmed",
    );

    for (const notification of result.notifications) {
      expect(notification.message).toBe(expectedText);
    }
    expect(result.emergencySMS).toBe(expectedText);
  });
});
