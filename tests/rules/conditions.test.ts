import { describe, expect, it } from 'vitest';
import { evaluateCondition, isInForce } from '../../src/lib/rules/conditions.ts';
import type { Answers, Condition, Truth } from '../../src/lib/rules/types.ts';

const base: Answers = { asOfDate: '2026-09-08' };
const known: Answers = { asOfDate: '2026-09-08', citizenshipGroup: 'third_country', purpose: 'study' };

const yes: Condition = { field: 'citizenshipGroup', equals: 'third_country' };
const no: Condition = { field: 'citizenshipGroup', equals: 'eu_eea_ch' };
const unknown: Condition = { field: 'location', equals: 'abroad' };

describe('тризначна логіка', () => {
  const cases: Array<[string, Condition, Answers, Truth]> = [
    ['відповідь збігається', yes, known, 'yes'],
    ['відповідь не збігається', no, known, 'no'],
    ['відповіді немає', unknown, known, 'unknown'],
    ['all: усі так', { all: [yes, { field: 'purpose', equals: 'study' }] }, known, 'yes'],
    ['all: одне ні переважає невідоме', { all: [no, unknown] }, known, 'no'],
    ['all: невідоме робить усе невідомим', { all: [yes, unknown] }, known, 'unknown'],
    ['any: одне так достатньо', { any: [no, yes] }, known, 'yes'],
    ['any: так переважає невідоме', { any: [unknown, yes] }, known, 'yes'],
    ['any: усі ні', { any: [no, { field: 'purpose', equals: 'family' }] }, known, 'no'],
    ['any: невідоме без жодного так', { any: [no, unknown] }, known, 'unknown'],
    ['not так → ні', { not: yes }, known, 'no'],
    ['not ні → так', { not: no }, known, 'yes'],
    ['not невідоме лишається невідомим', { not: unknown }, known, 'unknown'],
    ['in: значення у списку', { field: 'purpose', in: ['study', 'family'] }, known, 'yes'],
    ['in: значення поза списком', { field: 'purpose', in: ['employment'] }, known, 'no'],
    ['in: відповіді немає', { field: 'family', in: ['none'] }, known, 'unknown'],
    ['дата: рівно межа onOrAfter', { onOrAfter: '2026-09-08' }, base, 'yes'],
    ['дата: до межі onOrAfter', { onOrAfter: '2026-10-01' }, base, 'no'],
    ['дата: before не включає межу', { before: '2026-09-08' }, base, 'no'],
    ['дата: before раніше межі', { before: '2026-10-01' }, base, 'yes'],
  ];

  it.each(cases)('%s', (_name, condition, input, expected) => {
    expect(evaluateCondition(condition, input)).toBe(expected);
  });
});

describe('чинність маршруту на дату', () => {
  const cases: Array<[string, string | null, string, boolean]> = [
    ['2026-07-15', null, '2026-07-14', false],
    ['2026-07-15', null, '2026-07-15', true],
    ['2026-07-15', '2026-09-30', '2026-09-30', true],
    ['2026-07-15', '2026-09-30', '2026-10-01', false],
  ];

  it.each(cases)('від %s до %s на %s → %s', (from, to, date, expected) => {
    expect(isInForce(from, to, date)).toBe(expected);
  });
});
