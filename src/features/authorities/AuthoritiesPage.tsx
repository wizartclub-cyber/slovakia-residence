import { useTranslation } from 'react-i18next';
import { usePageTitle } from '../../app/usePageTitle';
import { authorities } from '../../lib/content';
import type { Authority } from '../../lib/content/schema';
import './authorities.css';

const ORDER = ['OCP_PZ', 'DIPLOMATIC_MISSION', 'UPSVAR', 'MINISTRY', 'MUNICIPALITY', 'COURT', 'OTHER'] as const;

export function AuthoritiesPage() {
  const { t } = useTranslation();
  usePageTitle(t('authorities.title'));

  const groups = ORDER.map((type) => ({
    type,
    items: authorities.filter((a) => a.type === type),
  })).filter((g) => g.items.length > 0);

  return (
    <>
      <h1 tabIndex={-1}>{t('authorities.title')}</h1>
      <p>{t('authorities.intro')}</p>

      <div className="route-page__warning">{t('authorities.competenceWarning')}</div>

      {groups.map((group) => (
        <section key={group.type}>
          <h2>{t(`authorities.type.${group.type}`)}</h2>
          <ul className="authorities">
            {group.items.map((a) => (
              <AuthorityCard key={a.id} authority={a} />
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}

function AuthorityCard({ authority }: { authority: Authority }) {
  const { t } = useTranslation();
  const coords = authority.coordinates;

  return (
    <li className="card authority">
      <h3 className="authority__name">{authority.officialName}</h3>

      {authority.address ? (
        <p className="authority__address">{authority.address}</p>
      ) : (
        <p className="route-page__missing">{t('authorities.noAddress')}</p>
      )}

      {(authority.phones ?? []).length > 0 && (
        <p className="route-page__note">
          {t('authorities.phone')}: {(authority.phones ?? []).join(' · ')}
        </p>
      )}

      <p className="authority__links">
        {coords && (
          <a
            href={`https://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lon}#map=17/${coords.lat}/${coords.lon}`}
            rel="noreferrer noopener"
            target="_blank"
          >
            {t('authorities.showOnMap')}
          </a>
        )}
        {authority.infoUrl && (
          <a href={authority.infoUrl} rel="noreferrer noopener" target="_blank">
            {t('authorities.officialPage')}
          </a>
        )}
      </p>

      <p className="route-page__note">
        {t('sources.checkedAt')}: {formatDate(authority.checkedAt)}
      </p>

      {authority.notes && <p className="route-page__note authority__note">{authority.notes}</p>}
    </li>
  );
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}
