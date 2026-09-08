/**
 * Табличні тести движка: відповіді → результат маршруту (spec §10).
 * Маршрути — синтетичні фікстури, не право (див. fixtures.ts).
 */
import { describe, expect, it } from 'vitest';
import { evaluate, evaluateProcedure, offeredRoutes } from '../../src/lib/rules/evaluate.ts';
import type { Answers, MatchOutcome } from '../../src/lib/rules/types.ts';
import * as f from './fixtures.ts';

const TODAY = '2026-09-08';

function answers(partial: Omit<Partial<Answers>, 'asOfDate'> & { asOfDate?: string }): Answers {
  return { asOfDate: TODAY, ...partial };
}

describe('прості умови', () => {
  const cases: Array<[string, Answers, MatchOutcome]> = [
    [
      'третя країна + працевлаштування → підходить',
      answers({ citizenshipGroup: 'third_country', purpose: 'employment' }),
      'eligible',
    ],
    [
      'громадянин ЄС не підпадає під маршрут для третіх країн',
      answers({ citizenshipGroup: 'eu_eea_ch', purpose: 'employment' }),
      'not_eligible',
    ],
    [
      'мета не та → не підходить',
      answers({ citizenshipGroup: 'third_country', purpose: 'study' }),
      'not_eligible',
    ],
    [
      'мета не вказана → можливо, потрібна відповідь',
      answers({ citizenshipGroup: 'third_country' }),
      'possible',
    ],
    [
      'громадянство не вказане → можливо',
      answers({ purpose: 'employment' }),
      'possible',
    ],
    ['жодної відповіді → можливо, а не «не підходить»', answers({}), 'possible'],
  ];

  it.each(cases)('%s', (_name, input, expected) => {
    expect(evaluateProcedure(f.employment, input).outcome).toBe(expected);
  });

  it('невідомі відповіді не потрапляють у «порушені умови»', () => {
    const match = evaluateProcedure(f.employment, answers({}));
    expect(match.failedRuleIds).toEqual([]);
    expect(match.unresolvedRuleIds).toEqual(['r-third-country', 'r-purpose']);
  });
});

describe('виключення переважає над невиконаною умовою', () => {
  const cases: Array<[string, Answers, MatchOutcome]> = [
    [
      'тимчасовий захист, статусу немає → підходить',
      answers({ citizenshipGroup: 'ua_temporary_protection', currentStatus: 'temporary_protection' }),
      'eligible',
    ],
    [
      'уже має постійне проживання → виключено',
      answers({ citizenshipGroup: 'ua_temporary_protection', currentStatus: 'permanent_residence' }),
      'excluded',
    ],
    [
      'статус невідомий → можливо (виключення не перевірене)',
      answers({ citizenshipGroup: 'ua_temporary_protection' }),
      'possible',
    ],
    [
      'і умова не виконана, і виключення спрацювало → показуємо виключення',
      answers({ citizenshipGroup: 'eu_eea_ch', currentStatus: 'permanent_residence' }),
      'excluded',
    ],
  ];

  it.each(cases)('%s', (_name, input, expected) => {
    expect(evaluateProcedure(f.protectionTransition, input).outcome).toBe(expected);
  });
});

describe('складені умови any / in / not', () => {
  const base = { location: 'abroad', currentStatus: 'none' } as const;

  const cases: Array<[string, Answers, MatchOutcome]> = [
    ['мета зі списку — працевлаштування', answers({ ...base, purpose: 'employment' }), 'eligible'],
    ['мета зі списку — підприємництво', answers({ ...base, purpose: 'business' }), 'eligible'],
    ['мета поза списком', answers({ ...base, purpose: 'study' }), 'not_eligible'],
    [
      'not: уже має проживання → виключено',
      answers({ ...base, currentStatus: 'temporary_residence', purpose: 'employment' }),
      'excluded',
    ],
    [
      'перебуває в Словаччині → умова про подачу з-за кордону не виконана',
      answers({ location: 'in_slovakia', currentStatus: 'none', purpose: 'employment' }),
      'not_eligible',
    ],
  ];

  it.each(cases)('%s', (_name, input, expected) => {
    expect(evaluateProcedure(f.nationalVisa, input).outcome).toBe(expected);
  });
});

