/**
 * Unit tests for SOSScreen.renderEmergencySMSCard
 *
 * Requirements: 9.5, 10.1
 */

import { describe, it, expect } from 'vitest';
import { renderEmergencySMSCard } from '../SOSScreen';

describe('renderEmergencySMSCard', () => {
  // Task 10.1 — loading state (Requirement 9.5)
  it('returns a grey shimmer skeleton when isGeneratingNotifications is true', () => {
    const result = renderEmergencySMSCard(true, '');
    expect(result.toLowerCase()).toMatch(/shimmer|loading/);
  });

  it('returns shimmer skeleton even when emergencySMS is non-empty while generating', () => {
    const result = renderEmergencySMSCard(true, 'TRAVIS COUNTY EMERGENCY SERVICES — DATA PACKET');
    expect(result.toLowerCase()).toMatch(/shimmer|loading/);
    // Should NOT render the SMS content while loading
    expect(result).not.toContain('TRAVIS COUNTY');
  });

  // Task 10.2 — completed state with non-empty SMS (Requirement 10.1)
  it('returns empty string when not generating and emergencySMS is empty', () => {
    const result = renderEmergencySMSCard(false, '');
    expect(result).toBe('');
  });

  it('renders emergencySMS verbatim in the card', () => {
    const sms = 'TRAVIS COUNTY EMERGENCY SERVICES — DATA PACKET\nEVACUEE: Maria Garcia';
    const result = renderEmergencySMSCard(false, sms);
    expect(result).toContain('TRAVIS COUNTY EMERGENCY SERVICES — DATA PACKET');
    expect(result).toContain('EVACUEE: Maria Garcia');
  });

  it('card output contains amber border style indicator', () => {
    const sms = 'Test emergency message';
    const result = renderEmergencySMSCard(false, sms);
    expect(result.toLowerCase()).toContain('amber');
  });

  it('card output contains dark background style indicator', () => {
    const sms = 'Test emergency message';
    const result = renderEmergencySMSCard(false, sms);
    // "dark navy" or "dark" should appear in the card header
    expect(result.toLowerCase()).toMatch(/dark|navy/);
  });

  it('card output contains monospace font style indicator', () => {
    const sms = 'Test emergency message';
    const result = renderEmergencySMSCard(false, sms);
    expect(result.toLowerCase()).toContain('monospace');
  });

  it('card output contains white text style indicator', () => {
    const sms = 'Test emergency message';
    const result = renderEmergencySMSCard(false, sms);
    expect(result.toLowerCase()).toContain('white');
  });

  it('renders a multi-line SMS verbatim with all lines present', () => {
    const sms = [
      'TRAVIS COUNTY EMERGENCY SERVICES — DATA PACKET',
      'EVACUEE: Maria Garcia | Age: 67 | Mobility: wheelchair',
      'SHELTER: Austin Convention Center Shelter',
      'MEDICAL: oxygen concentrator, insulin',
      'REF: TXV-2847',
    ].join('\n');

    const result = renderEmergencySMSCard(false, sms);

    expect(result).toContain('TRAVIS COUNTY EMERGENCY SERVICES — DATA PACKET');
    expect(result).toContain('EVACUEE: Maria Garcia | Age: 67 | Mobility: wheelchair');
    expect(result).toContain('SHELTER: Austin Convention Center Shelter');
    expect(result).toContain('MEDICAL: oxygen concentrator, insulin');
    expect(result).toContain('REF: TXV-2847');
  });

  it('card has a visible border structure (box-drawing characters)', () => {
    const sms = 'Emergency data';
    const result = renderEmergencySMSCard(false, sms);
    // Should contain box-drawing characters for the card border
    expect(result).toMatch(/[┌└│─]/);
  });
});
