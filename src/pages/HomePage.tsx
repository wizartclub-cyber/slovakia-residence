import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Disclaimer } from '../components/Disclaimer';

export function HomePage() {
  const { t } = useTranslation();
  const { lang } = useParams();

  return (
    <>
      <h1>{t('home.title')}</h1>
      <p>{t('home.intro')}</p>

      <p>
        <Link className="button" to={`/${lang}/finder`}>
          {t('home.cta')}
        </Link>
      </p>

      <Disclaimer />

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
