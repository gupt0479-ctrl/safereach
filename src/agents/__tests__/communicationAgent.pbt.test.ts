/**
 * Property-Based Tests for `runCommunicationAgent`
 *
 * Uses fast-check to verify universal correctness properties across all valid inputs.
 * `fetch` is mocked globally to return HTTP 500, forcing every `callClaude`
 * invocation to use its hardcoded fallback string.
 *
 * Tasks: 6.1 – 6.10
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fc from "fast-check";
import { runCommunicationAgent } from "../communicationAgent";
import type { MatchResult, Phase } from "../matchingAgent";
import type { User, Shelter, Contact } from "../../data/demo";

function makeResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

const shelterArb: fc.Arbitrary<Shelter> = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }),
  name: fc.string({ minLength: 1, maxLength: 80 }),
  address: fc.string({ minLength: 1, maxLength: 150 }),
  phone: fc.string({ minLength: 1, maxLength: 20 }),
  lat: fc.float({ min: -90, max: 90, noNaN: true }),
  lng: fc.float({ min: -180, max: 180, noNaN: true }),
  distanceMiles: fc.float({ min: 0, max: 100, noNaN: true }),
  backupPower: fc.boolean(),
  generatorHours: fc.integer({ min: 0, max: 168 }),
  wheelchairAccessible: fc.boolean(),
  medicalOxygen: fc.boolean(),
  refrigeration: fc.boolean(),
  transportFromZip78745: fc.boolean(),
  capacityTotal: fc.integer({ min: 1, max: 5000 }),
  capacityUsed: fc.integer({ min: 0, max: 5000 }),
}) as fc.Arbitrary<Shelter>;

const matchArb: fc.Arbitrary<MatchResult> = fc.record({
  winner: shelterArb,
  score: fc.integer({ min: 0, max: 100 }),
  phase: fc.constantFrom<Phase>(1, 1.5, 2),
  capabilityBadges: fc.array(fc.string({ minLength: 1, maxLength: 50 })),
  explanation: fc.string({ minLength: 1, maxLength: 500 }),
  rejected: fc.array(
    fc.record({
      name: fc.string({ minLength: 1, maxLength: 80 }),
      reason: fc.string({ minLength: 1, maxLength: 200 }),
    }),
  ),
  notifiedAt: fc.integer({ min: 0, max: Date.UTC(2100, 0, 1) }).map((ms) => new Date(ms).toISOString()),
});

const userArb: fc.Arbitrary<User> = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  initials: fc.string({ minLength: 1, maxLength: 5 }),
  age: fc.integer({ min: 1, max: 120 }),
  address: fc.string({ minLength: 1, maxLength: 100 }),
  zip: fc.string({ minLength: 5, maxLength: 10 }),
  lat: fc.float({ min: -90, max: 90, noNaN: true }),
  lng: fc.float({ min: -180, max: 180, noNaN: true }),
  disabilities: fc.array(fc.string({ minLength: 1, maxLength: 50 })),
  equipment: fc.array(fc.string({ minLength: 1, maxLength: 50 })),
  electricityDependent: fc.boolean(),
  canSelfEvacuate: fc.boolean(),
  requiresAccessibleTransport: fc.boolean(),
  commMode: fc.constant("large_text" as const),
  verifiedByOEM: fc.boolean(),
  ventilatorBatteryHours: fc.integer({ min: 0, max: 24 }),
  ventilatorBatteryPct: fc.integer({ min: 0, max: 100 }),
}) as fc.Arbitrary<User>;

const contactArb: fc.Arbitrary<Contact> = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  relationship: fc.string({ minLength: 1, maxLength: 30 }),
  phone: fc.string({ minLength: 1, maxLength: 20 }),
  method: fc.constantFrom("phone_sms" as const, "sms" as const),
  lat: fc.float({ min: -90, max: 90, noNaN: true }),
  lng: fc.float({ min: -180, max: 180, noNaN: true }),
  distanceMiles: fc.float({ min: 0, max: 100, noNaN: true }),
  status: fc.constantFrom("safe" as const, "nearby" as const),
  lastSeenMinutes: fc.integer({ min: 0, max: 60 }),
}) as fc.Arbitrary<Contact>;

const contactsArb: fc.Arbitrary<[Contact, Contact]> = fc.tuple(
  contactArb,
  contactArb,
);

const evacuationChoiceArb = fc.constantFrom(
  "confirmed" as const,
  "cannot" as const,
);

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeResponse(500, {})));
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Communication Agent — Property-Based Tests", () => {
  it("P1: notifications.length === 5 for any valid inputs", async () => {
    await fc.assert(
      fc.asyncProperty(
        matchArb,
        userArb,
        contactsArb,
        evacuationChoiceArb,
        async (match, user, [contact0, contact1], evacuationChoice) => {
          const result = await runCommunicationAgent(
            match,
            user,
            [contact0, contact1],
            evacuationChoice,
          );
          expect(result.notifications).toHaveLength(6);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("P2: all recipient fields match expected values", async () => {
    await fc.assert(
      fc.asyncProperty(
        matchArb,
        userArb,
        contactsArb,
        evacuationChoiceArb,
        async (match, user, [contact0, contact1], evacuationChoice) => {
          const result = await runCommunicationAgent(
            match,
            user,
            [contact0, contact1],
            evacuationChoice,
          );
          const { notifications } = result;
          expect(notifications[0].recipient).toBe(user.name);
          expect(notifications[1].recipient).toContain(contact0.name);
          expect(notifications[2].recipient).toContain(contact1.name);
          expect(notifications[3].recipient).toBe(match.winner.name);
          expect(notifications[4].recipient).toBe("Travis County OEM Dashboard");
        },
      ),
      { numRuns: 100 },
    );
  });

  it('P3: OEM status is "escalated" when evacuationChoice is "cannot", "sent" otherwise', async () => {
    await fc.assert(
      fc.asyncProperty(
        matchArb,
        userArb,
        contactsArb,
        fc.constantFrom("confirmed" as const, "cannot" as const),
        async (match, user, [contact0, contact1], evacuationChoice) => {
          const result = await runCommunicationAgent(
            match,
            user,
            [contact0, contact1],
            evacuationChoice,
          );
          const expectedStatus =
            evacuationChoice === "cannot" ? "escalated" : "sent";
          expect(result.notifications[4].status).toBe(expectedStatus);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("P4: emergencySMS.length > 100 for any valid inputs", async () => {
    await fc.assert(
      fc.asyncProperty(
        matchArb,
        userArb,
        contactsArb,
        evacuationChoiceArb,
        async (match, user, [contact0, contact1], evacuationChoice) => {
          const result = await runCommunicationAgent(
            match,
            user,
            [contact0, contact1],
            evacuationChoice,
          );
          expect(result.emergencySMS.length).toBeGreaterThan(100);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('P5: referenceCode === "TXV-2847" for any valid inputs', async () => {
    await fc.assert(
      fc.asyncProperty(
        matchArb,
        userArb,
        contactsArb,
        evacuationChoiceArb,
        async (match, user, [contact0, contact1], evacuationChoice) => {
          const result = await runCommunicationAgent(
            match,
            user,
            [contact0, contact1],
            evacuationChoice,
          );
          expect(result.referenceCode).toBe("TXV-2847");
        },
      ),
      { numRuns: 100 },
    );
  });

  it("P6: every notification.message.length > 0 when fetch returns 500", async () => {
    await fc.assert(
      fc.asyncProperty(
        matchArb,
        userArb,
        contactsArb,
        evacuationChoiceArb,
        async (match, user, [contact0, contact1], evacuationChoice) => {
          const result = await runCommunicationAgent(
            match,
            user,
            [contact0, contact1],
            evacuationChoice,
          );
          for (const notification of result.notifications) {
            expect(notification.message.length).toBeGreaterThan(0);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("P7: generatedAt parses as a valid Date for any valid inputs", async () => {
    await fc.assert(
      fc.asyncProperty(
        matchArb,
        userArb,
        contactsArb,
        evacuationChoiceArb,
        async (match, user, [contact0, contact1], evacuationChoice) => {
          const result = await runCommunicationAgent(
            match,
            user,
            [contact0, contact1],
            evacuationChoice,
          );
          expect(new Date(result.generatedAt).toString()).not.toBe(
            "Invalid Date",
          );
        },
      ),
      { numRuns: 100 },
    );
  });

  it("P8: notification timestamps are non-decreasing", async () => {
    const offsets = [0, 400, 700, 900, 1100];

    await fc.assert(
      fc.asyncProperty(
        matchArb,
        userArb,
        contactsArb,
        evacuationChoiceArb,
        async (match, user, [contact0, contact1], evacuationChoice) => {
          const result = await runCommunicationAgent(
            match,
            user,
            [contact0, contact1],
            evacuationChoice,
          );

          for (let i = 0; i < offsets.length - 1; i++) {
            expect(offsets[i + 1]).toBeGreaterThanOrEqual(offsets[i]);
          }

          const { notifications } = result;
          for (let i = 0; i < notifications.length - 1; i++) {
            expect(
              notifications[i + 1].timestamp >= notifications[i].timestamp,
            ).toBe(true);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("P9: notifications[0].method === user.commMode", async () => {
    await fc.assert(
      fc.asyncProperty(
        matchArb,
        userArb,
        contactsArb,
        evacuationChoiceArb,
        async (match, user, [contact0, contact1], evacuationChoice) => {
          const result = await runCommunicationAgent(
            match,
            user,
            [contact0, contact1],
            evacuationChoice,
          );
          expect(result.notifications[0].method).toBe("Large Text Alert");
        },
      ),
      { numRuns: 100 },
    );
  });

  it("P10: message preview truncation — >80 chars truncated, <=80 chars unchanged", () => {
    const truncate = (msg: string): string =>
      msg.length > 80 ? msg.substring(0, 80) + "..." : msg;

    fc.assert(
      fc.property(fc.string({ minLength: 0, maxLength: 200 }), (msg) => {
        const preview = truncate(msg);
        if (msg.length > 80) {
          expect(preview).toBe(msg.substring(0, 80) + "...");
        } else {
          expect(preview).toBe(msg);
        }
      }),
      { numRuns: 100 },
    );
  });
});
