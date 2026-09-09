import { useTranslation } from 'react-i18next';
import { usePageTitle } from '../../app/usePageTitle';
import { sources } from '../../lib/content';
import type { Source } from '../../lib/content/schema';
import './source-library.css';

// Порядок груп: спершу закон, потім підзаконні акти, далі офіційні роз'яснення,
// бланки і в кінці вторинні джерела — це порядок юридичної сили (реєстр, sourcePriority).
const GROUP_ORDER = [
  'legislation',
  'implementing_regulation',
  'eu_law',
  'official_web_guidance',
  'administrative_guidance',
  'official_form',
  'official_fee_schedule',
  'secondary_explanatory_source',
] as const;

export function SourceLibraryPage() {
  const { t } = useTranslation();
  usePageTitle(t('sources.title'));

  const groups = GROUP_ORDER.map((type) => ({
    type,
    items: sources.filter((s) => s.sourceType === type),
  })).filter((g) => g.items.length > 0);

  const withSnapshot = sources.filter((s) => s.sha256 !== null).length;
  const needsCheck = sources.filter((s) => trust(s).some((t) => t.state === 'bad')).length;

  return (
    <>
      <h1 tabIndex={-1}>{t('sources.title')}</h1>
      <p>{t('sources.intro')}</p>

      <div className="card sources-summary">
        <p>
          {t('sources.countTotal', { count: sources.length })} ·{' '}
          {t('sources.countSnapshot', { count: withSnapshot })}
        </p>
        <p className="sources-summary__note">{t('sources.snapshotNote')}</p>
      </div>

      <details className="card legend">
        <summary>{t('sources.legendTitle')}</summary>
        <dl className="legend__list">
          {(['official', 'url', 'snapshot', 'current'] as const).map((key) => (
            <div key={key}>
              <dt>{t(`sources.trust.${key}.label`)}</dt>
              <dd>{t(`sources.trust.${key}.hint`)}</dd>
            </div>
          ))}
        </dl>
        <p className="route-page__note">{t('sources.needsCheckCount', { count: needsCheck })}</p>
      </details>

      {groups.map((group) => (
        <section key={group.type}>
          <h2>{t(`sourceType.${group.type}`)}</h2>
          <ul className="sources-list">
            {group.items.map((source) => (
              <SourceCard key={source.id} source={source} />
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}

function SourceCard({ source }: { source: Source }) {
  const { t } = useTranslation();
  const links: Array<[string, string]> = [];
  if (source.pinnedUrl) links.push([t('sources.linkPinned'), source.pinnedUrl]);
  if (source.staticUrl) links.push([t('sources.linkStatic'), source.staticUrl]);
  if (source.url) links.push([t('sources.linkOriginal'), source.url]);

  return (
    <li className="card source-card" id={source.id}>
      <h3 className="source-card__title">{source.title}</h3>

      <p className="source-card__meta">
        <span>{source.authority}</span>
        {source.lawNumber && <span> · {source.lawNumber}</span>}
        {source.formCode && <span> · {source.formCode}</span>}
        {source.locale && <span> · {source.locale}</span>}
      </p>

      {/* Чотири незалежні ознаки надійності. Колір ніколи не єдиний носій
          змісту: у кожної є знак і текст. */}
      <ul className="trust">
        {trust(source).map((signal) => (
          <li key={signal.key} className={`trust__item trust__item--${signal.state}`}>
            <span aria-hidden="true">{signal.state === 'good' ? '✓' : signal.state === 'bad' ? '✗' : '!'}</span>
            <span>{t(`sources.trust.${signal.key}.${signal.state}`)}</span>
          </li>
        ))}
      </ul>

      <p className="source-card__badges">
        {source.checkedAt && (
          <span className="source-card__checked">
            {t('sources.checkedAt')}: <time dateTime={source.checkedAt}>{formatDate(source.checkedAt)}</time>
          </span>
        )}
      </p>

      {(source.effectiveFrom || source.effectiveTo) && (
        <p className="source-card__meta">
          {t('sources.effective')}: {source.effectiveFrom ? formatDate(source.effectiveFrom) : '…'}
          {' — '}
          {source.effectiveTo ? formatDate(source.effectiveTo) : t('sources.openEnded')}
        </p>
      )}

      {links.length > 0 ? (
        <p className="source-card__links">
          {links.map(([label, href]) => (
            <a key={href} href={href} rel="noreferrer noopener" target="_blank">
              {label}
            </a>
          ))}
        </p>
      ) : (
        <p className="source-card__missing">{t('sources.noUrl')}</p>
      )}

      {(source.sha256 || source.evidence) && (
        <details className="source-card__tech">
          <summary>{t('sources.technical')}</summary>
          {source.sha256 && (
            <p className="source-card__hash">
              {t('sources.checksum')}: <code>{source.sha256}</code>
            </p>
          )}
          {source.snapshotPath && (
            <p className="route-page__note">{source.snapshotPath}</p>
          )}
          <p className="route-page__note">
            {t(`registryStatus.${source.registryStatus}`)}
          </p>
        </details>
      )}

      {source.evidence && (
        <p className="source-card__evidence">
          <span className="source-card__evidence-label">{t('sources.evidenceLabel')}</span>
          {source.evidence}
        </p>
      )}
    </li>
  );
}

type TrustSignal = { key: 'official' | 'url' | 'snapshot' | 'current'; state: 'good' | 'warn' | 'bad' };

/** Чотири ознаки надійності джерела, кожна незалежна від інших. */
function trust(source: Source): TrustSignal[] {
  return [
    {
      key: 'official',
      state: source.sourceType === 'secondary_explanatory_source' ? 'warn' : 'good',
    },
    { key: 'url', state: source.url === null ? 'bad' : source.checkedAt ? 'good' : 'warn' },
    { key: 'snapshot', state: source.sha256 ? 'good' : 'bad' },
    { key: 'current', state: source.potentiallyStale ? 'warn' : 'good' },
  ];
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}
