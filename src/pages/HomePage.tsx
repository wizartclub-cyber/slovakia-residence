import { useTranslation } from 'react-i18next';
import { Disclaimer } from '../components/Disclaimer';

export function HomePage() {
  const { t } = useTranslation();

  return (
    <>
      <h1>{t('home.title')}</h1>
      <p>{t('home.intro')}</p>

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
