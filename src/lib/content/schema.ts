import { z } from 'zod';
import { ANSWER_VALUES } from '../rules/domain.ts';
import type { Condition } from '../rules/types.ts';

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
const localizedTextOptional = localizedText.nullable().default(null);

// --- умови маршрутів -------------------------------------------------------
// Мова умов навмисно крихітна: логічні зв'язки, порівняння відповіді та дати.
// Значення перевіряються за списком дозволених (domain.ts): описка в yaml
// інакше просто ніколи не спрацювала б, і маршрут тихо зник би з результатів.

const answerField = z.enum(
  Object.keys(ANSWER_VALUES) as [keyof typeof ANSWER_VALUES, ...Array<keyof typeof ANSWER_VALUES>],
);

function valueAllowed(field: keyof typeof ANSWER_VALUES, value: string): boolean {
  return (ANSWER_VALUES[field] as readonly string[]).includes(value);
}

export const ConditionSchema: z.ZodType<Condition> = z.lazy(() =>
  z.union([
    z.object({ all: z.array(ConditionSchema).min(1) }).strict(),
    z.object({ any: z.array(ConditionSchema).min(1) }).strict(),
    z.object({ not: ConditionSchema }).strict(),
    z
      .object({ field: answerField, equals: nonEmpty })
      .strict()
      .refine((c) => valueAllowed(c.field, c.equals), {
        message: 'значення не входить у список дозволених для цього поля (src/lib/rules/domain.ts)',
      }),
    z
      .object({ field: answerField, in: z.array(nonEmpty).min(1) })
      .strict()
      .refine((c) => c.in.every((v) => valueAllowed(c.field, v)), {
        message: 'значення не входять у список дозволених для цього поля (src/lib/rules/domain.ts)',
      }),
    z.object({ onOrAfter: isoDate }).strict(),
    z.object({ before: isoDate }).strict(),
  ]),
);

export const EligibilityRuleSchema = z
  .object({
    id: nonEmpty,
    // require — умова, без якої маршрут не підходить.
    // exclude — обставина, яка маршрут виключає.
    effect: z.enum(['require', 'exclude']),
    when: ConditionSchema,
    localizedContentKey: nonEmpty.nullable().default(null),
    sourceIds,
  })
  .strict();

export const TransitionRuleSchema = z
  .object({
    id: nonEmpty,
    when: ConditionSchema,
    localizedContentKey: nonEmpty.nullable().default(null),
    sourceIds,
  })
  .strict();

export const StepSchema = z
  .object({
    id: nonEmpty,
    order: z.number().int().positive(),
    title: localizedText,
    body: localizedTextOptional,
    // Коли крок стосується періоду ПІСЛЯ рішення (обов'язки заявника).
    afterDecision: z.boolean().default(false),
    localizedContentKey: nonEmpty.nullable().default(null),
    prerequisites: z.array(nonEmpty).default([]),
    conditions: z.array(ConditionSchema).default([]),
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
    // Чи внесені умови придатності ПОВНІСТЮ. Поки false, движок не має права
    // сказати «підходить» — максимум «може підійти». Ставить людина, яка звірила
    // перелік умов із текстом закону (CLAUDE.md §2.3).
    conditionsComplete: z.boolean().default(false),
    // На який строк надається дозвіл і скільки закон дає органу на рішення —
    // це перше, що питає людина, і воно прямо в законі.
    grantedFor: localizedTextOptional,
    decisionDeadline: localizedTextOptional,
    // Ключові строки числами — для шкали на сторінці. Кожен має джерело.
    // phase: before — до подання, submission — у день подання,
    // decision — строк рішення, after — після отримання картки.
    deadlines: z
      .array(
        z
          .object({
            id: nonEmpty,
            phase: z.enum(['before', 'submission', 'decision', 'after']),
            days: z.number().int().positive().nullable().default(null),
            label: localizedText,
            sourceIds,
          })
          .strict(),
      )
      .default([]),
    eligibilityRules: z.array(EligibilityRuleSchema).default([]),
    steps: z.array(StepSchema).default([]),
    documentIds: z.array(nonEmpty).default([]),
    feeRuleIds: z.array(nonEmpty).default([]),
    authorityIds: z.array(nonEmpty).default([]),
    // Офіційні бланки цієї процедури — id ресурсів реєстру. Не «наш» документ:
    // ми лише посилаємося на файл органу (CLAUDE.md §2.5).
    formSourceIds: z.array(nonEmpty).default([]),
    transitionRules: z.array(TransitionRuleSchema).default([]),
    relatedProcedureIds: z.array(nonEmpty).default([]),
    openQuestions: z.array(nonEmpty).default([]),
  })
  .strict();

// Поріг, прив'язаний до норми. Множник без норми показувати заборонено
// (spec §5A), тому умова застосування — обов'язкове поле.
export const ThresholdRefSchema = z
  .object({
    thresholdId: nonEmpty,
    multiplier: z.number().positive(),
    appliesWhen: localizedText,
    sourceIds,
  })
  .strict();

