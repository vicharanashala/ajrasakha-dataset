/**
 * Returns a human-readable "hours ago" string for the question count tooltip.
 *
 * Logic:
 * - After 3 AM today → hours elapsed since today at 3:00 AM IST
 * - Before 3 AM today → hours elapsed since yesterday at 3:00 AM IST
 */
export function getQuestionCountTooltipText(): string {
  const now = new Date();

  const today3am = new Date(now);
  today3am.setHours(3, 0, 0, 0);

  const yesterday3am = new Date(today3am);
  yesterday3am.setDate(today3am.getDate() - 1);

  const reference = now >= today3am ? today3am : yesterday3am;
  const diffMs = now.getTime() - reference.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  const hourLabel = hours === 1 ? 'hour' : 'hours';

  if (minutes < 5) {
    return `${hours} ${hourLabel} ago`;
  }
  return `${hours} ${hourLabel} ${minutes} mins ago`;
}