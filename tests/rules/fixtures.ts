/**
 * Синтетичні маршрути для перевірки движка.
 *
 * УВАГА: це НЕ право Словаччини. Умови тут вигадані навмисно — вони підібрані
 * так, щоб перевірити механіку движка (тризначну логіку, виключення, дати).
 * Справжні маршрути живуть у content/procedures і пишуться зі джерел (Slice 5).
 * Тому всі id починаються з TEST-.
 */
import { ProcedureSchema } from '../../src/lib/content/schema.ts';
import type { Procedure } from '../../src/lib/content/schema.ts';

function fixture(input: unknown): Procedure {
  // Прогін через справжню схему: якщо фікстура не відповідає spec §7,
  // тест впаде тут, а не покаже хибно зелений результат.
  return ProcedureSchema.parse(input);
}

const title = { uk: 'Тестовий маршрут', sk: 'Testovacia cesta' };
const src = ['slovlex-404-2011'];

/** Проста кон'юнкція двох умов. */
export const employment = fixture({
  id: 'TEST-B-employment',
  conditionsComplete: true,
  category: 'B',
  title,
  validFrom: '2026-07-15',
  reviewStatus: 'draft',
  sourceIds: src,
  eligibilityRules: [
    {
      id: 'r-third-country',
      effect: 'require',
      when: { field: 'citizenshipGroup', equals: 'third_country' },
      sourceIds: ['slovlex-404-2011'],
    },
    {
      id: 'r-purpose',
      effect: 'require',
      when: { field: 'purpose', equals: 'employment' },
      sourceIds: ['slovlex-5-2004'],
    },
  ],
});

/** Єдина умова + статус «перевірено юристом». */
export const euRegistration = fixture({
  id: 'TEST-F-eu-registration',
  conditionsComplete: true,
  category: 'F',
  title,
  validFrom: '2026-07-15',
  reviewStatus: 'legally_reviewed',
  reviewedAt: '2026-09-08',
  reviewer: 'Test Testovič',
  sourceIds: src,
  eligibilityRules: [
    {
      id: 'r-eu',
      effect: 'require',
      when: { field: 'citizenshipGroup', equals: 'eu_eea_ch' },
      sourceIds: ['slovlex-404-2011'],
    },
  ],
});

/** Вимога + виключення + часова умова всередині правила. */
export const protectionTransition = fixture({
  id: 'TEST-E-protection-transition',
  conditionsComplete: true,
  category: 'E',
  title,
  validFrom: '2026-07-15',
  reviewStatus: 'source_verified',
  sourceIds: src,
  eligibilityRules: [
    {
      id: 'r-temporary-protection',
      effect: 'require',
      when: { field: 'citizenshipGroup', equals: 'ua_temporary_protection' },
      sourceIds: ['slovlex-404-2011'],
    },
    {
      id: 'r-after-amendment',
      effect: 'require',
      when: { onOrAfter: '2026-07-15' },
      sourceIds: ['slovlex-128-2026'],
    },
    {
      id: 'x-already-permanent',
      effect: 'exclude',
      when: { field: 'currentStatus', equals: 'permanent_residence' },
      sourceIds: ['slovlex-404-2011'],
    },
  ],
});

/** Складені умови: any / all / not. */
export const nationalVisa = fixture({
  id: 'TEST-A-national-visa',
  conditionsComplete: true,
  category: 'A',
  title,
  validFrom: '2026-07-15',
  reviewStatus: 'draft',
  sourceIds: src,
  eligibilityRules: [
    {
      id: 'r-abroad',
      effect: 'require',
      when: { field: 'location', equals: 'abroad' },
      sourceIds: ['mzv-national-visa-guidance'],
    },
    {
      id: 'r-purpose-any',
      effect: 'require',
      when: { field: 'purpose', in: ['employment', 'business'] },
      sourceIds: ['mzv-national-visa-guidance'],
    },
    {
      id: 'x-not-already-resident',
      effect: 'exclude',
      when: { not: { field: 'currentStatus', in: ['none', 'visa_free'] } },
      sourceIds: ['slovlex-404-2011'],
    },
  ],
});

/** Маршрут, що діяв до змін 15.07.2026. */
export const repealed = fixture({
  id: 'TEST-OLD-repealed',
  conditionsComplete: true,
  category: 'G',
  title,
  validFrom: '2020-01-01',
  validTo: '2026-07-14',
  reviewStatus: 'superseded',
  sourceIds: src,
});

/** Маршрут, що починає діяти 01.10.2026 (Act 128/2026, čl. I bod 62). */
export const fromOctober = fixture({
  id: 'TEST-NEW-from-october',
  conditionsComplete: true,
  category: 'G',
  title,
  validFrom: '2026-10-01',
  reviewStatus: 'draft',
  sourceIds: ['slovlex-128-2026'],
});

/**
 * Маршрут із перехідними правилами: §131n та строк 15.07.2027.
 * Діє задовго до змін 15.07.2026 — інакше движок узагалі не дійшов би до
 * перехідних правил, бо маршрут на ту дату ще не існував би.
 */
export const withTransitions = fixture({
  id: 'TEST-G-transitions',
  conditionsComplete: true,
  category: 'G',
  title,
  validFrom: '2020-01-01',
  reviewStatus: 'draft',
  sourceIds: src,
  transitionRules: [
    {
      id: 't-131n-before-amendment',
      when: { before: '2026-07-15' },
      sourceIds: ['slovlex-404-2011'],
    },
    {
      id: 't-131k-sunset',
      when: { onOrAfter: '2027-07-15' },
      sourceIds: ['slovlex-404-2011'],
    },
  ],
});

/**
 * Умова, що вмикається 01.10.2026 — межа з Act 128/2026, čl. I bod 62.
 * Сам маршрут діє з 15.07.2026, а одна з його вимог — лише з жовтня.
 */
export const octoberCondition = fixture({
  id: 'TEST-B-october-condition',
  conditionsComplete: true,
  category: 'B',
  title,
  validFrom: '2026-07-15',
  reviewStatus: 'draft',
  sourceIds: ['slovlex-128-2026'],
  eligibilityRules: [
    {
      id: 'r-from-october',
      effect: 'require',
      when: { onOrAfter: '2026-10-01' },
      sourceIds: ['slovlex-128-2026'],
    },
  ],
});

/**
 * Маршрут-вказівник: умови внесені не повністю, тому движок не має права
 * сказати «підходить» — максимум «може підійти».
 */
export const pointerOnly = fixture({
  id: 'TEST-C-pointer-only',
  category: 'C',
  title,
  validFrom: '2026-07-15',
  reviewStatus: 'draft',
  conditionsComplete: false,
  sourceIds: src,
  eligibilityRules: [
    {
      id: 'r-third-country',
      effect: 'require',
      when: { field: 'citizenshipGroup', equals: 'third_country' },
      sourceIds: ['slovlex-404-2011'],
    },
  ],
});

export const allProcedures = [
  employment,
  euRegistration,
  protectionTransition,
  nationalVisa,
  repealed,
  fromOctober,
  withTransitions,
  octoberCondition,
  pointerOnly,
];
