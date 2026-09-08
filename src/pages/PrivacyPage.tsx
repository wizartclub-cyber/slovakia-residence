import { useTranslation } from 'react-i18next';

export function PrivacyPage() {
  const { t } = useTranslation();

  return (
    <>
      <h1>{t('privacy.title')}</h1>
      <p>{t('privacy.summary')}</p>

      <h2>{t('privacy.noStorageTitle')}</h2>
      <p>{t('privacy.noStorageBody')}</p>

      <h2>{t('privacy.noNetworkTitle')}</h2>
      <p>{t('privacy.noNetworkBody')}</p>

      <h2>{t('privacy.hostingTitle')}</h2>
      <p>{t('privacy.hostingBody')}</p>
    </>
  );
}
