/**
 * Завантаження юридичних даних. Файли з content/ вбудовуються у збірку
 * (див. плагін contentYaml у vite.config.ts) — під час роботи сайту жодного
 * мережевого запиту не відбувається.
 *
 * Дані вже перевірені схемами Zod у `pnpm validate` перед білдом, тому тут
 * лише типізація, без повторної валідації в браузері.
 */
import type { Authority, FeeRule, Source, Threshold } from './schema';

function loadAll<T>(modules: Record<string, unknown>): T[] {
  return Object.values(modules).flatMap((m) => (Array.isArray(m) ? (m as T[]) : [m as T]));
}

export const sources = loadAll<Source>(
  import.meta.glob('../../../content/sources/*.yaml', { eager: true, import: 'default' }),
).sort((a, b) => a.id.localeCompare(b.id));

export const authorities = loadAll<Authority>(
  import.meta.glob('../../../content/authorities/*.yaml', { eager: true, import: 'default' }),
).sort((a, b) => a.id.localeCompare(b.id));

export const fees = loadAll<FeeRule>(
  import.meta.glob('../../../content/fees/*.yaml', { eager: true, import: 'default' }),
);

export const thresholds = loadAll<Threshold>(
  import.meta.glob('../../../content/thresholds/*.yaml', { eager: true, import: 'default' }),
);

export function sourceById(id: string): Source | undefined {
  return sources.find((s) => s.id === id);
}
