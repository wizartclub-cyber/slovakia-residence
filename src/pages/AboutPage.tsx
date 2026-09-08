import { useTranslation } from 'react-i18next';

export function AboutPage() {
  const { t } = useTranslation();

  return (
    <>
      <h1>{t('about.title')}</h1>
      <p>{t('about.publisher')}</p>
      <p>{t('about.purpose')}</p>
      <p>{t('about.notAffiliated')}</p>

      <h2>{t('about.sourcesTitle')}</h2>
      <p>{t('about.sourcesBody')}</p>
    </>
  );
}
