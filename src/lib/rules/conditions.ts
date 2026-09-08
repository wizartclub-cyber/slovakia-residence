/**
 * Обчислення умов у тризначній логіці.
 *
 * Чому три значення, а не два: якщо людина не відповіла на питання, ми не
 * знаємо, виконана умова чи ні. Вважати це за «ні» означало б тихо ховати
 * маршрути, які насправді можуть підійти. Тому «не знаю» — окреме значення,
 * і воно доходить до інтерфейсу як «потрібна додаткова відповідь».
 */
import type { Answers, Condition, Truth } from './types';

export function evaluateCondition(condition: Condition, answers: Answers): Truth {
  if ('all' in condition) {
    const parts = condition.all.map((c) => evaluateCondition(c, answers));
    if (parts.includes('no')) return 'no';
    return parts.includes('unknown') ? 'unknown' : 'yes';
  }

  if ('any' in condition) {
    const parts = condition.any.map((c) => evaluateCondition(c, answers));
    if (parts.includes('yes')) return 'yes';
    return parts.includes('unknown') ? 'unknown' : 'no';
  }

  if ('not' in condition) {
    const inner = evaluateCondition(condition.not, answers);
    if (inner === 'unknown') return 'unknown';
    return inner === 'yes' ? 'no' : 'yes';
  }

  // Часові умови завжди визначені: дата оцінки обов'язкова.
  if ('onOrAfter' in condition) return answers.asOfDate >= condition.onOrAfter ? 'yes' : 'no';
  if ('before' in condition) return answers.asOfDate < condition.before ? 'yes' : 'no';

  const value = answers[condition.field];
  if (value === undefined) return 'unknown';

  if ('equals' in condition) return value === condition.equals ? 'yes' : 'no';
  return condition.in.includes(value) ? 'yes' : 'no';
}

/** Чи покривають часові межі маршруту дату оцінки. */
export function isInForce(
  validFrom: string,
  validTo: string | null,
  asOfDate: string,
): boolean {
  return validFrom <= asOfDate && (validTo === null || asOfDate <= validTo);
}
