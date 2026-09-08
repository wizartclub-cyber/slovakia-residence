import { z } from 'zod';

// Схеми юридичних даних. Поля — spec §7. Схеми строгі (.strict): невідоме поле у yaml
// означає помилку, а не мовчазне ігнорування, щоб описка не зникла з очей.

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'дата має бути у форматі РРРР-ММ-ДД');
const nonEmpty = z.string().min(1);
const sourceIds = z.array(nonEmpty).min(1, 'кожен запис має посилатися хоча б на одне джерело');

export const reviewStatusValues = [
  'draft',
  'source_verified',
  'legally_reviewed',
  'published',
  'superseded',
  'blocked',
] as const;
export const reviewStatus = z.enum(reviewStatusValues);

export const preparationTypeValues = [
  'prepare_locally',
  'obtain_from_authority',
  'obtain_from_third_party',
  'translate_officially',
  'legalize',
  'certify_signature',
  'present_original',
  'submit',
] as const;

export const sourceTypeValues = [
  'legislation',
  'implementing_regulation',
  'eu_law',
  'official_web_guidance',
  'administrative_guidance',
  'official_form',
  'official_fee_schedule',
  'secondary_explanatory_source',
] as const;

export const authorityTypeValues = [
  'OCP_PZ',
  'DIPLOMATIC_MISSION',
  'UPSVAR',
  'MUNICIPALITY',
  'MINISTRY',
  'COURT',
  'OTHER',
] as const;

const localizedText = z.object({ uk: nonEmpty, sk: nonEmpty }).strict();

export const StepSchema = z
  .object({
    id: nonEmpty,
    order: z.number().int().positive(),
    localizedContentKey: nonEmpty,
    prerequisites: z.array(nonEmpty).default([]),
    conditions: z.array(z.unknown()).default([]),
    actions: z.array(z.unknown()).default([]),
    sourceIds: z.array(nonEmpty).default([]),
  })
  .strict();

export const ProcedureSchema = z
  .object({
    id: nonEmpty,
    category: z.enum(['A', 'B', 'C', 'D', 'E', 'F', 'G']),
    title: localizedText,
    legalBasis: z.array(nonEmpty).default([]),
    validFrom: isoDate,
    validTo: isoDate.nullable().default(null),
    reviewStatus,
    reviewedAt: isoDate.nullable().default(null),
    reviewer: nonEmpty.nullable().default(null),
    sourceIds,
    eligibilityRules: z.array(z.unknown()).default([]),
    steps: z.array(StepSchema).default([]),
    documentIds: z.array(nonEmpty).default([]),
    feeRuleIds: z.array(nonEmpty).default([]),
    authorityIds: z.array(nonEmpty).default([]),
    transitionRules: z.array(z.unknown()).default([]),
    relatedProcedureIds: z.array(nonEmpty).default([]),
    openQuestions: z.array(nonEmpty).default([]),
  })
  .strict();

export const DocumentSchema = z
  .object({
    id: nonEmpty,
    officialName: nonEmpty,
    sourceUrl: z.string().url().nullable().default(null),
    formVersion: nonEmpty.nullable().default(null),
    sourceHash: nonEmpty.nullable().default(null),
    requiredWhen: z.unknown().nullable().default(null),
    preparationType: z.enum(preparationTypeValues),
    validityRule: nonEmpty.nullable().default(null),
    translationRule: nonEmpty.nullable().default(null),
    legalizationRule: nonEmpty.nullable().default(null),
    certificationRule: nonEmpty.nullable().default(null),
    formMappingId: nonEmpty.nullable().default(null),
    reviewStatus: reviewStatus.default('draft'),
    sourceIds,
  })
  .strict();

export const FeeRuleSchema = z
  .object({
    id: nonEmpty,
    tariffItem: nonEmpty,
    amount: z.number().nonnegative(),
    currency: z.literal('EUR'),
    filingChannel: z.array(nonEmpty).default([]),
    applicantConditions: z.array(z.unknown()).default([]),
    exemptions: z.array(z.unknown()).default([]),
    reductionRule: z.unknown().nullable().default(null),
    validFrom: isoDate,
    validTo: isoDate.nullable().default(null),
    reviewStatus: reviewStatus.default('draft'),
    sourceIds,
  })
  .strict();

export const SourceSchema = z
  .object({
    id: nonEmpty,
    authority: nonEmpty,
    title: nonEmpty,
    url: z.string().url().nullable(),
    locale: nonEmpty.nullable().default(null),
    lawNumber: nonEmpty.nullable().default(null),
    provision: nonEmpty.nullable().default(null),
    publicationDate: isoDate.nullable().default(null),
    effectiveFrom: isoDate.nullable().default(null),
    effectiveTo: isoDate.nullable().default(null),
    checkedAt: isoDate.nullable().default(null),
    sourceType: z.enum(sourceTypeValues),
    snapshotPath: nonEmpty.nullable().default(null),
    sha256: z
      .string()
      .regex(/^[a-f0-9]{64}$/)
      .nullable()
      .default(null),
    reviewStatus: reviewStatus.default('draft'),
  })
  .strict();

export const ThresholdSchema = z
  .object({
    id: nonEmpty,
    baseValue: z.number().positive(),
    unit: nonEmpty,
    multiplier: z.number().positive().nullable().default(null),
    formula: nonEmpty.nullable().default(null),
    validFrom: isoDate,
    validTo: isoDate.nullable().default(null),
    sourceIds,
    notes: z.string().nullable().default(null),
  })
  .strict();

export const AuthoritySchema = z
  .object({
    id: nonEmpty,
    type: z.enum(authorityTypeValues),
    officialName: nonEmpty,
    territorialCompetence: nonEmpty.nullable().default(null),
    filingChannels: z.array(nonEmpty).default([]),
    bookingUrl: z.string().url().nullable().default(null),
    infoUrl: z.string().url().nullable().default(null),
    // spec §10: білд падає, якщо в органу немає checkedAt або джерела.
    checkedAt: isoDate,
    sourceIds,
  })
  .strict();

export const SiteConfigSchema = z
  .object({
    legalBaseline: z
      .object({
        date: isoDate,
        edition: z.number().int().positive(),
        reviewCompleted: z.boolean(),
        reviewer: nonEmpty.nullable().default(null),
      })
      .strict(),
    nav: z.array(z.object({ key: nonEmpty, path: z.string() }).strict()).min(1),
    locales: z.array(nonEmpty).min(1),
    defaultLocale: nonEmpty,
  })
  .strict()
  .refine((c) => c.locales.includes(c.defaultLocale), {
    message: 'defaultLocale має бути серед locales',
  });

export type Procedure = z.infer<typeof ProcedureSchema>;
export type Document = z.infer<typeof DocumentSchema>;
export type FeeRule = z.infer<typeof FeeRuleSchema>;
export type Source = z.infer<typeof SourceSchema>;
export type Threshold = z.infer<typeof ThresholdSchema>;
export type Authority = z.infer<typeof AuthoritySchema>;
export type SiteConfigData = z.infer<typeof SiteConfigSchema>;

// Що бачить користувач. Виводиться з reviewStatus — окремого поля в yaml немає,
// щоб не було двох суперечливих правд про один маршрут (CLAUDE.md §2.3).
export function publicStatus(status: (typeof reviewStatusValues)[number]): 'reviewed' | 'incomplete' {
  return status === 'legally_reviewed' || status === 'published' ? 'reviewed' : 'incomplete';
}
