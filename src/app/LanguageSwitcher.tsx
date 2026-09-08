import { Link, useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { locales } from '../lib/content/site';

// Перемикач мови міняє тільки адресу: /uk/about ↔ /sk/about.
// Вибір мови ніде не зберігається — посилання самодостатнє.
export function LanguageSwitcher() {
  const { lang } = useParams();
  const { pathname } = useLocation();
  const { t } = useTranslation();

  const rest = lang ? pathname.replace(new RegExp(`^/${lang}`), '') : '/';

  return (
    <div className="lang-switch" role="group" aria-label={t('a11y.language')}>
      {locales.map((code) => (
        <Link
          key={code}
          to={`/${code}${rest || '/'}`}
          aria-current={code === lang ? 'true' : undefined}
          lang={code}
        >
          {t(`lang.${code}`)}
        </Link>
      ))}
    </div>
  );
}
