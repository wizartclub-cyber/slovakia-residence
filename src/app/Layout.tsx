import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './LanguageSwitcher';
import { RouteAnnouncer } from './RouteAnnouncer';
import { LegalBaselineNotice } from '../components/LegalBaselineNotice';
import { defaultLocale, isLocale, site } from '../lib/content/site';

export function Layout() {
  const { lang } = useParams();
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isLocale(lang) && i18n.language !== lang) void i18n.changeLanguage(lang);
    if (isLocale(lang)) document.documentElement.lang = lang;
  }, [lang, i18n]);

  // Перехід на іншу сторінку закриває меню: інакше воно лишається розкритим
  // і накриває зміст, заради якого людина і натиснула посилання.
  useEffect(() => setNavOpen(false), [pathname]);

  // Escape закриває меню і повертає фокус на кнопку — інакше фокус
  // залишився б на схованому посиланні.
  useEffect(() => {
    if (!navOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setNavOpen(false);
      toggleRef.current?.focus();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [navOpen]);

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
          <button
            aria-controls="site-nav"
            aria-expanded={navOpen}
            className="site-nav-toggle"
            onClick={() => setNavOpen((open) => !open)}
            ref={toggleRef}
            type="button"
          >
            <span aria-hidden="true" className="site-nav-toggle__bars" data-open={navOpen} />
            {t(navOpen ? 'a11y.closeMenu' : 'a11y.openMenu')}
          </button>
          {/* На телефоні меню і вибір мови ховаються разом: якби перемикач лишився
              в шапці, він займав би окремий рядок і половину виграшу було б з'їдено.
              На широкому екрані обгортка прозора (display: contents) — верстка та сама. */}
          <div className="site-header__menu" data-open={navOpen} id="site-nav">
            <nav aria-label={t('a11y.mainNav')} className="site-nav">
              {site.nav.map((item) => (
                <NavLink key={item.key} to={`/${lang}/${item.path}`} end>
                  {t(`nav.${item.key}`)}
                </NavLink>
              ))}
            </nav>
            <LanguageSwitcher />
          </div>
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
