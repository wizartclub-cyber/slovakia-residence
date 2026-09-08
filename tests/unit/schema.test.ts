import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  AuthoritySchema,
  FeeRuleSchema,
  ProcedureSchema,
  ThresholdSchema,
  publicStatus,
} from '../../src/lib/content/schema.ts';

const root = fileURLToPath(new URL('../..', import.meta.url));

const validThreshold = {
  id: 'zivotne-minimum-adult',
  baseValue: 295.22,
  unit: 'EUR/month',
  validFrom: '2026-07-01',
  validTo: null,
  sourceIds: ['opatrenie-155-2026'],
  notes: null,
};

describe('Threshold', () => {
  it('приймає коректний поріг', () => {
    expect(ThresholdSchema.safeParse(validThreshold).success).toBe(true);
  });

  it('падає без sourceIds — правило без джерела не існує (CLAUDE.md §2.2)', () => {
    const { sourceIds: _omitted, ...withoutSources } = validThreshold;
    expect(ThresholdSchema.safeParse(withoutSources).success).toBe(false);
  });

  it('падає на порожньому списку джерел', () => {
    expect(ThresholdSchema.safeParse({ ...validThreshold, sourceIds: [] }).success).toBe(false);
  });

  it('падає на невідомому полі — описка не має проходити мовчки', () => {
    expect(ThresholdSchema.safeParse({ ...validThreshold, baseValu: 300 }).success).toBe(false);
  });

  it('падає на даті у неправильному форматі', () => {
    expect(ThresholdSchema.safeParse({ ...validThreshold, validFrom: '01.07.2026' }).success).toBe(
      false,
    );
  });
});

describe('FeeRule', () => {
  const fee = {
    id: 'fee-tr-employment-first',
    tariffItem: '145/1995 pol. 24',
    amount: 250,
    currency: 'EUR',
    validFrom: '2026-09-01',
    sourceIds: ['slovlex-145-1995'],
  };

  it('приймає збір із джерелом', () => {
    expect(FeeRuleSchema.safeParse(fee).success).toBe(true);
  });

  it('падає без джерела (spec §10)', () => {
    expect(FeeRuleSchema.safeParse({ ...fee, sourceIds: [] }).success).toBe(false);
  });
});

describe('Authority', () => {
  const authority = {
    id: 'ocp-pz-bratislava',
    type: 'OCP_PZ',
    officialName: 'Oddelenie cudzineckej polície PZ Bratislava',
    checkedAt: '2026-09-07',
    sourceIds: ['minv-residence-guides'],
  };

  it('приймає орган із checkedAt і джерелом', () => {
    expect(AuthoritySchema.safeParse(authority).success).toBe(true);
  });

  it('падає без checkedAt (spec §10)', () => {
    const { checkedAt: _omitted, ...withoutDate } = authority;
    expect(AuthoritySchema.safeParse(withoutDate).success).toBe(false);
  });
});

describe('Procedure', () => {
  const procedure = {
    id: 'B2-employment-s23',
    category: 'B',
    title: { uk: 'Працевлаштування', sk: 'Zamestnanie' },
    validFrom: '2026-07-15',
    reviewStatus: 'draft',
    sourceIds: ['slovlex-404-2011'],
  };

  it('приймає чернетку маршруту', () => {
    expect(ProcedureSchema.safeParse(procedure).success).toBe(true);
  });

  it('падає, якщо назва є лише однією мовою (CLAUDE.md §2.7)', () => {
    const onlyUk = { ...procedure, title: { uk: 'Працевлаштування' } };
    expect(ProcedureSchema.safeParse(onlyUk).success).toBe(false);
  });

  it('не має поля status — статус для користувача виводиться з reviewStatus', () => {
    expect(ProcedureSchema.safeParse({ ...procedure, status: 'incomplete' }).success).toBe(false);
  });
});

describe('publicStatus', () => {
  const cases = [
    ['draft', 'incomplete'],
    ['source_verified', 'incomplete'],
    ['blocked', 'incomplete'],
    ['superseded', 'incomplete'],
    ['legally_reviewed', 'reviewed'],
    ['published', 'reviewed'],
  ] as const;

  it.each(cases)('%s → %s', (input, expected) => {
    expect(publicStatus(input)).toBe(expected);
  });
});

describe('гейти збірки', () => {
  it('pnpm validate проходить на поточному контенті', () => {
    const run = (script: string) =>
      execFileSync(process.execPath, [`scripts/${script}`], { cwd: root, encoding: 'utf8' });
    expect(run('validate-content.ts')).toContain('✓');
    expect(run('check-locales.ts')).toContain('✓');
  });
});
