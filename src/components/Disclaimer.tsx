import { useTranslation } from 'react-i18next';

export function Disclaimer() {
  const { t } = useTranslation();

  return (
    <section className="disclaimer" aria-labelledby="disclaimer-title">
      <h2 id="disclaimer-title" style={{ marginTop: 0 }}>
        {t('disclaimer.title')}
      </h2>
      <p>{t('disclaimer.body1')}</p>
      <p>{t('disclaimer.body2')}</p>
    </section>
  );
}
