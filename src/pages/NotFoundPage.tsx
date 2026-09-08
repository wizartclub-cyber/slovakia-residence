import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { defaultLocale } from '../lib/content/site';

export function NotFoundPage() {
  const { lang } = useParams();
  const { t } = useTranslation();

  return (
    <>
      <h1>{t('notFound.title')}</h1>
      <p>{t('notFound.body')}</p>
      <p>
        <Link to={`/${lang ?? defaultLocale}/`}>{t('notFound.home')}</Link>
      </p>
    </>
  );
}
