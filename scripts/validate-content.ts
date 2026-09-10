/**
 * Гейт контенту. Запуск: `pnpm validate`.
 * Перевіряє юридичні дані в content/**\/*.yaml і зупиняє збірку, якщо:
 *  - файл не відповідає схемі зі spec §7 (є зайве або відсутнє поле);
 *  - запис посилається на джерело, якого немає в реєстрі;
 *  - маршрут зі статусом published не має юриста (reviewer/reviewedAt);
 *  - правило вже не діє на дату baseline (validTo раніше за baseline).
 * Файли, що починаються з "_", ігноруються — це шаблони.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import type { ZodTypeAny } from 'zod';
import {
  AuthoritySchema,
  FinderConfigSchema,
  LegalNoteSchema,
  DocumentSchema,
  FeeRuleSchema,
  ProcedureSchema,
  SiteConfigSchema,
  SourceSchema,
  ThresholdSchema,
  FaqSchema,
} from '../src/lib/content/schema.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const REGISTRY = join(root, 'document-registry-v0.4.yaml');
const CONTENT = join(root, 'content');

const SCHEMAS: Record<string, ZodTypeAny> = {
  procedures: ProcedureSchema,
  documents: DocumentSchema,
  fees: FeeRuleSchema,
  sources: SourceSchema,
  thresholds: ThresholdSchema,
  authorities: AuthoritySchema,
  notes: LegalNoteSchema,
  faq: FaqSchema,
};

const errors: string[] = [];
const fail = (file: string, message: string) => errors.push(`${file}: ${message}`);

// Зібрані під час обходу id — щоб перевірити посилання між файлами (spec §10).
const declaredIds: Record<string, Set<string>> = {
  authorities: new Set(),
  fees: new Set(),
  procedures: new Set(),
  documents: new Set(),
  thresholds: new Set(),
};
const references: Array<{ file: string; field: string; kind: string; id: string }> = [];

const REFERENCE_FIELDS: Record<string, string> = {
  appliesTo: 'procedures',
  authorityIds: 'authorities',
  feeRuleIds: 'fees',
  documentIds: 'documents',
  relatedProcedureIds: 'procedures',
  routeIds: 'procedures',
};

function walk(dir: string): string[] {
  if (!safeStat(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return walk(full);
    return name.endsWith('.yaml') || name.endsWith('.yml') ? [full] : [];
  });
}

function safeStat(p: string) {
  try {
    return statSync(p);
  } catch {
    return null;
  }
}

function readYaml(file: string): unknown {
  return parse(readFileSync(file, 'utf8'));
}

// --- 1. Реєстр джерел: які id взагалі дозволені -------------------------------
const registry = readYaml(REGISTRY) as { resources?: Array<{ id?: string }> };
const knownSourceIds = new Set((registry.resources ?? []).map((r) => r.id).filter(Boolean));
if (knownSourceIds.size === 0) fail('document-registry-v0.4.yaml', 'реєстр порожній');

// --- 2. Конфігурація сайту ----------------------------------------------------
const siteFile = join(CONTENT, 'ui', 'site.yaml');
const siteParsed = SiteConfigSchema.safeParse(readYaml(siteFile));
if (!siteParsed.success) {
  for (const issue of siteParsed.error.issues) {
    fail(relative(root, siteFile), `${issue.path.join('.') || '(корінь)'} — ${issue.message}`);
  }
}
const baseline = siteParsed.success ? siteParsed.data.legalBaseline.date : null;

const finderFile = join(CONTENT, 'ui', 'finder.yaml');
const finderParsed = FinderConfigSchema.safeParse(readYaml(finderFile));
if (!finderParsed.success) {
  for (const issue of finderParsed.error.issues) {
    fail(relative(root, finderFile), `${issue.path.join('.') || '(корінь)'} — ${issue.message}`);
  }
}

// --- 3. Юридичні дані ---------------------------------------------------------
let checked = 0;

for (const [folder, schema] of Object.entries(SCHEMAS)) {
  for (const file of walk(join(CONTENT, folder))) {
    const rel = relative(root, file);
    if (basename(file).startsWith('_')) continue;

    let raw: unknown;
    try {
      raw = readYaml(file);
    } catch (e) {
      fail(rel, `не читається як YAML — ${(e as Error).message}`);
      continue;
    }

    // Файл може містити один запис або список записів (зручно для зборів).
    const entries = Array.isArray(raw) ? raw : [raw];
    const valid: Array<Record<string, unknown>> = [];
    let broken = false;

    for (const [i, entry] of entries.entries()) {
      const where = Array.isArray(raw) ? `[${i}]` : '';
      const parsed = schema.safeParse(entry);
      if (!parsed.success) {
        broken = true;
        for (const issue of parsed.error.issues) {
          fail(rel, `${where}${issue.path.join('.') || '(корінь)'} — ${issue.message}`);
        }
        continue;
      }
      valid.push(parsed.data as Record<string, unknown>);
    }
    if (broken) continue;
    checked += valid.length;

    for (const data of valid) {

      // 3a. Кожне джерело має існувати в реєстрі (CLAUDE.md §2.2).
      for (const id of collectSourceIds(data)) {
        if (!knownSourceIds.has(id)) {
          fail(rel, `джерело "${id}" відсутнє в document-registry-v0.4.yaml`);
        }
      }

      // 3b. published без юриста — заборонено (CLAUDE.md §2.3).
      if (data.reviewStatus === 'published' || data.reviewStatus === 'legally_reviewed') {
        if (!data.reviewer) fail(rel, `статус "${String(data.reviewStatus)}" без поля reviewer`);
        if (!data.reviewedAt) fail(rel, `статус "${String(data.reviewStatus)}" без дати reviewedAt`);
      }

      // 3c. Запам'ятовуємо id і посилання, щоб звірити їх після обходу всіх файлів.
      if (typeof data.id === 'string') declaredIds[folder]?.add(data.id);
      // Порогові посилання лежать усередині документів, тому збираються окремо.
      if (Array.isArray(data.thresholds)) {
        for (const ref of data.thresholds) {
          const id = (ref as { thresholdId?: unknown }).thresholdId;
          if (typeof id === 'string') {
            references.push({ file: rel, field: 'thresholds.thresholdId', kind: 'thresholds', id });
          }
        }
      }

      for (const [field, kind] of Object.entries(REFERENCE_FIELDS)) {
        const value = data[field];
        if (Array.isArray(value)) {
          for (const id of value) {
            if (typeof id === 'string') references.push({ file: rel, field, kind, id });
          }
        }
      }

      // 3c-bis. FAQ: застаріла відповідь має ламати збірку, а не тихо зникати
      // з сайту (ТЗ FAQ §3.4). Мовчазне приховування створює ілюзію повноти.
      if (folder === 'faq') {
        if (data.reviewStatus === 'superseded' || data.reviewStatus === 'blocked') {
          fail(rel, `статус «${String(data.reviewStatus)}» — відповідь застаріла, оновіть або приберіть`);
        }
        if (data.reviewStatus !== 'draft' && !data.reviewedAt) {
          fail(rel, 'опублікована відповідь без reviewedAt — ТЗ FAQ §3.4');
        }
      }

      // 3d. Правило, що вже не діє на дату baseline (spec §10).
      if (baseline && typeof data.validTo === 'string' && data.validTo < baseline) {
        fail(rel, `validTo (${data.validTo}) раніший за baseline ${baseline}`);
      }
    }
  }
}

// --- 4. Посилання між файлами -------------------------------------------------
for (const ref of references) {
  if (!declaredIds[ref.kind]?.has(ref.id)) {
    fail(ref.file, `${ref.field}: "${ref.id}" — такого запису немає в content/${ref.kind}/`);
  }
}

function collectSourceIds(value: unknown, acc: string[] = []): string[] {
  if (Array.isArray(value)) {
    for (const item of value) collectSourceIds(item, acc);
  } else if (value && typeof value === 'object') {
    for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
      if ((key === 'sourceIds' || key === 'formSourceIds') && Array.isArray(v)) {
        acc.push(...v.filter((x) => typeof x === 'string'));
      }
      else collectSourceIds(v, acc);
    }
  }
  return acc;
}

// --- 5. Підсумок --------------------------------------------------------------
if (errors.length > 0) {
  console.error(`\n✗ Контент не пройшов перевірку (${errors.length}):\n`);
  for (const e of errors) console.error(`  • ${e}`);
  console.error('\nБілд зупинено. Порожнє поле краще за вигадане: див. CLAUDE.md §2.\n');
  process.exit(1);
}

console.log(`✓ Контент валідний: ${checked} файл(ів), ${knownSourceIds.size} джерел у реєстрі.`);