describe('часові межі маршруту', () => {
  const cases: Array<[string, string, MatchOutcome]> = [
    ['скасований маршрут напередодні змін — ще діє', '2026-07-14', 'eligible'],
    ['скасований маршрут у день змін 15.07.2026 — уже ні', '2026-07-15', 'not_applicable'],
    ['скасований маршрут пізніше — ні', '2026-09-08', 'not_applicable'],
  ];

  it.each(cases)('%s', (_name, date, expected) => {
    expect(evaluateProcedure(f.repealed, answers({ asOfDate: date })).outcome).toBe(expected);
  });

  const october: Array<[string, string, MatchOutcome]> = [
    ['маршрут із 01.10.2026 напередодні', '2026-09-30', 'not_applicable'],
    ['маршрут із 01.10.2026 у перший день', '2026-10-01', 'eligible'],
    ['маршрут із 01.10.2026 пізніше', '2027-01-01', 'eligible'],
  ];

  it.each(october)('%s', (_name, date, expected) => {
    expect(evaluateProcedure(f.fromOctober, answers({ asOfDate: date })).outcome).toBe(expected);
  });

  it('маршрут поза часовими межами не повертає жодного правила', () => {
    const match = evaluateProcedure(f.repealed, answers({ asOfDate: '2026-09-08' }));
    expect(match.failedRuleIds).toEqual([]);
    expect(match.unresolvedRuleIds).toEqual([]);
    expect(match.transitionRuleIds).toEqual([]);
  });
});

describe('часова умова всередині правила (межа 01.10.2026)', () => {
  // Маршрут діє з 15.07.2026, але одна з його вимог вмикається лише 01.10.2026
  // (Act 128/2026, čl. I bod 62). Це різні речі, і движок має їх розрізняти.
  const cases: Array<[string, string, MatchOutcome]> = [
    ['у липні маршрут діє, але жовтнева умова ще ні', '2026-07-15', 'not_eligible'],
    ['напередодні 01.10.2026', '2026-09-30', 'not_eligible'],
    ['у день 01.10.2026 умова виконана', '2026-10-01', 'eligible'],
    ['пізніше — теж', '2027-01-01', 'eligible'],
  ];

  it.each(cases)('%s', (_name, date, expected) => {
    expect(evaluateProcedure(f.octoberCondition, answers({ asOfDate: date })).outcome).toBe(expected);
  });

  it('до 15.07.2026 маршрут узагалі не існує — умови не оцінюються', () => {
    const match = evaluateProcedure(f.octoberCondition, answers({ asOfDate: '2026-07-14' }));
    expect(match.outcome).toBe('not_applicable');
    expect(match.failedRuleIds).toEqual([]);
  });
});

describe('перехідні правила', () => {
  const cases: Array<[string, string, string[]]> = [
    ['до змін 15.07.2026 — застосовується §131n', '2026-07-14', ['t-131n-before-amendment']],
    ['після змін — жодного', '2026-09-08', []],
    ['після 15.07.2027 — спрацьовує граничний строк', '2027-07-15', ['t-131k-sunset']],
  ];

  it.each(cases)('%s', (_name, date, expected) => {
    expect(evaluateProcedure(f.withTransitions, answers({ asOfDate: date })).transitionRuleIds).toEqual(
      expected,
    );
  });
});

