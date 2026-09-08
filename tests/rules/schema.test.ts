/**
 * Схеми умов — це гейт від описок. Умова з неправильним значенням не «не
 * спрацює тихо», а зупинить збірку.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { ConditionSchema, ProcedureSchema } from '../../src/lib/content/schema.ts';

describe('умови в даних', () => {
  const good = [
    { field: 'citizenshipGroup', equals: 'third_country' },
    { field: 'purpose', in: ['employment', 'business'] },
    { all: [{ onOrAfter: '2026-07-15' }, { not: { field: 'location', equals: 'abroad' } }] },
    { any: [{ before: '2026-10-01' }] },
  ];

  it.each(good)('приймає коректну умову %#', (condition) => {
    expect(ConditionSchema.safeParse(condition).success).toBe(true);
  });

  const bad: Array<[string, unknown]> = [
    ['описка в значенні', { field: 'citizenshipGroup', equals: 'third-country' }],
    ['неіснуюче поле', { field: 'passportNumber', equals: 'AB123456' }],
    ['значення з іншого поля', { field: 'purpose', equals: 'abroad' }],
    ['одне зі списку помилкове', { field: 'purpose', in: ['employment', 'emploiment'] }],
    ['дата в іншому форматі', { onOrAfter: '15.07.2026' }],
    ['порожній all', { all: [] }],
    ['зайве поле поряд з умовою', { field: 'purpose', equals: 'employment', maybe: true }],
  ];

  it.each(bad)('відхиляє: %s', (_name, condition) => {
    expect(ConditionSchema.safeParse(condition).success).toBe(false);
  });
});

describe('шаблон маршруту', () => {
  it('відповідає схемі — інакше з нього копіювали б поламані маршрути', () => {
    const root = fileURLToPath(new URL('../..', import.meta.url));
    const raw = parse(
      readFileSync(`${root}content/procedures/_TEMPLATE.procedure.yaml`, 'utf8'),
    );
    const parsed = ProcedureSchema.safeParse(raw);
    expect(parsed.success ? [] : parsed.error.issues.map((i) => i.message)).toEqual([]);
  });
});

describe('правила придатності', () => {
  const withoutSource = {
    id: 'x',
    category: 'B',
    title: { uk: 'a', sk: 'b' },
    validFrom: '2026-07-15',
    reviewStatus: 'draft',
    sourceIds: ['slovlex-404-2011'],
    eligibilityRules: [
      { id: 'r', effect: 'require', when: { field: 'purpose', equals: 'employment' }, sourceIds: [] },
    ],
  };

  it('правило без джерела не приймається (CLAUDE.md §2.2)', () => {
    expect(ProcedureSchema.safeParse(withoutSource).success).toBe(false);
  });

  it('невідомий вид дії правила не приймається', () => {
    const bad = {
      ...withoutSource,
      eligibilityRules: [
        {
          id: 'r',
          effect: 'maybe',
          when: { field: 'purpose', equals: 'employment' },
          sourceIds: ['slovlex-404-2011'],
        },
      ],
    };
    expect(ProcedureSchema.safeParse(bad).success).toBe(false);
  });
});
