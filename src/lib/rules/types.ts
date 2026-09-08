/**
 * Типи движка правил. Без React і без DOM — щоб їх можна було перевірити
 * табличними тестами (spec §10).
 */

import type {
  CITIZENSHIP_GROUPS,
  CURRENT_STATUSES,
  FAMILY_SITUATIONS,
  LOCATIONS,
  PURPOSES,
} from './domain';

/** Група громадянства. Визначає, яким правом взагалі регулюється ситуація. */
export type CitizenshipGroup = (typeof CITIZENSHIP_GROUPS)[number];

/** Де людина перебуває на момент подачі. */
export type LocationAnswer = (typeof LOCATIONS)[number];

/** Правовий стан зараз. */
export type CurrentStatus = (typeof CURRENT_STATUSES)[number];

/** Мета перебування. */
export type Purpose = (typeof PURPOSES)[number];

/** Сімейна ситуація — без імен і документів. */
export type FamilySituation = (typeof FAMILY_SITUATIONS)[number];

/**
 * Відповіді опитувальника. Жодного поля, що ідентифікує людину:
 * ні імені, ні номера паспорта, ні адреси (spec §8).
 *
 * Усі поля, крім дати, необов'язкові: «не знаю» — законна відповідь,
 * і движок мусить її розрізняти, а не вважати відповіддю «ні».
 */
export type Answers = {
  /** Дата, на яку оцінюємо ситуацію (РРРР-ММ-ДД). Закон змінюється в часі. */
  asOfDate: string;
  citizenshipGroup?: CitizenshipGroup;
  currentStatus?: CurrentStatus;
  location?: LocationAnswer;
  purpose?: Purpose;
  family?: FamilySituation;
};

export type AnswerField = Exclude<keyof Answers, 'asOfDate'>;

/** Тризначна істина: «не знаю» — окреме значення, не «ні». */
export type Truth = 'yes' | 'no' | 'unknown';

/**
 * Умова в даних маршруту. Мова навмисно крихітна: логічні зв'язки,
 * порівняння відповіді та часові межі. Нічого, що виконує довільний код.
 */
export type Condition =
  | { all: Condition[] }
  | { any: Condition[] }
  | { not: Condition }
  | { field: AnswerField; equals: string }
  | { field: AnswerField; in: string[] }
  /** Діє з цієї дати включно. */
  | { onOrAfter: string }
  /** Діє до цієї дати (не включно). */
  | { before: string };

export type EligibilityEffect = 'require' | 'exclude';

export type EligibilityRule = {
  id: string;
  effect: EligibilityEffect;
  when: Condition;
  sourceIds: string[];
  /** Ключ тексту в locales — пояснення для людини. */
  localizedContentKey?: string | null;
};

export type TransitionRule = {
  id: string;
  when: Condition;
  sourceIds: string[];
  localizedContentKey?: string | null;
};

/**
 * Результат для одного маршруту.
 *
 * `eligible` НЕ означає «вам це нададуть»: це означає «за вашими відповідями
 * жодна відома нам умова не порушена». Обіцяти результат заборонено (spec §8).
 */
export type MatchOutcome =
  /** Часові межі маршруту не покривають дату оцінки. */
  | 'not_applicable'
  /** Спрацювала умова-виключення. */
  | 'excluded'
  /** Обов'язкова умова не виконана. */
  | 'not_eligible'
  /** Частина умов невідома — потрібні додаткові відповіді. */
  | 'possible'
  /** Усі відомі умови виконані. */
  | 'eligible';

export type RouteMatch = {
  procedureId: string;
  category: string;
  outcome: MatchOutcome;
  /** Статус для користувача, виведений із reviewStatus (CLAUDE.md §2.3). */
  status: 'reviewed' | 'incomplete';
  /** Правила, відповіді на які бракує. */
  unresolvedRuleIds: string[];
  /** Правила, які не виконані або виключили маршрут. */
  failedRuleIds: string[];
  /** Перехідні правила, що застосовуються (наприклад, §131n). */
  transitionRuleIds: string[];
  /** Джерела всіх правил, що вплинули на результат. */
  sourceIds: string[];
};
