/**
 * DemoContext — plain TypeScript state container for the SafeReach demo.
 *
 * Manages the evacuation workflow state: matching phase, match result,
 * notification generation loading state, generated notifications, and
 * the emergency SMS data packet.
 *
 * Requirements: 9.1, 9.2, 9.3
 */

import { MARIA, CONTACTS, SHELTERS } from '../data/demo';
import { runMatchingAgent, type MatchResult } from '../agents/matchingAgent';
import {
  runCommunicationAgent,
  type Notification,
} from '../agents/communicationAgent';

export type DemoMode = 'IDLE' | 'MATCHING' | 'MATCHED';

export interface DemoState {
  mode: DemoMode;
  matchResult: MatchResult | null;
  /** Whether the Communication Agent is currently generating notifications. */
  isGeneratingNotifications: boolean;
  /** Notifications produced by the Communication Agent. */
  notifications: Notification[];
  /** Emergency SMS data packet produced by the Communication Agent. */
  emergencySMS: string;
}

export interface DemoContextType extends DemoState {
  confirmEvacuation: () => Promise<void>;
  reset: () => void;
}

/**
 * Creates a DemoContext instance.
 *
 * The context is a plain object with mutable state and methods. It is
 * intentionally framework-agnostic so it can be tested without React.
 */
export function createDemoContext(): DemoContextType {
  // Internal mutable state
  const state: DemoState = {
    mode: 'IDLE',
    matchResult: null,
    isGeneratingNotifications: false,
    notifications: [],
    emergencySMS: '',
  };

  // Expose state fields as getters so callers always read the latest values
  const ctx: DemoContextType = {
    get mode() {
      return state.mode;
    },
    get matchResult() {
      return state.matchResult;
    },
    get isGeneratingNotifications() {
      return state.isGeneratingNotifications;
    },
    get notifications() {
      return state.notifications;
    },
    get emergencySMS() {
      return state.emergencySMS;
    },

    /**
     * Runs the full evacuation workflow:
     * 1. Runs the Matching Agent synchronously.
     * 2. Sets isGeneratingNotifications = true.
     * 3. Runs the Communication Agent asynchronously.
     * 4. Stores notifications and emergencySMS.
     * 5. Sets isGeneratingNotifications = false.
     *
     * Requirements: 9.2, 9.3
     */
    async confirmEvacuation(): Promise<void> {
      state.mode = 'MATCHING';
      state.isGeneratingNotifications = true;

      const match = await runMatchingAgent(MARIA, SHELTERS, 1);
      state.matchResult = match;
      state.mode = 'MATCHED';

      const result = await runCommunicationAgent(match, MARIA, CONTACTS, 'confirmed');
      state.notifications = result.notifications;
      state.emergencySMS = result.emergencySMS;
      state.isGeneratingNotifications = false;
    },

    reset(): void {
      state.mode = 'IDLE';
      state.matchResult = null;
      state.isGeneratingNotifications = false;
      state.notifications = [];
      state.emergencySMS = '';
    },
  };

  return ctx;
}

export { DemoProvider, useDemo, formatCountdown } from './DemoReactContext';
export type { AppMode, ViewState } from './DemoReactContext';
