/**
 * Дозволені значення відповідей — одне джерело правди для типів, для схем Zod
 * і для опитувальника.
 *
 * Навіщо: якщо в yaml маршруту написати `third-country` замість `third_country`,
 * умова просто ніколи не спрацює і маршрут тихо зникне з результатів. Тому
 * значення перевіряються при збірці, а не в браузері.
 */
export const CITIZENSHIP_GROUPS = ['eu_eea_ch', 'third_country', 'ua_temporary_protection'] as const;

export const LOCATIONS = ['in_slovakia', 'abroad'] as const;

export const CURRENT_STATUSES = [
  'none',
  'visa_free',
  'schengen_visa',
  'national_visa',
  'temporary_residence',
  'permanent_residence',
  'temporary_protection',
  'tolerated_stay',
  'international_protection_applicant',
] as const;

export const PURPOSES = [
  'employment',
  'business',
  'study',
  'family',
  'research',
  'special_activity',
  'protection',
  'other',
] as const;

export const FAMILY_SITUATIONS = [
  'none',
  'spouse_of_sk_citizen',
  'spouse_of_resident',
  'child_of_resident',
  'dependent_relative',
] as const;

/** Поле опитувальника → його дозволені значення. */
export const ANSWER_VALUES = {
  citizenshipGroup: CITIZENSHIP_GROUPS,
  currentStatus: CURRENT_STATUSES,
  location: LOCATIONS,
  purpose: PURPOSES,
  family: FAMILY_SITUATIONS,
} as const;

export const ANSWER_FIELDS = Object.keys(ANSWER_VALUES) as Array<keyof typeof ANSWER_VALUES>;
