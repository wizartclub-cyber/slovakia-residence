import { useTranslation } from 'react-i18next';
import { usePageTitle } from '../app/usePageTitle';

export function AboutPage() {
  const { t } = useTranslation();
  usePageTitle(t('about.title'));

  return (
    <>
      <h1 tabIndex={-1}>{t('about.title')}</h1>
      <p>{t('about.publisher')}</p>
      <p>{t('about.purpose')}</p>
      <p>{t('about.notAffiliated')}</p>

      <h2>{t('about.sourcesTitle')}</h2>
      <p>{t('about.sourcesBody')}</p>
    </>
  );
}
