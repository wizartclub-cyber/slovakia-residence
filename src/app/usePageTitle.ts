import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Заголовок вкладки для кожної сторінки окремо (WCAG 2.2, критерій 2.4.2).
 * Один заголовок на весь сайт залишав би людину зі скрінрідером без розуміння,
 * де вона опинилася, і плутав би вкладки між собою.
 */
export function usePageTitle(title: string) {
  const { t } = useTranslation();
  const siteName = t('site.title');

  useEffect(() => {
    document.title = title ? `${title} · ${siteName}` : siteName;
  }, [title, siteName]);
}
