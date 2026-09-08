/**
 * Гейт перекладів. Запуск: `pnpm validate`.
 * uk і sk рівноправні (CLAUDE.md §2.7): якщо ключ є в одній мові й немає в іншій —
 * білд падає. Порожній рядок теж помилка: він виглядав би як «правило не існує».
 */
import { readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const root = fileURLToPath(new URL('..', import.meta.url));
const site = parse(readFileSync(join(root, 'content/ui/site.yaml'), 'utf8')) as {
  locales: string[];
  nav: Array<{ key: string }>;
};

type Flat = Map<string, string>;

function flatten(value: unknown, prefix = '', acc: Flat = new Map()): Flat {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      flatten(v, prefix ? `${prefix}.${k}` : k, acc);
    }
  } else {
    acc.set(prefix, String(value));
  }
  return acc;
}

const errors: string[] = [];
const bundles = new Map<string, Flat>();

for (const locale of site.locales) {
  const file = join(root, 'src/locales', locale, 'common.json');
  try {
    bundles.set(locale, flatten(JSON.parse(readFileSync(file, 'utf8'))));
  } catch (e) {
    errors.push(`${relative(root, file)}: не читається — ${(e as Error).message}`);
  }
}

const allKeys = new Set<string>();
for (const flat of bundles.values()) for (const key of flat.keys()) allKeys.add(key);

for (const [locale, flat] of bundles) {
  for (const key of allKeys) {
    if (!flat.has(key)) errors.push(`${locale}: немає ключа "${key}"`);
    else if (flat.get(key)!.trim() === '') errors.push(`${locale}: ключ "${key}" порожній`);
  }
}

// Кожне питання опитувальника і кожен варіант відповіді мають підпис в усіх мовах.
// Без цього людина побачила б порожню кнопку замість варіанта.
const finder = parse(readFileSync(join(root, 'content/ui/finder.yaml'), 'utf8')) as {
  steps: Array<{ id: string; field: string; options: string[] }>;
};

for (const step of finder.steps) {
  const needed = [`finder.q.${step.id}`, ...step.options.map((o) => `answer.${step.field}.${o}`)];
  for (const key of needed) {
    for (const [locale, flat] of bundles) {
      if (!flat.has(key)) errors.push(`${locale}: опитувальник — немає ключа "${key}"`);
    }
  }
}

// Кожен пункт меню з content/ui/site.yaml має підпис в усіх мовах.
for (const item of site.nav) {
  for (const [locale, flat] of bundles) {
    if (!flat.has(`nav.${item.key}`)) {
      errors.push(`${locale}: пункт меню "${item.key}" із site.yaml не має підпису nav.${item.key}`);
    }
  }
}

if (errors.length > 0) {
  console.error(`\n✗ Переклади не збігаються (${errors.length}):\n`);
  for (const e of errors) console.error(`  • ${e}`);
  console.error('\nБілд зупинено. CLAUDE.md §2.7: uk і sk рівноправні.\n');
  process.exit(1);
}

console.log(`✓ Переклади збігаються: ${allKeys.size} ключів × ${bundles.size} мов(и).`);
