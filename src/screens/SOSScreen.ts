/**
 * SOSScreen — plain TypeScript module for rendering the emergency SMS card.
 *
 * Requirements: 9.5, 10.1
 */

/**
 * Renders the emergency SMS card for the SOS Screen.
 *
 * - When `isGeneratingNotifications` is true: returns a grey shimmer skeleton
 *   placeholder string.
 * - When `isGeneratingNotifications` is false and `emergencySMS` is non-empty:
 *   returns a formatted card string with the SMS text verbatim, styled with
 *   monospace font, dark navy background, amber left border, and white text.
 * - When `isGeneratingNotifications` is false and `emergencySMS` is empty:
 *   returns an empty string.
 *
 * Requirements: 9.5, 10.1
 */
export function renderEmergencySMSCard(
  isGeneratingNotifications: boolean,
  emergencySMS: string
): string {
  if (isGeneratingNotifications) {
    return '[LOADING: grey shimmer skeleton]';
  }

  if (!emergencySMS) {
    return '';
  }

  const border = '─'.repeat(43);
  return [
    `┌${border}┐`,
    `│ [EMERGENCY SMS — monospace, dark navy, amber border, white text]`,
    `│ ${emergencySMS.split('\n').join('\n│ ')}`,
    `└${border}┘`,
  ].join('\n');
}
