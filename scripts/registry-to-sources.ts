/**
 * Реєстр → дані сайту. Запуск: `pnpm sources:build`.
 *
 * Перетворює document-registry-v0.4.yaml на content/sources/<id>.yaml у формі
 * spec §7 (Source). Це чисте перетворення: скрипт нічого не вигадує і не
 * підвищує статус перевірки. Якщо в реєстрі поля немає — у результаті буде null.
 *
 * Правити треба реєстр, а не content/sources/*.yaml: файли перезаписуються.
 */
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, stringify } from 'yaml';
import { SourceSchema } from '../src/lib/content/schema.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const OUT = join(root, 'content/sources');

type RegistryResource = {
  id: string;
  type: string;
  authority: string;
  title?: string;
  url?: string | null;
  pinnedUrl?: string | null;
  staticUrl?: string | null;
  formCode?: string | null;
  completionLanguage?: string | null;
  locale?: string | null;
  validFrom?: string | null;
  validTo?: string | null;
  reviewStatus?: string;
  potentiallyStale?: boolean;
  notes?: string | null;
  addedNote?: string | null;
  urlCheck?: { checkedAt?: string; observed?: string } | null;
  snapshot?: { ok?: boolean; sha256?: string; snapshotPath?: string; obtainedManually?: boolean } | null;
};

// Типи ресурсів у реєстрі описують формат файлу; sourceType зі spec §7 описує
// доказову роль джерела. Одне в друге переводиться тут, а не «на око» в даних.
const SOURCE_TYPE: Record<string, string> = {
  statute: 'legislation',
  statute_amendment: 'legislation',
  statutory_annex: 'legislation',
  implementing_regulation: 'implementing_regulation',
  official_guidance_html: 'official_web_guidance',
  official_forms_page: 'official_web_guidance',
  official_form_pdf: 'official_form',
  official_form_doc: 'official_form',
  official_form_docx: 'official_form',
  secondary_guidance: 'secondary_explanatory_source',
};

const registry = parse(readFileSync(join(root, 'document-registry-v0.4.yaml'), 'utf8')) as {
  resources: RegistryResource[];
};

// «slovlex-404-2011» → «404/2011». Тільки з id, який сам побудований із номера закону.
function lawNumberFrom(id: string): string | null {
  const m = /-(\d{1,4})-(\d{4})$/.exec(id);
  return m ? `${m[1]}/${m[2]}` : null;
}

mkdirSync(OUT, { recursive: true });
for (const stale of readdirSync(OUT)) {
  if (stale.endsWith('.yaml')) rmSync(join(OUT, stale));
}

const problems: string[] = [];
let written = 0;

for (const res of registry.resources) {
  const sourceType = SOURCE_TYPE[res.type];
  if (!sourceType) {
    problems.push(`${res.id}: невідомий тип ресурсу "${res.type}" — додай його в SOURCE_TYPE`);
    continue;
  }

  const snapshotOk = res.snapshot?.ok === true;

  const source = {
    id: res.id,
    authority: res.authority,
    title: res.title ?? null,
    url: res.url ?? null,
    pinnedUrl: res.pinnedUrl ?? null,
    staticUrl: res.staticUrl ?? null,
    formCode: res.formCode ?? null,
    completionLanguage: res.completionLanguage ?? null,
    // Статус зі spec §7. Скрипт ставить лише draft: підвищити до source_verified
    // може тільки людина, яка подивилася на збережений файл (CLAUDE.md §2.3).
    reviewStatus: 'draft',
    registryStatus: res.reviewStatus ?? 'fetch_pending',
    potentiallyStale: res.potentiallyStale ?? false,
    evidence: res.urlCheck?.observed ?? null,
    notes: res.notes ?? res.addedNote ?? null,
    locale: res.locale ?? null,
    lawNumber: lawNumberFrom(res.id),
    provision: null,
    publicationDate: null,
    effectiveFrom: res.validFrom ?? null,
    effectiveTo: res.validTo ?? null,
    checkedAt: res.urlCheck?.checkedAt ?? null,
    sourceType,
    snapshotPath: snapshotOk ? (res.snapshot?.snapshotPath ?? null) : null,
    sha256: snapshotOk ? (res.snapshot?.sha256 ?? null) : null,
  };

  const parsed = SourceSchema.safeParse(source);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      problems.push(`${res.id}: ${issue.path.join('.') || '(корінь)'} — ${issue.message}`);
    }
    continue;
  }

  const header =
    '# ЗГЕНЕРОВАНО з document-registry-v0.4.yaml — не редагувати руками.\n' +
    '# Правити реєстр, потім `pnpm sources:build`.\n';
  writeFileSync(join(OUT, `${res.id}.yaml`), header + stringify(source, { lineWidth: 110 }));
  written += 1;
}

if (problems.length > 0) {
  console.error(`\n✗ Реєстр не перетворюється (${problems.length}):\n`);
  for (const p of problems) console.error(`  • ${p}`);
  process.exit(1);
}

console.log(`✓ content/sources: ${written} файл(ів) із ${registry.resources.length} записів реєстру.`);
