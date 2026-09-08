import { useTranslation } from 'react-i18next';
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

  const groups = GROUP_ORDER.map((type) => ({
    type,
    items: sources.filter((s) => s.sourceType === type),
  })).filter((g) => g.items.length > 0);

  const withSnapshot = sources.filter((s) => s.sha256 !== null).length;

  return (
    <>
      <h1>{t('sources.title')}</h1>
      <p>{t('sources.intro')}</p>

      <div className="card sources-summary">
        <p>
          {t('sources.countTotal', { count: sources.length })} ·{' '}
          {t('sources.countSnapshot', { count: withSnapshot })}
        </p>
        <p className="sources-summary__note">{t('sources.snapshotNote')}</p>
      </div>

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
    <li className="card source-card">
      <h3 className="source-card__title">{source.title}</h3>

      <p className="source-card__meta">
        <span>{source.authority}</span>
        {source.lawNumber && <span> · {source.lawNumber}</span>}
        {source.formCode && <span> · {source.formCode}</span>}
        {source.locale && <span> · {source.locale}</span>}
      </p>

      <p className="source-card__badges">
        <span className={`badge badge--${source.registryStatus === 'url_verified' ? 'success' : 'warning'}`}>
          {t(`registryStatus.${source.registryStatus}`)}
        </span>
        {source.potentiallyStale && (
          <span className="badge badge--warning">{t('sources.stale')}</span>
        )}
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

      {source.evidence && (
        <p className="source-card__evidence">
          <span className="source-card__evidence-label">{t('sources.evidenceLabel')}</span>
          {source.evidence}
        </p>
      )}
    </li>
  );
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}
