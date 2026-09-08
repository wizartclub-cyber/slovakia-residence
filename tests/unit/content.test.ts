import { describe, expect, it } from 'vitest';
import { authorities, fees, finder, procedures, sources, thresholds } from '../../src/lib/content/index.ts';

const allSourceIds = new Set(sources.map((s) => s.id));

describe('джерела', () => {
  it('завантажені з content/sources', () => {
    expect(sources.length).toBeGreaterThanOrEqual(20);
  });

  it('id унікальні', () => {
    expect(new Set(sources.map((s) => s.id)).size).toBe(sources.length);
  });

  it('кожне має назву і орган', () => {
    for (const s of sources) {
      expect(s.title.length).toBeGreaterThan(0);
      expect(s.authority.length).toBeGreaterThan(0);
    }
  });

  it('жодне джерело не піднімалося вище за source_verified — юрист ще не працював', () => {
    for (const s of sources) {
      expect(['draft', 'source_verified']).toContain(s.reviewStatus);
    }
  });

  it('source_verified стоїть лише там, де є збережена копія з контрольною сумою', () => {
    for (const s of sources) {
      if (s.reviewStatus === 'source_verified') expect(s.sha256).not.toBeNull();
    }
  });

  it('контрольна сума є лише там, де є збережена копія', () => {
    for (const s of sources) {
      if (s.sha256 !== null) expect(s.snapshotPath).not.toBeNull();
    }
  });
});

describe('маршрути', () => {
  it('шаблон не потрапляє в дані сайту', () => {
    for (const p of procedures) expect(p.id.startsWith('_')).toBe(false);
  });

  it('жоден маршрут ще не перевірений юристом', () => {
    for (const p of procedures) {
      expect(p.reviewStatus).toBe('draft');
      expect(p.reviewer).toBeNull();
    }
  });

  it('жоден маршрут не заявляє, що його умови повні — інакше сайт обіцяв би придатність', () => {
    for (const p of procedures) expect(p.conditionsComplete).toBe(false);
  });

  it('кожен маршрут-вказівник чесно перелічує, чого в ньому бракує', () => {
    for (const p of procedures) expect(p.openQuestions.length).toBeGreaterThan(0);
  });

  it('кожен маршрут має правову основу і орган', () => {
    for (const p of procedures) {
      expect(p.legalBasis.length).toBeGreaterThan(0);
      expect(p.authorityIds.length).toBeGreaterThan(0);
    }
  });

  it('назва є обома мовами (CLAUDE.md §2.7)', () => {
    for (const p of procedures) {
      expect(p.title.uk.length).toBeGreaterThan(0);
      expect(p.title.sk.length).toBeGreaterThan(0);
    }
  });

  it('кожне правило придатності має джерело', () => {
    for (const p of procedures) {
      for (const rule of p.eligibilityRules) expect(rule.sourceIds.length).toBeGreaterThan(0);
    }
  });
});

describe('опитувальник', () => {
  it('не питає нічого, що ідентифікує людину (spec §8)', () => {
    const allowed = ['citizenshipGroup', 'currentStatus', 'location', 'purpose', 'family'];
    for (const step of finder.steps) expect(allowed).toContain(step.field);
  });

  it('кожне питання має щонайменше два варіанти', () => {
    for (const step of finder.steps) expect(step.options.length).toBeGreaterThanOrEqual(2);
  });
});

describe('посилання між даними', () => {
  const referencing = [
    ...authorities.map((a) => ['authority', a.id, a.sourceIds] as const),
    ...procedures.map((p) => ['procedure', p.id, p.sourceIds] as const),
    ...fees.map((f) => ['fee', f.id, f.sourceIds] as const),
    ...thresholds.map((t) => ['threshold', t.id, t.sourceIds] as const),
  ];

  it.each(referencing)('%s "%s" посилається лише на наявні джерела', (_kind, _id, ids) => {
    for (const id of ids) expect(allSourceIds.has(id)).toBe(true);
  });
});

describe('органи', () => {
  it('кожен має дату перевірки і джерело (spec §10)', () => {
    for (const a of authorities) {
      expect(a.checkedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(a.sourceIds.length).toBeGreaterThan(0);
    }
  });
});

describe('збори', () => {
  it('усі суми в євро і невід\'ємні', () => {
    for (const f of fees) {
      expect(f.currency).toBe('EUR');
      expect(f.amount).toBeGreaterThanOrEqual(0);
    }
  });

  it('id унікальні', () => {
    expect(new Set(fees.map((f) => f.id)).size).toBe(fees.length);
  });

  it('жоден збір ще не позначений як перевірений юристом', () => {
    for (const f of fees) expect(f.reviewStatus).toBe('draft');
  });
});
