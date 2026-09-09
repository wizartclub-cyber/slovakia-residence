import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePageTitle } from '../../app/usePageTitle';
import { documentById, fees, procedures } from '../../lib/content';
import { site } from '../../lib/content/site';
import { publicStatus } from '../../lib/content/schema';
import type { Procedure } from '../../lib/content/schema';

// Порядок категорій — з таксономії spec §3.
const CATEGORIES = ['A', 'B', 'C', 'D', 'E', 'F', 'G'] as const;
const GROUPS = ['third_country', 'eu_eea_ch', 'ua_temporary_protection'] as const;

/** Чи згадує маршрут цю групу заявників у своїх умовах. */
function mentionsGroup(procedure: Procedure, group: string): boolean {
  return JSON.stringify(procedure.eligibilityRules).includes(`"${group}"`);
}

export function RouteCataloguePage() {
  const { t } = useTranslation();
  const { lang } = useParams();
  const [params, setParams] = useSearchParams();
  usePageTitle(t('catalogue.title'));

  // Фільтри живуть в адресі: посилання на відфільтрований список можна
  // надіслати іншій людині. Персональних даних тут немає — лише категорії.
  const query = params.get('q') ?? '';
  const category = params.get('category') ?? '';
  const group = params.get('group') ?? '';

  function update(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value === '') next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  }

  // Порівняння живе в адресі: підбірку можна надіслати посиланням.
  const compareIds = (params.get('compare') ?? '').split(',').filter(Boolean);
  const compared = compareIds
    .map((id) => procedures.find((p) => p.id === id))
    .filter((p): p is Procedure => p !== undefined)
    .slice(0, 3);

  function toggleCompare(id: string) {
    const next = compareIds.includes(id)
      ? compareIds.filter((x) => x !== id)
      : [...compareIds, id].slice(0, 3);
    update('compare', next.join(','));
  }

  const needle = query.trim().toLowerCase();
  const matches = procedures.filter((p) => {
    if (category && p.category !== category) return false;
    if (group && !mentionsGroup(p, group)) return false;
    if (needle === '') return true;
    return [p.title.uk, p.title.sk, ...p.legalBasis, p.id]
      .join(' ')
      .toLowerCase()
      .includes(needle);
  });

  const groups = CATEGORIES.map((c) => ({
    category: c,
    items: matches.filter((p) => p.category === c),
  })).filter((g) => g.items.length > 0);

  return (
    <>
      <h1 tabIndex={-1}>{t('catalogue.title')}</h1>
      <p>{t('catalogue.intro')}</p>
      <p className="route-page__note">{t('catalogue.coverage', { count: procedures.length })}</p>

      <div className="catalogue__filters no-print">
        <div className="catalogue__search">
          <label htmlFor="catalogue-filter">{t('catalogue.filterLabel')}</label>
          <input
            id="catalogue-filter"
            type="search"
            value={query}
            onChange={(e) => update('q', e.target.value)}
            placeholder={t('catalogue.filterPlaceholder')}
            autoComplete="off"
          />
        </div>

        <div className="catalogue__select">
          <label htmlFor="filter-category">{t('catalogue.filterCategory')}</label>
          <select
            id="filter-category"
            value={category}
            onChange={(e) => update('category', e.target.value)}
          >
            <option value="">{t('catalogue.filterAny')}</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {t(`catalogue.category.${c}`)}
              </option>
            ))}
          </select>
        </div>

        <div className="catalogue__select">
          <label htmlFor="filter-group">{t('catalogue.filterGroup')}</label>
          <select id="filter-group" value={group} onChange={(e) => update('group', e.target.value)}>
            <option value="">{t('catalogue.filterAny')}</option>
            {GROUPS.map((g) => (
              <option key={g} value={g}>
                {t(`answer.citizenshipGroup.${g}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="route-page__note" role="status" aria-live="polite">
        {t('catalogue.found', { count: matches.length })}
      </p>

      {matches.length === 0 && <p className="card">{t('catalogue.nothing')}</p>}

      {compared.length >= 2 && <ComparisonTable routes={compared} lang={lang} />}
      {compared.length === 1 && (
        <p className="route-page__note">{t('compare.pickMore')}</p>
      )}

      {groups.map((group) => (
        <section key={group.category}>
          <h2>{t(`catalogue.category.${group.category}`)}</h2>
          <ul className="catalogue">
            {group.items.map((procedure) => (
              <RouteCard
                key={procedure.id}
                procedure={procedure}
                lang={lang}
                compared={compareIds.includes(procedure.id)}
                onCompare={() => toggleCompare(procedure.id)}
                compareFull={compareIds.length >= 3 && !compareIds.includes(procedure.id)}
              />
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}

function RouteCard({
  procedure,
  lang,
  compared,
  onCompare,
  compareFull,
}: {
  procedure: Procedure;
  lang: string | undefined;
  compared: boolean;
  onCompare: () => void;
  compareFull: boolean;
}) {
  const { t } = useTranslation();
  const status = publicStatus(procedure.reviewStatus);
  const routeFees = fees.filter((f) => procedure.feeRuleIds.includes(f.id));
  const from = routeFees.length > 0 ? Math.min(...routeFees.map((f) => f.amount)) : null;
  const decision = procedure.deadlines?.find((d) => d.phase === 'decision' && d.days !== null);

  return (
    <li className="card catalogue__item">
      <h3 className="catalogue__title">
        <Link to={`/${lang}/route/${procedure.id}`}>
          {lang === 'sk' ? procedure.title.sk : procedure.title.uk}
        </Link>
      </h3>

      <p className="catalogue__meta">
        <span className={`badge badge--${status === 'reviewed' ? 'success' : 'warning'}`}>
          {t(`results.status.${status}`)}
        </span>
        <span>{procedure.legalBasis.join(' · ')}</span>
      </p>

      <p className="catalogue__compare no-print">
        <label>
          <input type="checkbox" checked={compared} disabled={compareFull} onChange={onCompare} />{' '}
          {t('compare.add')}
        </label>
      </p>

      <dl className="catalogue__facts">
        <div>
          <dt>{t('route.decisionDeadline')}</dt>
          <dd>
            {decision ? t('catalogue.days', { days: decision.days }) : t('summary.needsCheck')}
          </dd>
        </div>
        <div>
          <dt>{t('route.fees')}</dt>
          <dd>{from !== null ? t('catalogue.feeFrom', { amount: from }) : t('summary.needsCheck')}</dd>
        </div>
        <div>
          <dt>{t('baseline.label')}</dt>
          <dd>{formatDate(site.legalBaseline.date)}</dd>
        </div>
      </dl>
    </li>
  );
}

/** Скільки коштує маршрут: діапазон, бо суми залежать від каналу подання. */
function feeRange(procedure: Procedure): string | null {
  const list = fees.filter((f) => procedure.feeRuleIds.includes(f.id));
  if (list.length === 0) return null;
  const min = Math.min(...list.map((f) => f.amount));
  const max = Math.max(...list.map((f) => f.amount));
  return min === max ? `${min} EUR` : `${min}–${max} EUR`;
}

/**
 * Порівняння до трьох маршрутів. Порядок рядків не змінюється залежно від
 * «вигідності»: це зіставлення фактів, а не рейтинг.
 */
function ComparisonTable({ routes, lang }: { routes: Procedure[]; lang: string | undefined }) {
  const { t } = useTranslation();

  const rows: Array<[string, (p: Procedure) => string]> = [
    [t('route.grantedFor'), (p) => (p.grantedFor ? firstSentence(localized(p.grantedFor, lang)) : '—')],
    [
      t('route.decisionDeadline'),
      (p) => {
        const d = p.deadlines?.find((x) => x.phase === 'decision' && x.days !== null);
        return d ? t('catalogue.days', { days: d.days }) : '—';
      },
    ],
    [t('route.fees'), (p) => feeRange(p) ?? '—'],
    [t('compare.documents'), (p) => String(p.documentIds.filter((id) => !documentById(id)?.afterDecision).length)],
    [
      t('compare.workRight'),
      (p) => (p.cardStatesWorkRight === true ? t('compare.yes') : t('compare.unknown')),
    ],
    [
      t('compare.afterDecision'),
      (p) => String(p.documentIds.filter((id) => documentById(id)?.afterDecision).length),
    ],
  ];

  return (
    <section className="comparison" aria-labelledby="compare-title">
      <h2 id="compare-title">{t('compare.title')}</h2>
      <div className="comparison__scroll" tabIndex={0} role="region" aria-labelledby="compare-title">
        <table>
          <thead>
            <tr>
              <th scope="col">{t('compare.field')}</th>
              {routes.map((p) => (
                <th key={p.id} scope="col">
                  {lang === 'sk' ? p.title.sk : p.title.uk}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, get]) => (
              <tr key={label}>
                <th scope="row">{label}</th>
                {routes.map((p) => (
                  <td key={p.id}>{get(p)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="route-page__note">{t('compare.note')}</p>
    </section>
  );
}

function localized(value: { uk: string; sk: string }, lang: string | undefined): string {
  return lang === 'sk' ? value.sk : value.uk;
}

function firstSentence(text: string): string {
  const end = text.indexOf('. ');
  return end > 0 ? text.slice(0, end + 1) : text;
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}
