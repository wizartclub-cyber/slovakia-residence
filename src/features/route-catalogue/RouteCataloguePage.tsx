import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePageTitle } from '../../app/usePageTitle';
import { procedures } from '../../lib/content';
import { publicStatus } from '../../lib/content/schema';

// Порядок категорій — з таксономії spec §3.
const CATEGORIES = ['A', 'B', 'C', 'D', 'E', 'F', 'G'] as const;

export function RouteCataloguePage() {
  const { t } = useTranslation();
  const { lang } = useParams();
  usePageTitle(t('catalogue.title'));

  const [query, setQuery] = useState('');

  const needle = query.trim().toLowerCase();
  const matches = procedures.filter((p) => {
    if (needle === '') return true;
    const haystack = [p.title.uk, p.title.sk, ...p.legalBasis, p.id].join(' ').toLowerCase();
    return haystack.includes(needle);
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

      <div className="catalogue__search">
        <label htmlFor="catalogue-filter">{t('catalogue.filterLabel')}</label>
        <input
          id="catalogue-filter"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('catalogue.filterPlaceholder')}
          autoComplete="off"
        />
      </div>

      {/* Кількість знайденого читається вголос — інакше людина зі скрінрідером
          не дізнається, що список змінився під час набирання. */}
      <p className="route-page__note" role="status" aria-live="polite">
        {t('catalogue.found', { count: matches.length })}
      </p>

      {matches.length === 0 && <p className="card">{t('catalogue.nothing')}</p>}

      {groups.map((group) => (
        <section key={group.category}>
          <h2>{t(`catalogue.category.${group.category}`)}</h2>
          <ul className="catalogue">
            {group.items.map((procedure) => {
              const status = publicStatus(procedure.reviewStatus);
              return (
                <li key={procedure.id} className="card catalogue__item">
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
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </>
  );
}
