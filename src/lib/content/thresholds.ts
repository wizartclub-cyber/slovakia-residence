/**
 * Похідні суми від базової величини (spec §5A).
 *
 * Життєвий мінімум змінюється щороку, тому в даних зберігається лише базова
 * сума, а «12 × мінімум» рахується тут. Якби похідні числа лежали в даних,
 * після зміни мінімуму вони мовчки лишилися б застарілими.
 *
 * Чисті функції, без React — щоб їх можна було перевірити тестами (spec §10).
 */
import type { Threshold } from './schema';

/** base × multiplier, округлено до центів. */
export function derivedAmount(baseValue: number, multiplier: number): number {
  return Math.round(baseValue * multiplier * 100) / 100;
}

/** Поріг, що діяв на вказану дату (РРРР-ММ-ДД). */
export function thresholdOn(list: Threshold[], id: string, isoDate: string): Threshold | undefined {
  return list.find(
    (t) =>
      t.id === id && t.validFrom <= isoDate && (t.validTo === null || t.validTo >= isoDate),
  );
}

/**
 * Сума для конкретного маршруту. Множник задає норма закону, а не наш вибір:
  * показувати число без прив'язки до норми заборонено (spec §5A).
 */
export function requiredAmount(threshold: Threshold, multiplier: number): number {
  return derivedAmount(threshold.baseValue, multiplier);
}
