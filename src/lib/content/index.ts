/**
 * Завантаження юридичних даних. Файли з content/ вбудовуються у збірку
 * (див. плагін contentYaml у vite.config.ts) — під час роботи сайту жодного
 * мережевого запиту не відбувається.
 *
 * Дані вже перевірені схемами Zod у `pnpm validate` перед білдом, тому тут
 * лише типізація, без повторної валідації в браузері.
 */
import type {
  Authority,
  Document,
  FeeRule,
  FinderConfig,
  LegalNote,
  Procedure,
  Source,
  Threshold,
} from './schema';
import finderRaw from '../../../content/ui/finder.yaml';

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

// Файли, що починаються з "_", — шаблони, а не маршрути.
export const procedures = loadAll<Procedure>(
  import.meta.glob(['../../../content/procedures/*.yaml', '!**/_*.yaml'], {
    eager: true,
    import: 'default',
  }),
).sort((a, b) => a.id.localeCompare(b.id));

/** Питання опитувальника: склад і порядок — з content/ui/finder.yaml. */
export const finder = finderRaw as FinderConfig;

export const documents = loadAll<Document>(
  import.meta.glob('../../../content/documents/*.yaml', { eager: true, import: 'default' }),
).sort((a, b) => a.id.localeCompare(b.id));

export const legalNotes = loadAll<LegalNote>(
  import.meta.glob('../../../content/notes/*.yaml', { eager: true, import: 'default' }),
).sort((a, b) => a.id.localeCompare(b.id));

/** Спільні юридичні примітки, що стосуються цього маршруту. */
export function notesForProcedure(procedureId: string): LegalNote[] {
  return legalNotes.filter((n) => n.appliesTo.includes(procedureId));
}

export function documentById(id: string): Document | undefined {
  return documents.find((d) => d.id === id);
}

export function authorityById(id: string): Authority | undefined {
  return authorities.find((a) => a.id === id);
}

export function procedureById(id: string): Procedure | undefined {
  return procedures.find((p) => p.id === id);
}

export function sourceById(id: string): Source | undefined {
  return sources.find((s) => s.id === id);
}
