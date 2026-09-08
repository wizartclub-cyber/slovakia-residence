import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import uk from '../locales/uk/common.json';
import sk from '../locales/sk/common.json';
import { defaultLocale } from '../lib/content/site';

// Мова визначається адресою сторінки (/uk/…, /sk/…), а не сховищем браузера:
// детектор мови навмисно не підключений — він писав би в localStorage (CLAUDE.md §2.1).
void i18n.use(initReactI18next).init({
  resources: {
    uk: { common: uk },
    sk: { common: sk },
  },
  lng: defaultLocale,
  fallbackLng: false,
  defaultNS: 'common',
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
