import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Оголошення зміни сторінки для скрінрідера.
 *
 * У звичайному сайті браузер сам каже, що сторінка змінилася. У SPA переходи
 * відбуваються без перезавантаження, тому незряча людина не дізнається, що
 * опинилася деінде: вона так і лишається «на попередній сторінці», а фокус
 * висить там, де був. Це не ловить автоперевірка axe, але саме тут губиться
 * навігація (WCAG 2.2, критерії 2.4.3 і 4.1.3).
 */
export function RouteAnnouncer() {
  const { pathname } = useLocation();
  const [message, setMessage] = useState('');
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      // Перше завантаження браузер озвучує сам — не дублюємо.
      first.current = false;
      return;
    }

    // Заголовок ставить usePageTitle у тому ж циклі, тому читаємо його
    // після наступного кадру.
    const id = window.setTimeout(() => {
      setMessage(document.title);
      const heading = document.querySelector<HTMLHeadingElement>('#main h1');
      heading?.focus();
    }, 100);

    return () => window.clearTimeout(id);
  }, [pathname]);

  return (
    <div className="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
      {message}
    </div>
  );
}
