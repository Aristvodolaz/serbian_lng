import {
  Grade,
  RELEARN_INTERVAL_MS,
  MAX_INTERVAL_MS,
  nextEase,
  nextIntervalMs,
  nextStatus,
} from './srs';

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

describe('nextEase', () => {
  it.each([
    [Grade.AGAIN, 2.5, 2.3],
    [Grade.HARD, 2.5, 2.35],
    [Grade.GOOD, 2.5, 2.5],
    [Grade.EASY, 2.5, 2.65],
  ])('%s applies the right ease delta', (grade, ease, expected) => {
    expect(nextEase(ease, grade)).toBeCloseTo(expected, 5);
  });

  it('clamps ease to [1.3, 2.8]', () => {
    expect(nextEase(1.4, Grade.AGAIN)).toBe(1.3);
    expect(nextEase(2.75, Grade.EASY)).toBe(2.8);
  });
});

describe('nextIntervalMs', () => {
  it('AGAIN always relearns in 10 minutes', () => {
    expect(nextIntervalMs(0, 2.5, Grade.AGAIN)).toBe(RELEARN_INTERVAL_MS);
    expect(nextIntervalMs(30 * DAY_MS, 2.5, Grade.AGAIN)).toBe(RELEARN_INTERVAL_MS);
  });

  it('HARD uses max(current, 1 day) * 1.2', () => {
    expect(nextIntervalMs(10 * DAY_MS, 2.5, Grade.HARD)).toBe(12 * DAY_MS);
  });

  it('GOOD on a new word bases on 1 day', () => {
    expect(nextIntervalMs(0, 2.5, Grade.GOOD)).toBe(DAY_MS);
  });

  it('GOOD multiplies the previous interval by ease', () => {
    expect(nextIntervalMs(10 * DAY_MS, 2.5, Grade.GOOD)).toBe(25 * DAY_MS);
  });

  it('EASY on a new word bases on 3 days', () => {
    expect(nextIntervalMs(0, 2.5, Grade.EASY)).toBe(3 * DAY_MS);
  });

  it('EASY multiplies by ease * 1.3', () => {
    expect(nextIntervalMs(10 * DAY_MS, 2.5, Grade.EASY)).toBeCloseTo(32.5 * DAY_MS, 5);
  });

  it('rounds intervals over one day to whole hours', () => {
    // 1 day * 1.2 = 28.8h -> 29h
    expect(nextIntervalMs(0, 2.5, Grade.HARD)).toBe(29 * HOUR_MS);
  });

  it('clamps to the 365 day maximum', () => {
    expect(nextIntervalMs(400 * DAY_MS, 2.8, Grade.EASY)).toBe(MAX_INTERVAL_MS);
  });

  it('graduates a learning word to the base interval on GOOD/EASY', () => {
    // A word that lapsed into learning still carries an old interval value;
    // the graduation must ignore it, not multiply it.
    expect(nextIntervalMs(30 * DAY_MS, 2.5, Grade.GOOD, true)).toBe(DAY_MS);
    expect(nextIntervalMs(30 * DAY_MS, 2.5, Grade.EASY, true)).toBe(3 * DAY_MS);
  });

  it('HARD on a learning word holds the 1-day step instead of scaling', () => {
    expect(nextIntervalMs(RELEARN_INTERVAL_MS, 2.5, Grade.HARD, true)).toBe(DAY_MS);
  });
});

describe('nextStatus', () => {
  it('AGAIN sends the word back to learning', () => {
    expect(nextStatus('known', Grade.AGAIN)).toBe('learning');
  });

  it('GOOD/EASY graduate a learning word to known', () => {
    expect(nextStatus('learning', Grade.GOOD)).toBe('known');
    expect(nextStatus('learning', Grade.EASY)).toBe('known');
  });

  it('HARD keeps the current status', () => {
    expect(nextStatus('learning', Grade.HARD)).toBe('learning');
    expect(nextStatus('known', Grade.HARD)).toBe('known');
  });
});
