/**
 * ProfileScreen — plain TypeScript module for rendering the notification log.
 *
 * Requirements: 9.4, 10.2, 10.3, 10.4
 */

import { type Notification } from '../agents/communicationAgent';

/**
 * Returns the status badge text for a notification.
 * 'sent' → "Sent", 'escalated' → "Escalated"
 */
function statusBadge(status: Notification['status']): string {
  switch (status) {
    case 'sent':
      return 'Sent';
    case 'escalated':
      return 'Escalated';
    default:
      return status;
  }
}

/**
 * Truncates a message to 80 characters, appending '...' if longer.
 */
function truncateMessage(message: string): string {
  if (message.length > 80) {
    return message.substring(0, 80) + '...';
  }
  return message;
}

/**
 * Renders the notification log for the Profile Screen.
 *
 * - When `isGeneratingNotifications` is true: returns a string containing
 *   "⟳ Generating notifications..."
 * - When `isGeneratingNotifications` is false and `notifications` is non-empty:
 *   returns a formatted string with all notification entries.
 * - When `isGeneratingNotifications` is false and `notifications` is empty:
 *   returns an empty string.
 *
 * Each entry format: `[timestamp] [recipient] [STATUS_BADGE] message_preview`
 *
 * Requirements: 9.4, 10.2, 10.3, 10.4
 */
export function renderNotificationLog(
  isGeneratingNotifications: boolean,
  notifications: Notification[]
): string {
  if (isGeneratingNotifications) {
    return '⟳ Generating notifications...';
  }

  if (notifications.length === 0) {
    return '';
  }

  return notifications
    .map((n) => {
      const badge = statusBadge(n.status);
      const preview = truncateMessage(n.message);
      return `[${n.timestamp}] [${n.recipient}] [${badge}] ${preview}`;
    })
    .join('\n');
}