export const DocumentSchema = z
  .object({
    id: nonEmpty,
    // Офіційна назва словацькою — так документ називає закон і так його
    // проситиме орган.
    officialName: nonEmpty,
    title: localizedText,
    explanation: localizedTextOptional,
    // Коли документ потрібен і коли не потрібен — текстом, із посиланням на §.
    requiredWhen: localizedTextOptional,
    // Максимальний вік документа в днях (§32 ods. 2 — «nie staršie ako 90 dní»).
    maxAgeDays: z.number().int().positive().nullable().default(null),
    // true — це не додаток до заяви, а обов'язок ПІСЛЯ рішення.
    afterDecision: z.boolean().default(false),
    // required — потрібен завжди; conditional — залежить від підстави чи ситуації;
    // exception — навпаки, звільняє від іншої вимоги.
    requirement: z.enum(['required', 'conditional', 'exception']).default('conditional'),
    thresholds: z.array(ThresholdRefSchema).default([]),
    sourceUrl: z.string().url().nullable().default(null),
    formVersion: nonEmpty.nullable().default(null),
    sourceHash: nonEmpty.nullable().default(null),
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

export const ExemptionSchema = z
  .object({
    id: nonEmpty,
    description: localizedText,
    sourceIds,
  })
  .strict();

export const ReductionRuleSchema = z
  .object({
    type: nonEmpty,
    percent: z.number().positive().max(100),
    maxReductionEur: z.number().positive(),
    condition: localizedText,
    sourceIds,
  })
  .strict();

export const FeeRuleSchema = z
  .object({
    id: nonEmpty,
    // Номер позиції тарифу 145/1995. null означає «позицію ще не встановлено»
    // — вигадувати її не можна (CLAUDE.md §2.2).
    tariffItem: nonEmpty.nullable(),
    amount: z.number().nonnegative(),
    currency: z.literal('EUR'),
    filingChannel: z.array(nonEmpty).default([]),
    applicantConditions: z.array(z.unknown()).default([]),
    exemptions: z.array(ExemptionSchema).default([]),
    reductionRule: ReductionRuleSchema.nullable().default(null),
    // Орган може відпустити або знизити збір із гуманітарних підстав чи
    // з міркувань взаємності (145/1995, položka 24, Splnomocnenie).
    waiverNote: localizedTextOptional,
    validFrom: isoDate,
    validTo: isoDate.nullable().default(null),
    reviewStatus: reviewStatus.default('draft'),
    notes: z.string().nullable().default(null),
    sourceIds,
  })
  .strict();

// Реєстр джерел веде власний, детальніший облік перевірки, ніж spec §7:
// url_verified (адреса відкривається) → snapshot_taken (файл збережено з sha256) →
// source_verified (людина подивилася файл). Зберігаємо обидва статуси, бо
// «адреса працює» і «джерело перевірене юристом» — різні речі.
export const registryStatusValues = [
  'fetch_pending',
  'url_verified',
  'snapshot_taken',
  'source_verified',
  'legally_reviewed',
  'published',
  'superseded',
  'blocked',
] as const;

export const SourceSchema = z
  .object({
    id: nonEmpty,
    authority: nonEmpty,
    title: nonEmpty,
    url: z.string().url().nullable(),
    // Slov-Lex віддає «плаваючу» адресу поточної редакції; для цитування потрібна
    // пінована темпоральна адреса конкретної редакції (spec §2).
    pinnedUrl: z.string().url().nullable().default(null),
    staticUrl: z.string().url().nullable().default(null),
    formCode: nonEmpty.nullable().default(null),
    // Мовою якою орган вимагає заповнювати бланк. Для 11-057 і 11-056 це
    // словацька — підтверджено текстом самих бланків (SOURCE_AUDIT_v0.4 §1).
    completionLanguage: nonEmpty.nullable().default(null),
    registryStatus: z.enum(registryStatusValues),
    // SOURCE_AUDIT_v0.4 §5: сторінка органу, оновлена до змін від 15.7.2026.
    potentiallyStale: z.boolean().default(false),
    // Що саме було видно за адресою на момент перевірки — доказ, а не переказ.
    evidence: z.string().nullable().default(null),
    notes: z.string().nullable().default(null),
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
    notes: z.string().nullable().default(null),
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
    publicUrl: z.string().url(),
    nav: z.array(z.object({ key: nonEmpty, path: z.string() }).strict()).min(1),
    locales: z.array(nonEmpty).min(1),
    defaultLocale: nonEmpty,
  })
  .strict()
  .refine((c) => c.locales.includes(c.defaultLocale), {
    message: 'defaultLocale має бути серед locales',
  });

// Спільна юридична примітка, що стосується кількох маршрутів (наприклад,
// підстави для відмови). Зберігається окремо, щоб не дублювати текст.
export const LegalNoteSchema = z
  .object({
    id: nonEmpty,
    title: localizedText,
    intro: localizedTextOptional,
    items: z
      .array(z.object({ id: nonEmpty, text: localizedText }).strict())
      .min(1),
    appliesTo: z.array(nonEmpty).min(1),
    // Суми, прив'язані до життєвого мінімуму, обчислюються, а не зберігаються.
    thresholds: z.array(ThresholdRefSchema).default([]),
    reviewStatus: reviewStatus.default('draft'),
    sourceIds,
  })
  .strict();

export type LegalNote = z.infer<typeof LegalNoteSchema>;

export const FinderConfigSchema = z
  .object({
    steps: z
      .array(
        z
          .object({
            id: nonEmpty,
            field: answerField,
            options: z.array(nonEmpty).min(2),
          })
          .strict()
          .refine((step) => step.options.every((o) => valueAllowed(step.field, o)), {
            message: 'варіант відповіді не входить у список дозволених (src/lib/rules/domain.ts)',
          }),
      )
      .min(1),
  })
  .strict();

export type FinderConfig = z.infer<typeof FinderConfigSchema>;
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