describe('статус для користувача', () => {
  const cases: Array<[string, 'reviewed' | 'incomplete']> = [
    ['TEST-F-eu-registration', 'reviewed'],
    ['TEST-B-employment', 'incomplete'],
    ['TEST-E-protection-transition', 'incomplete'],
  ];

  it.each(cases)('%s → %s', (id, expected) => {
    const match = evaluate(f.allProcedures, answers({})).find((m) => m.procedureId === id);
    expect(match?.status).toBe(expected);
  });

  it('«перевірено юристом» не залежить від того, чи маршрут підходить', () => {
    const match = evaluateProcedure(f.euRegistration, answers({ citizenshipGroup: 'third_country' }));
    expect(match.outcome).toBe('not_eligible');
    expect(match.status).toBe('reviewed');
  });
});

describe('маршрут із неповними умовами', () => {
  it('усі умови виконані, але сказати «підходить» не можна', () => {
    const match = evaluateProcedure(f.pointerOnly, answers({ citizenshipGroup: 'third_country' }));
    expect(match.outcome).toBe('possible');
    expect(match.cappedByIncompleteConditions).toBe(true);
    expect(match.unresolvedRuleIds).toEqual([]);
  });

  it('умова не виконана — це видно точно, обмеження не приховує «не підходить»', () => {
    const match = evaluateProcedure(f.pointerOnly, answers({ citizenshipGroup: 'eu_eea_ch' }));
    expect(match.outcome).toBe('not_eligible');
    expect(match.cappedByIncompleteConditions).toBe(false);
  });

  it('маршрут із повними умовами обмеження не зачіпає', () => {
    const match = evaluateProcedure(
      f.employment,
      answers({ citizenshipGroup: 'third_country', purpose: 'employment' }),
    );
    expect(match.outcome).toBe('eligible');
    expect(match.cappedByIncompleteConditions).toBe(false);
  });
});

describe('перелік маршрутів', () => {
  it('порядок детермінований: за категорією, потім за id', () => {
    const ids = evaluate(f.allProcedures, answers({})).map((m) => m.procedureId);
    expect(ids).toEqual([...ids].sort());
    expect(ids[0]).toBe('TEST-A-national-visa');
  });

  it('повертає всі маршрути, включно з тими, що не підходять', () => {
    expect(evaluate(f.allProcedures, answers({})).length).toBe(f.allProcedures.length);
  });

  it('маршрут, що використав більше відповідей, стоїть вище', () => {
    // Людина сказала: третя країна + працевлаштування. Маршрут, який спирається
    // на обидві відповіді, має бути вище за той, що спирається лише на громадянство.
    const offered = offeredRoutes(
      evaluate([f.pointerOnly, f.employment], answers({
        citizenshipGroup: 'third_country',
        purpose: 'employment',
      })),
    );
    expect(offered.map((m) => m.procedureId)).toEqual(['TEST-B-employment', 'TEST-C-pointer-only']);
  });

  it('кількість підтверджених умов рахується', () => {
    const match = evaluateProcedure(
      f.employment,
      answers({ citizenshipGroup: 'third_country', purpose: 'employment' }),
    );
    expect(match.matchedRuleIds).toEqual(['r-third-country', 'r-purpose']);
  });

  it('offeredRoutes лишає тільки «підходить» і «можливо»', () => {
    const offered = offeredRoutes(
      evaluate(f.allProcedures, answers({ citizenshipGroup: 'eu_eea_ch' })),
    );
    for (const m of offered) expect(['eligible', 'possible']).toContain(m.outcome);
    expect(offered.map((m) => m.procedureId)).toContain('TEST-F-eu-registration');
  });

  it('джерела зібрані з маршруту і його правил, без повторів і впорядковано', () => {
    const match = evaluateProcedure(
      f.employment,
      answers({ citizenshipGroup: 'third_country', purpose: 'employment' }),
    );
    expect(match.sourceIds).toEqual(['slovlex-404-2011', 'slovlex-5-2004']);
  });

  it('громадянин ЄС не отримує маршрут для третіх країн у пропозиціях', () => {
    const offered = offeredRoutes(
      evaluate(f.allProcedures, answers({ citizenshipGroup: 'eu_eea_ch', purpose: 'employment' })),
    ).map((m) => m.procedureId);
    expect(offered).not.toContain('TEST-B-employment');
  });
});
