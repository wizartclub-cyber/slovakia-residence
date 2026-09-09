import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePageTitle } from '../app/usePageTitle';
import { defaultLocale } from '../lib/content/site';

export function NotFoundPage() {
  const { lang } = useParams();
  const { t } = useTranslation();
  usePageTitle(t('notFound.title'));

  return (
    <>
      <h1 tabIndex={-1}>{t('notFound.title')}</h1>
      <p>{t('notFound.body')}</p>
      <p>
        <Link to={`/${lang ?? defaultLocale}/`}>{t('notFound.home')}</Link>
      </p>
    </>
  );
}
