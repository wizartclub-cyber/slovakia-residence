import { describe, expect, it } from 'vitest';
import { daysUntil, earliestIssueDate, parseIsoDate } from '../../src/lib/content/dates.ts';

describe('розбір дати', () => {
  it.each([
    ['2026-06-01', true],
    ['2026-13-01', true],
    ['01.06.2026', false],
    ['2026-6-1', false],
    ['', false],
  ])('%s → розібрано: %s', (input, ok) => {
    expect(parseIsoDate(input) !== null).toBe(ok);
  });
});

describe('найраніша дата видачі документа', () => {
  const cases: Array<[string, number, string]> = [
    ['2026-06-01', 90, '2026-03-03'],
    ['2026-06-01', 30, '2026-05-02'],
    ['2026-06-01', 180, '2025-12-03'],
    // Перехід через кінець року і через 29 лютого високосного 2028-го.
    ['2026-01-10', 90, '2025-10-12'],
    ['2028-03-05', 30, '2028-02-04'],
  ];

  it.each(cases)('подання %s, строк %i днів → не раніше %s', (submission, days, expected) => {
    expect(earliestIssueDate(submission, days)).toBe(expected);
  });

  it('на некоректній даті повертає null, а не вигадану дату', () => {
    expect(earliestIssueDate('колись', 90)).toBeNull();
  });
});

describe('скільки днів лишилося', () => {
  it.each([
    ['2026-06-01', '2026-06-01', 0],
    ['2026-06-10', '2026-06-01', 9],
    ['2026-05-30', '2026-06-01', -2],
  ])('до %s від %s → %i', (submission, today, expected) => {
    expect(daysUntil(submission, today)).toBe(expected);
  });
});
