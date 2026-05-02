/**
 * Integration tests for DemoContext loading state.
 *
 * Validates that:
 * - isGeneratingNotifications is true while the Communication Agent is running
 * - isGeneratingNotifications is false after the agent completes
 * - notifications and emergencySMS are populated after the agent completes
 *
 * Requirements: 9.1, 9.2, 9.3
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createDemoContext } from '../DemoContext';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal Response-like object that fetch would return. */
function makeResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DemoContext — loading state (Requirements 9.1, 9.2, 9.3)', () => {
  beforeEach(() => {
    // Mock fetch to return HTTP 500 — forces all callClaude calls to use
    // hardcoded fallback strings. This keeps tests fast and deterministic.
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeResponse(500, {})));
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('isGeneratingNotifications is true while the Communication Agent is running', async () => {
    // Requirements: 9.2
    const ctx = createDemoContext();

    // Capture the value of isGeneratingNotifications mid-flight by intercepting
    // the runCommunicationAgent call. We do this by replacing fetch with a
    // promise that we control, so we can inspect state before it resolves.
    let resolveAgent!: (value: Response) => void;
    const agentPromise = new Promise<Response>((resolve) => {
      resolveAgent = resolve;
    });

    vi.stubGlobal(
      'fetch',
      vi.fn().mockReturnValue(agentPromise)
    );

    // Start confirmEvacuation but don't await it yet
    const evacuationPromise = ctx.confirmEvacuation();

    // Yield to the microtask queue so confirmEvacuation can run up to the
    // first await (runCommunicationAgent → fetch)
    await Promise.resolve();
    await Promise.resolve();

    // At this point the agent is awaiting fetch — isGeneratingNotifications
    // should be true
    expect(ctx.isGeneratingNotifications).toBe(true);

    // Now resolve the fetch with a 500 so the agent falls back and completes
    resolveAgent(makeResponse(500, {}));
    await evacuationPromise;
  });

  it('isGeneratingNotifications is false after the Communication Agent completes', async () => {
    // Requirements: 9.3
    const ctx = createDemoContext();

    await ctx.confirmEvacuation();

    expect(ctx.isGeneratingNotifications).toBe(false);
  });

  it('notifications array is populated after the Communication Agent completes', async () => {
    // Requirements: 9.1, 9.3
    const ctx = createDemoContext();

    expect(ctx.notifications).toHaveLength(0);

    await ctx.confirmEvacuation();

    expect(ctx.notifications.length).toBeGreaterThan(0);
    expect(ctx.notifications).toHaveLength(6);
  });

  it('emergencySMS is populated after the Communication Agent completes', async () => {
    // Requirements: 9.1, 9.3
    const ctx = createDemoContext();

    expect(ctx.emergencySMS).toBe('');

    await ctx.confirmEvacuation();

    expect(ctx.emergencySMS.length).toBeGreaterThan(0);
  });

  it('notifications and emergencySMS start at their default values', () => {
    // Requirements: 9.1
    const ctx = createDemoContext();

    expect(ctx.isGeneratingNotifications).toBe(false);
    expect(ctx.notifications).toEqual([]);
    expect(ctx.emergencySMS).toBe('');
  });
});
