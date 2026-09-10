import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
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
    // Білий список навмисно жорсткий: додати сюди поле можна лише свідомо,
    // переконавшись, що воно описує СИТУАЦІЮ, а не конкретну людину.
    const allowed = [
      'citizenshipGroup',
      'currentStatus',
      'location',
      'purpose',
      'family',
      'specialStatus',
    ];
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

describe('органи: адреси й округи', () => {
  // Рантайм-лоадер не застосовує Zod-дефолти, тож поле може бути й undefined.
  const withAddress = authorities.filter((a) => a.address != null);
  const ocp = authorities.filter((a) => a.type === 'OCP_PZ' && (a.districts ?? []).length > 0);

  it('щонайменше 13 підрозділів іноземної поліції мають адресу', () => {
    expect(withAddress.filter((a) => a.type === 'OCP_PZ').length).toBeGreaterThanOrEqual(13);
  });

  it('усі 13 відділів мають перелік округів', () => {
    expect(ocp.length).toBe(13);
  });

  it('жоден округ не віднесений до двох відділів одночасно', () => {
    const seen = new Map<string, string>();
    for (const a of ocp) {
      for (const d of a.districts ?? []) {
        expect(seen.get(d)).toBeUndefined();
        seen.set(d, a.id);
      }
    }
    // Словаччина має 79 округів; Братислава і Кошице подані групами,
    // тому рядків менше — перевіряємо лише порядок величини.
    expect(seen.size).toBeGreaterThanOrEqual(60);
  });

  it.each(withAddress.map((a) => [a.id, a] as const))('%s: координати в межах Словаччини', (_id, a) => {
    if (a.coordinates == null) return;
    expect(a.coordinates.lat).toBeGreaterThan(47.7);
    expect(a.coordinates.lat).toBeLessThan(49.7);
    expect(a.coordinates.lon).toBeGreaterThan(16.8);
    expect(a.coordinates.lon).toBeLessThan(22.6);
  });

  it('телефони записані у міжнародному форматі', () => {
    for (const a of authorities) {
      for (const phone of a.phones ?? []) expect(phone).toMatch(/^\+421[\d ]+$/);
    }
  });

  it('години прийому є в кожного відділу іноземної поліції', () => {
    for (const a of authorities.filter((x) => x.type === 'OCP_PZ' && x.address != null)) {
      expect((a.officeHours ?? []).length).toBe(5);
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

  it('жоден збір не піднятий вище за source_verified — юрист ще не працював', () => {
    for (const f of fees) expect(['draft', 'source_verified']).toContain(f.reviewStatus);
  });

  it('збір зі статусом source_verified має позицію тарифу', () => {
    // source_verified означає «взято з тексту тарифу», отже позиція має бути відома.
    for (const f of fees) {
      if (f.reviewStatus === 'source_verified') expect(f.tariffItem).not.toBeNull();
    }
  });

  it('звільнення від збору мають джерело', () => {
    for (const f of fees) {
      for (const ex of f.exemptions) expect(ex.sourceIds.length).toBeGreaterThan(0);
    }
  });
});

describe('спільні юридичні примітки', () => {
  it('підстави для відмови перелічені повністю — усі 15 із §33 ods. 6', async () => {
    const { legalNotes } = await import('../../src/lib/content/index.ts');
    const refusal = legalNotes.find((n) => n.id === 'refusal-temporary-s33-6');
    expect(refusal?.items.length).toBe(15);
  });

  it('кожна примітка має джерело і стосується наявних маршрутів', async () => {
    const { legalNotes, procedures } = await import('../../src/lib/content/index.ts');
    const ids = new Set(procedures.map((p) => p.id));
    for (const note of legalNotes) {
      expect(note.sourceIds.length).toBeGreaterThan(0);
      for (const target of note.appliesTo) expect(ids.has(target)).toBe(true);
    }
  });
});

describe('гейт посилань на закон', () => {
  it('кожен § із legalBasis існує в збереженій копії закону', () => {
    // Сам гейт живе в scripts/check-legal-basis.ts і виконується в `pnpm validate`.
    // Тут перевіряємо, що він узагалі відпрацьовує на поточних даних.
    const root = fileURLToPath(new URL('../..', import.meta.url));
    const out = execFileSync(process.execPath, ['scripts/check-legal-basis.ts'], {
      cwd: root,
      encoding: 'utf8',
    });
    expect(out).toContain('✓');
  });
});
