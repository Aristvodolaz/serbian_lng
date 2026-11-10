// Anki-lite SM-2: pure scheduling math for word review, kept free of DB or
// framework imports so the interval rules are unit-testable in isolation.

export enum Grade {
  AGAIN = 'again',
  HARD = 'hard',
  GOOD = 'good',
  EASY = 'easy',
}

export const DEFAULT_EASE = 2.5;
const MIN_EASE = 1.3;
const MAX_EASE = 2.8;

const DAY_MS = 24 * 60 * 60 * 1000;
export const RELEARN_INTERVAL_MS = 10 * 60 * 1000;
export const MIN_INTERVAL_MS = RELEARN_INTERVAL_MS;
export const MAX_INTERVAL_MS = 365 * DAY_MS;

// First successful review bases for GOOD / EASY when the word has no
// established interval yet (new or relearning item).
const GOOD_BASE_MS = DAY_MS;
const EASY_BASE_MS = 3 * DAY_MS;
const HARD_FACTOR = 1.2;
const EASY_BONUS = 1.3;

export function nextEase(ease: number, grade: Grade): number {
  const delta =
    grade === Grade.AGAIN ? -0.2 : grade === Grade.HARD ? -0.15 : grade === Grade.EASY ? 0.15 : 0;
  return Math.min(MAX_EASE, Math.max(MIN_EASE, ease + delta));
}

export function nextIntervalMs(currentMs: number, ease: number, grade: Grade): number {
  let interval: number;
  const established = currentMs > 0;

  switch (grade) {
    case Grade.AGAIN:
      interval = RELEARN_INTERVAL_MS;
      break;
    case Grade.HARD:
      interval = Math.max(currentMs, DAY_MS) * HARD_FACTOR;
      break;
    case Grade.GOOD:
      interval = established ? currentMs * ease : GOOD_BASE_MS;
      break;
    case Grade.EASY:
      interval = established ? currentMs * ease * EASY_BONUS : EASY_BASE_MS;
      break;
  }

  if (interval > DAY_MS) interval = Math.round(interval / (60 * 60 * 1000)) * 60 * 60 * 1000;
  return Math.min(MAX_INTERVAL_MS, Math.max(MIN_INTERVAL_MS, interval));
}
