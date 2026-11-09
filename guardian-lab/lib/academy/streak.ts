const DAY = 86_400_000;
function day(date: Date) {
  return Math.floor((date.getTime() + 7 * 3_600_000) / DAY);
}
export function learningStreak(
  streak: number,
  last: Date | null,
  now = new Date(),
  record = false,
) {
  const gap = last ? day(now) - day(last) : Number.POSITIVE_INFINITY;
  if (!record) return gap <= 1 ? streak : 0;
  return gap === 0 ? Math.max(1, streak) : gap === 1 ? streak + 1 : 1;
}
