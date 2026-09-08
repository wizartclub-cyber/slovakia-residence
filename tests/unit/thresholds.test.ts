import { describe, expect, it } from 'vitest';
import { derivedAmount, thresholdOn } from '../../src/lib/content/thresholds.ts';
import { thresholds } from '../../src/lib/content/index.ts';

const ZIVOTNE_MINIMUM = 295.22;

describe('похідні суми від життєвого мінімуму', () => {
  // Очікувані значення — spec §5A.
  it.each([
    [12, 3542.64],
    [20, 5904.4],
    [100, 29522],
  ])('%i × 295.22 = %f', (multiplier, expected) => {
    expect(derivedAmount(ZIVOTNE_MINIMUM, multiplier)).toBe(expected);
  });

  it('не накопичує похибку дробових чисел', () => {
    // 295.22 * 3 у float дає 885.6600000000001 — округлення до центів обов'язкове.
    expect(derivedAmount(ZIVOTNE_MINIMUM, 3)).toBe(885.66);
  });
});

describe('поріг на дату', () => {
  const list = [
    {
      id: 'test',
      baseValue: 100,
      unit: 'EUR/month',
      multiplier: null,
      formula: null,
      validFrom: '2026-07-01',
      validTo: '2026-12-31',
      sourceIds: ['x'],
      notes: null,
    },
  ];

  it.each([
    ['2026-06-30', false],
    ['2026-07-01', true],
    ['2026-09-08', true],
    ['2026-12-31', true],
    ['2027-01-01', false],
  ])('%s → знайдено: %s', (date, found) => {
    expect(thresholdOn(list, 'test', date) !== undefined).toBe(found);
  });
});

describe('дані порогів у content/', () => {
  it('життєвий мінімум для дорослого — 295.22 EUR/month від 01.07.2026', () => {
    const zm = thresholdOn(thresholds, 'zivotne-minimum-adult', '2026-09-01');
    expect(zm?.baseValue).toBe(ZIVOTNE_MINIMUM);
    expect(zm?.unit).toBe('EUR/month');
  });

  it('похідні суми в даних не зберігаються — тільки базова величина', () => {
    for (const t of thresholds) {
      expect(t.multiplier).toBeNull();
    }
  });
});
