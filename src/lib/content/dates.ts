/**
 * Розрахунок найранішої дати, коли документ ще буде чинним на день подання.
 *
 * Чисті функції без React — щоб їх можна було перевірити тестами. Це
 * арифметика з даними закону про строк давності, а не юридична порада:
 * орган може вимагати інакше, і це має бути сказано в інтерфейсі.
 */

/** Дата у форматі РРРР-ММ-ДД → мітка часу в UTC (щоб не зсувало часовим поясом). */
export function parseIsoDate(iso: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const ts = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(ts) ? null : ts;
}

export function formatIsoDate(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10);
}

/**
 * Найраніша дата видачі документа, щоб на день подання він не був старшим
 * за `maxAgeDays`. Наприклад, для 90 днів і подання 01.06 це 03.03.
 */
export function earliestIssueDate(submissionIso: string, maxAgeDays: number): string | null {
  const ts = parseIsoDate(submissionIso);
  if (ts === null) return null;
  return formatIsoDate(ts - maxAgeDays * 24 * 60 * 60 * 1000);
}

/** Скільки днів лишилося від сьогодні до дати подання (від'ємне — вона в минулому). */
export function daysUntil(submissionIso: string, todayIso: string): number | null {
  const a = parseIsoDate(submissionIso);
  const b = parseIsoDate(todayIso);
  if (a === null || b === null) return null;
  return Math.round((a - b) / (24 * 60 * 60 * 1000));
}
