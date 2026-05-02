/**
 * Unit tests for ProfileScreen.renderNotificationLog
 *
 * Requirements: 9.4, 10.2, 10.3, 10.4
 */

import { describe, it, expect } from 'vitest';
import { renderNotificationLog } from '../ProfileScreen';
import { type Notification } from '../../agents/communicationAgent';

// Helper to build a minimal Notification
function makeNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: 'notif_test',
    timestamp: '02:15 PM',
    recipient: 'Test Recipient',
    method: 'SMS',
    message: 'Short message',
    status: 'sent',
    ...overrides,
  };
}

describe('renderNotificationLog', () => {
  // Task 9.1 — loading state
  it('returns a string containing "⟳ Generating notifications..." when isGeneratingNotifications is true', () => {
    const result = renderNotificationLog(true, []);
    expect(result).toContain('⟳ Generating notifications...');
  });

  it('returns loading text even when notifications array is non-empty while generating', () => {
    const notifications = [makeNotification()];
    const result = renderNotificationLog(true, notifications);
    expect(result).toContain('⟳ Generating notifications...');
  });

  // Task 9.2 — completed state with notifications
  it('returns empty string when not generating and notifications is empty', () => {
    const result = renderNotificationLog(false, []);
    expect(result).toBe('');
  });

  it('renders all 5 notification entries when completed state has 5 notifications', () => {
    const notifications: Notification[] = [
      makeNotification({ id: 'notif_user', recipient: 'Maria Garcia', timestamp: '02:15 PM', status: 'sent', message: 'Alert for Maria' }),
      makeNotification({ id: 'notif_sarah', recipient: 'Sarah Gonzalez', timestamp: '02:16 PM', status: 'sent', message: 'Contact message for Sarah' }),
      makeNotification({ id: 'notif_james', recipient: 'James Carter', timestamp: '02:16 PM', status: 'sent', message: 'Contact message for James' }),
      makeNotification({ id: 'notif_shelter', recipient: 'Austin Convention Center Shelter', timestamp: '02:17 PM', status: 'sent', message: 'Intake notification for shelter' }),
      makeNotification({ id: 'notif_oem', recipient: 'Travis County OEM Dashboard', timestamp: '02:17 PM', status: 'sent', message: 'OEM flag message' }),
    ];

    const result = renderNotificationLog(false, notifications);
    const lines = result.split('\n');

    expect(lines).toHaveLength(5);
    expect(result).toContain('Maria Garcia');
    expect(result).toContain('Sarah Gonzalez');
    expect(result).toContain('James Carter');
    expect(result).toContain('Austin Convention Center Shelter');
    expect(result).toContain('Travis County OEM Dashboard');
  });

  // Task 9.2 — message truncation (Property 10)
  it('truncates messages longer than 80 chars with "..."', () => {
    const longMessage = 'A'.repeat(100); // 100 chars
    const notification = makeNotification({ message: longMessage });
    const result = renderNotificationLog(false, [notification]);

    const expectedPreview = 'A'.repeat(80) + '...';
    expect(result).toContain(expectedPreview);
    // Should NOT contain the full 100-char message
    expect(result).not.toContain('A'.repeat(100));
  });

  it('does not truncate messages of exactly 80 chars', () => {
    const exactMessage = 'B'.repeat(80);
    const notification = makeNotification({ message: exactMessage });
    const result = renderNotificationLog(false, [notification]);

    expect(result).toContain(exactMessage);
    expect(result).not.toContain(exactMessage + '...');
  });

  it('does not truncate messages shorter than 80 chars', () => {
    const shortMessage = 'Hello, this is a short message.';
    const notification = makeNotification({ message: shortMessage });
    const result = renderNotificationLog(false, [notification]);

    expect(result).toContain(shortMessage);
    expect(result).not.toContain(shortMessage + '...');
  });

  // Task 9.2 — status badges (Requirements 10.3, 10.4)
  it('renders "Sent" badge for status === "sent"', () => {
    const notification = makeNotification({ status: 'sent' });
    const result = renderNotificationLog(false, [notification]);

    expect(result).toContain('[Sent]');
  });

  it('renders "Escalated" badge for status === "escalated"', () => {
    const notification = makeNotification({ status: 'escalated' });
    const result = renderNotificationLog(false, [notification]);

    expect(result).toContain('[Escalated]');
  });

  // Entry format verification
  it('formats each entry as [timestamp] [recipient] [badge] preview', () => {
    const notification = makeNotification({
      timestamp: '03:00 PM',
      recipient: 'Test Person',
      status: 'sent',
      message: 'Test message content',
    });
    const result = renderNotificationLog(false, [notification]);

    expect(result).toBe('[03:00 PM] [Test Person] [Sent] Test message content');
  });

  it('separates multiple entries with newlines', () => {
    const notifications = [
      makeNotification({ id: 'n1', recipient: 'Alice', timestamp: '01:00 PM', status: 'sent', message: 'Msg 1' }),
      makeNotification({ id: 'n2', recipient: 'Bob', timestamp: '01:01 PM', status: 'escalated', message: 'Msg 2' }),
    ];
    const result = renderNotificationLog(false, notifications);
    const lines = result.split('\n');

    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain('Alice');
    expect(lines[1]).toContain('Bob');
  });
});
