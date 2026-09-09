import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePageTitle } from '../app/usePageTitle';
import { Disclaimer } from '../components/Disclaimer';
import { procedures } from '../lib/content';

const CATEGORIES = ['A', 'B', 'C', 'D', 'E', 'F', 'G'] as const;
const JOURNEY = ['answer', 'routes', 'documents', 'submit'] as const;

export function HomePage() {
  const { t } = useTranslation();
  usePageTitle(t('home.title'));
  const { lang } = useParams();

  return (
    <>
      <h1 tabIndex={-1}>{t('home.title')}</h1>
      <p>{t('home.intro')}</p>

      <p className="home__actions">
        <Link className="button" to={`/${lang}/finder`}>
          {t('home.cta')}
        </Link>
        <Link className="button button--secondary" to={`/${lang}/routes`}>
          {t('home.ctaAll')}
        </Link>
      </p>

      {/* Як працює довідник — чотири кроки. Це навігація, а не обіцянка
          прийняття заяви: останній крок прямо каже, що подає людина сама. */}
      <ol className="journey">
        {JOURNEY.map((key, i) => (
          <li key={key} className="journey__step">
            <span className="journey__num" aria-hidden="true">
              {i + 1}
            </span>
            <div>
              <p className="journey__title">{t(`home.journey.${key}.title`)}</p>
              <p className="journey__text">{t(`home.journey.${key}.text`)}</p>
            </div>
          </li>
        ))}
      </ol>

      <Disclaimer />

      <h2>{t('home.categoriesTitle')}</h2>
      <p>{t('home.categoriesIntro')}</p>
      <ul className="category-cards">
        {CATEGORIES.map((c) => {
          const count = procedures.filter((p) => p.category === c).length;
          if (count === 0) return null;
          return (
            <li key={c} className="card category-card">
              <h3 className="category-card__title">
                <Link to={`/${lang}/routes?category=${c}`}>{t(`catalogue.category.${c}`)}</Link>
              </h3>
              <p className="category-card__count">{t('home.routeCount', { count })}</p>
            </li>
          );
        })}
      </ul>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>{t('home.statusTitle')}</h2>
        <p>{t('home.statusBody')}</p>
      </section>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>{t('home.sourcesTitle')}</h2>
        <p>{t('home.sourcesBody')}</p>
      </section>
    </>
  );
}
