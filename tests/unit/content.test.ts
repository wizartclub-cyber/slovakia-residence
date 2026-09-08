import { describe, expect, it } from 'vitest';
import { authorities, fees, sources, thresholds } from '../../src/lib/content/index.ts';

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

  it('жодне ще не має статусу вище за draft — рев\'ю не було (CLAUDE.md §2.3)', () => {
    for (const s of sources) {
      expect(s.reviewStatus).toBe('draft');
    }
  });

  it('контрольна сума є лише там, де є збережена копія', () => {
    for (const s of sources) {
      if (s.sha256 !== null) expect(s.snapshotPath).not.toBeNull();
    }
  });
});

describe('посилання між даними', () => {
  const referencing = [
    ...authorities.map((a) => ['authority', a.id, a.sourceIds] as const),
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
