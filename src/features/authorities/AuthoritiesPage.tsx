import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePageTitle } from '../../app/usePageTitle';
import { authorities } from '../../lib/content';
import type { Authority } from '../../lib/content/schema';
import './authorities.css';

const ORDER = [
  'OCP_PZ',
  'ASYLUM_PZ',
  'DETENTION_PZ',
  'DIPLOMATIC_MISSION',
  'UPSVAR',
  'MINISTRY',
  'MUNICIPALITY',
  'COURT',
  'OTHER',
] as const;

// Пошук має пробачати регістр і діакритику: людина набирає «zilina», а в
// джерелі «Žilina». Порівнюємо нормалізовані рядки, самі дані не чіпаємо.
function fold(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase();
}

export function AuthoritiesPage() {
  const { t } = useTranslation();
  usePageTitle(t('authorities.title'));
  const [query, setQuery] = useState('');

  const needle = fold(query.trim());
  const matches = useMemo(() => {
    if (needle.length < 2) return null;
    return authorities.filter(
      (a) =>
        (a.districts ?? []).some((d) => fold(d).includes(needle)) ||
        fold(a.officialName).includes(needle) ||
        fold(a.address ?? '').includes(needle),
    );
  }, [needle]);

  const shown = matches ?? authorities;
  const groups = ORDER.map((type) => ({
    type,
    items: shown.filter((a) => a.type === type),
  })).filter((g) => g.items.length > 0);

  return (
    <>
      <h1 tabIndex={-1}>{t('authorities.title')}</h1>
      <p>{t('authorities.intro')}</p>

      <div className="authorities__search">
        <label htmlFor="district-search">{t('authorities.searchLabel')}</label>
        <input
          autoComplete="off"
          id="district-search"
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('authorities.searchPlaceholder')}
          type="search"
          value={query}
        />
        <p className="route-page__note" role="status">
          {matches === null
            ? t('authorities.searchHint')
            : t('authorities.searchResult', { count: matches.length })}
        </p>
      </div>

      {groups.map((group) => (
        <section key={group.type}>
          <h2>{t(`authorities.type.${group.type}`)}</h2>
          <ul className="authorities">
            {group.items.map((a) => (
              <AuthorityCard authority={a} key={a.id} needle={needle} />
            ))}
          </ul>
        </section>
      ))}

      {groups.length === 0 && <p className="route-page__missing">{t('authorities.nothingFound')}</p>}
    </>
  );
}

function AuthorityCard({ authority, needle }: { authority: Authority; needle: string }) {
  const { t } = useTranslation();
  const districts = authority.districts ?? [];
  const hours = authority.officeHours ?? [];

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

      {districts.length > 0 && (
        <div className="authority__districts">
          <h4>{t('authorities.districts')}</h4>
          <ul>
            {districts.map((d) => (
              <li className={needle.length >= 2 && fold(d).includes(needle) ? 'is-match' : undefined} key={d}>
                {d}
              </li>
            ))}
          </ul>
        </div>
      )}

      {hours.length > 0 && (
        <details className="authority__hours">
          <summary>{t('authorities.hours')}</summary>
          <ul>
            {hours.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </details>
      )}

      <p className="authority__links">
        {authority.address && (
          <a
            href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(authority.address)}`}
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
