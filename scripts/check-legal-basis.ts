/**
 * Гейт посилань на закон. Запуск: `pnpm validate`.
 *
 * Бере кожне посилання з наших даних (`legalBasis`, `tariffItem`) і перевіряє,
 * що така стаття або позиція тарифу справді є в збереженій копії закону.
 * Посилання на неіснуючу норму людина не перевірить — це має ловити машина.
 *
 * Перевіряються тільки ті закони, копії яких уже зняті. Для решти посилання
 * пропускаються з попередженням, а не вважаються помилкою.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { loadStatute, parseReference, type Statute } from './lib/statute.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const CONTENT = join(root, 'content');

type Resource = { id: string; lawNumber?: string | null; snapshot?: { ok?: boolean; snapshotPath?: string } | null };

const registry = parse(readFileSync(join(root, 'document-registry-v0.4.yaml'), 'utf8')) as {
  resources: Resource[];
};

// Номер закону → розібрана копія тексту.
const statutes = new Map<string, Statute>();
const lawFromId = (id: string) => {
  const m = /-(\d{1,4})-(\d{4})$/.exec(id);
  return m ? `${m[1]}/${m[2]}` : null;
};

for (const res of registry.resources) {
  const law = res.lawNumber ?? lawFromId(res.id);
  const path = res.snapshot?.ok ? res.snapshot.snapshotPath : null;
  if (!law || !path || statutes.has(law)) continue;
  try {
    statutes.set(law, loadStatute(join(root, path)));
  } catch {
    // копія недоступна — просто не перевіряємо цей закон
  }
}

const errors: string[] = [];
const skipped = new Set<string>();
let checked = 0;

function walk(dir: string): string[] {
  try {
    statSync(dir);
  } catch {
    return [];
  }
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return walk(full);
    return name.endsWith('.yaml') && !name.startsWith('_') ? [full] : [];
  });
}

function checkReference(file: string, field: string, raw: string) {
  const ref = parseReference(raw);
  if (!ref) return;

  const statute = statutes.get(ref.law);
  if (!statute) {
    skipped.add(ref.law);
    return;
  }

  checked += 1;
  const pool = ref.kind === 'section' ? statute.sections : statute.tariffItems;
  if (!pool.has(ref.value)) {
    const what = ref.kind === 'section' ? `§${ref.value}` : `položka ${ref.value}`;
    errors.push(`${file}: ${field} — ${what} немає в тексті закону ${ref.law}`);
  }
}

function collect(value: unknown, file: string, field = '') {
  if (typeof value === 'string') {
    if (field === 'legalBasis' || field === 'tariffItem') checkReference(file, field, value);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collect(item, file, field);
    return;
  }
  if (value && typeof value === 'object') {
    for (const [key, v] of Object.entries(value as Record<string, unknown>)) collect(v, file, key);
  }
}

for (const file of walk(CONTENT)) {
  collect(parse(readFileSync(file, 'utf8')), relative(root, file));
}

if (errors.length > 0) {
  console.error(`\n✗ Посилання на закон не підтверджуються (${errors.length}):\n`);
  for (const e of errors) console.error(`  • ${e}`);
  console.error('\nБілд зупинено. Посилання на неіснуючу норму гірше за відсутність посилання.\n');
  process.exit(1);
}

const note = skipped.size > 0 ? ` (без копії, не перевірено: ${[...skipped].join(', ')})` : '';
console.log(`✓ Посилання на закон: ${checked} перевірено проти збережених копій${note}.`);
