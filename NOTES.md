# NOTES.md — журнал сесій (append-only, новіше знизу)

Формат запису:
```
## YYYY-MM-DD · Slice N · <назва>
Зроблено: …
Рішення: … (чому)
Не зроблено / перенесено: …
Питання власнику: …
Стан тестів: pnpm validate ✓/✗ · pnpm test ✓/✗
```
Без коду — код у git. Без переказу відповідей агента — тільки зміст рішень.

---

## 2026-09-07 · Slice — · Підготовка (Cowork)
Зроблено: спека v0.3 з Release-1 рішеннями; реєстр джерел v0.4 (20 ресурсів, url-перевірка); SOURCE_AUDIT_v0.4; `scripts/download_and_hash.py` + RUN_ME.md; файли налаштування Claude Code (CLAUDE.md, PLAN.md, .claude/, workflows).
Рішення: перший реліз — 6 маршрутів + решта зі статусом `incomplete`; uk+sk; без PDF-генератора; GitHub Pages; рухомий legal baseline; видавець — благодійна організація.
Не зроблено: снапшоти джерел (немає доступу до mzv/slov-lex із хмари) — власник запускає скрипт локально.
Питання власнику: назва організації, домен, юрист.
Стан тестів: проєкт ще не створено.

## 2026-09-08 · Slice 0 · Скелет і гейти
Зроблено: каркас React 18 + TS strict + Vite 6 (створено вручну, без інтерактивного `pnpm create vite` у непорожній папці); `src/styles/tokens.css` дослівно з DESIGN_SYSTEM_TZ.md §3.1 + global.css; i18next uk/sk без детектора мови; роутер із мовою в шляху (`/uk/…`, `/sk/…`) і basename `/slovakia-residence/`; сторінки Home/About/Privacy/404 + дисклеймер + рядок «стан права»; Zod-схеми spec §7 (`src/lib/content/schema.ts`); гейти `scripts/validate-content.ts` і `scripts/check-locales.ts`; `scripts/postbuild-pages.mjs` (404.html + .nojekyll); ESLint/Prettier; 19 unit-тестів; 13 e2e (Playwright, desktop + mobile) на **зібраному** сайті; `.github/workflows/deploy.yml` оновлено (Node 24, pnpm 12, додано `pnpm lint`).

Рішення:
- Хостинг `wizartclub-cyber/slovakia-residence` → `https://wizartclub-cyber.github.io/slovakia-residence/`; чисті адреси, бо для довідника важливий пошук; 404.html = копія index.html (GitHub Pages не вміє SPA-роутинг інакше).
- Мова живе в адресі, а не в сховищі. Детектор мови i18next навмисно не підключено: він пише в localStorage, що заборонено CLAUDE.md §2.1. Побічна вигода — посилання можна надіслати конкретною мовою.
- CSP лежить у `index.html` (`connect-src 'none'` — сайт технічно не може нікуди звернутися). У dev-режимі метатег послаблюється плагіном, бо Vite потребує websocket; у `dist/` лишається суворий. GitHub Pages не вміє заголовків відповіді — це відоме обмеження spec §9, `frame-ancestors` тому не ставимо (у meta воно все одно ігнорується).
- Юридичні YAML вбудовуються у збірку vite-плагіном (`contentYaml`), а не завантажуються мережею — офлайн і без запитів.
- З шаблону маршруту прибрано поле `status`: воно дублювало `reviewStatus`. Статус для користувача виводить `publicStatus()` — одна правда замість двох.
- Zod-схеми `.strict()`: невідоме поле в yaml = помилка збірки, щоб описка не зникла з очей.
- ESLint забороняє `localStorage`/`sessionStorage`/`indexedDB` у `src/` (виняток — тести приватності, які саме доводять, що там порожньо).
- CSS вручну, без Tailwind: менше залежностей, кольори в одному файлі.
- Реєстр джерел: додано 6 записів зі статусом `fetch_pending` — `opatrenie-155-2026`, `slovlex-145-1995`, `slovlex-5-2004`, `minv-residence-guides`, `slovensko-sk-eservices`, `minv-hlasenie-pobytu-form`. У трьох `url: null`, бо перевіреної адреси немає і вгадувати темпоральний шлях Slov-Lex не можна. `download_and_hash.py` пропатчено: ресурс без url пропускається з поясненням, а не валить увесь запуск.
- Технічні вимушені: pnpm поставлено в `~/.npm-global` (на `/usr/local` немає прав, `sudo` заборонено), PATH дописано в `~/.zshrc`; vitest 2 → 3 через конфлікт типів із Vite 6; Node 24 у CI, бо він виконує `.ts`-скрипти нативно і не потрібна додаткова залежність.
- e2e ганяються на зібраному сайті (`build` + `preview`), а не на dev-сервері: у dev CSP послаблений, і перевірка приватності була б несправжньою.

Не зроблено / перенесено: снапшоти джерел (власник, `RUN_ME.md`); e2e в CI і axe/WCAG-прохід — Slice 6 за планом; жодних юридичних даних (Slice 1); GitHub Pages у налаштуваннях репозиторію ще не ввімкнено; пуш не робився.

Питання власнику:
1. Назва благодійної організації — у текстах стоять плейсхолдери `[НАЗВА ОРГАНІЗАЦІЇ]` / `[NÁZOV ORGANIZÁCIE]` (файли `src/locales/uk|sk/common.json`, ключі `about.publisher` і `footer.publisher`).
2. Ім'я юриста для поля `reviewer`.
3. Офіційні URL для `opatrenie-155-2026` (životné minimum), пінованої версії `slovlex-5-2004` і бланка `minv-hlasenie-pobytu-form` — без них ці джерела не можна знімати снапшотом.
4. Чи буде посилання на послуги власника і де саме.

Стан тестів: `pnpm lint` ✓ · `pnpm validate` ✓ · `pnpm test` ✓ (19) · `pnpm build` ✓ · `pnpm test:e2e` ✓ (13 пройшло, 1 пропущено — Tab на мобільному Safari).

### Доповнення того ж дня (після першого деплою)
- CI впав з першого разу: версія pnpm була задана і в workflow, і в `packageManager` у package.json. Лишили одне джерело правди — package.json.
- GitHub Pages увімкнено через API (`build_type: workflow`). Сайт живий: https://wizartclub-cyber.github.io/slovakia-residence/
- Виявлено після деплою: SPA-фолбек через `404.html` віддавав `/uk/` і `/sk/about` зі **статусом 404**. Людина бачить нормальну сторінку, а пошукові системи такі адреси не індексують — тобто причина, з якої обрали чисті адреси, не працювала. Виправлено: `postbuild-pages.mjs` створює справжній `index.html` для кожної адреси зі списку в `content/ui/site.yaml` (мови × пункти меню). Перевірено на живому сайті: `/uk/` → 200, `/uk/about` → 301 на `/uk/about/` → 200, неіснуюча адреса → чесний 404 із дружньою сторінкою. Додано 7 e2e-перевірок, щоб це не зламалося непомітно. Наслідок для наступних slice: **нова сторінка додається в `content/ui/site.yaml`**, інакше вона працюватиме лише при переході всередині сайту.
