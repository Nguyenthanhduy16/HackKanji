export type ReviewRating = 'again' | 'hard' | 'good' | 'easy';
export type CardStatus = 'learning' | 'reviewing' | 'mastered';
export interface Schedule {
  ease: number;
  interval: number;
  repetitions: number;
  lapses: number;
  dueAt: number;
  lastReviewedAt: number | null;
}
export const DAY_MS = 86_400_000;
export function newSchedule(now = Date.now()): Schedule {
  return { ease: 2.5, interval: 0, repetitions: 0, lapses: 0, dueAt: now, lastReviewedAt: null };
}
export function isDue(schedule: Schedule, now = Date.now()): boolean {
  return schedule.dueAt <= now;
}
// Four-button SM-2: quality 1/3/4/5, one-minute relearning for Again.
export function scheduleReview(previous: Schedule, rating: ReviewRating, now = Date.now()): Schedule {
  const quality = { again: 1, hard: 3, good: 4, easy: 5 }[rating];
  const ease = Math.max(1.3, previous.ease + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (rating === 'again') return {
    ...previous, ease, interval: 0, repetitions: 0, lapses: previous.lapses + 1,
    dueAt: now + 60_000, lastReviewedAt: now,
  };
  let interval = previous.repetitions === 0 ? 1 : previous.repetitions === 1 ? 6 : Math.round(previous.interval * previous.ease);
  if (rating === 'hard') interval = previous.repetitions === 0 ? 1 : Math.max(previous.interval + 1, Math.round(previous.interval * 1.2));
  if (rating === 'easy') interval = Math.max(4, Math.round(interval * 1.3));
  interval = Math.min(36_500, interval);
  return { ...previous, ease, repetitions: previous.repetitions + 1, interval, dueAt: now + interval * DAY_MS, lastReviewedAt: now };
}
export function cardStatus(schedule: Schedule): CardStatus {
  return schedule.interval >= 21 && schedule.repetitions >= 3 ? 'mastered' : schedule.repetitions >= 2 ? 'reviewing' : 'learning';
}
