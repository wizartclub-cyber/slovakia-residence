import { useEffect } from 'react';
import { Link, NavLink, Navigate, Outlet, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './LanguageSwitcher';
import { RouteAnnouncer } from './RouteAnnouncer';
import { LegalBaselineNotice } from '../components/LegalBaselineNotice';
import { defaultLocale, isLocale, site } from '../lib/content/site';

export function Layout() {
  const { lang } = useParams();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (isLocale(lang) && i18n.language !== lang) void i18n.changeLanguage(lang);
    if (isLocale(lang)) document.documentElement.lang = lang;
  }, [lang, i18n]);

  if (!isLocale(lang)) return <Navigate to={`/${defaultLocale}/`} replace />;

  return (
    <div className="app">
      <RouteAnnouncer />
      <a className="skip-link" href="#main">
        {t('a11y.skipToContent')}
      </a>
      <header className="site-header">
        <div className="container site-header__inner">
          <Link className="site-header__brand" to={`/${lang}/`}>
            {t('site.title')}
          </Link>
          <nav className="site-nav" aria-label={t('a11y.mainNav')}>
            {site.nav.map((item) => (
              <NavLink key={item.key} to={`/${lang}/${item.path}`} end>
                {t(`nav.${item.key}`)}
              </NavLink>
            ))}
          </nav>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="main" id="main">
        <div className="container">
          <LegalBaselineNotice />
          <Outlet />
        </div>
      </main>

      <footer className="site-footer">
        <div className="container">
          <p>{t('footer.publisher')}</p>
          <p>{t('footer.notLegalAdvice')}</p>
        </div>
      </footer>
    </div>
  );
}
