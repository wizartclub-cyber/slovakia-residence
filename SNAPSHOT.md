# SNAPSHOT.md — стан на 2026-09-08

**Де ми:** Slice 0 закрито. Сайт збирається, деплой-workflow готовий, гейти працюють. Активний slice: **1** (контент-модель + реєстр джерел).

**Живий сайт:** https://wizartclub-cyber.github.io/slovakia-residence/ (деплой автоматичний при пуші в main)

**Що працює:** дві мови в адресі (`/uk/`, `/sk/`) · дисклеймер і рядок «Стан права: 01.09.2026 · юридичне рев'ю не завершене» · сторінки Home/About/Privacy/404 · токени дизайн-системи · CSP `connect-src 'none'` у зібраному сайті · 19 unit + 20 e2e тестів.

**Гейти (падає збірка):** немає `sourceIds` · джерело не з реєстру · `published`/`legally_reviewed` без `reviewer` · ключ є в uk і немає в sk · невідоме поле в yaml · `validTo` раніший за baseline.

**Команди:** `pnpm dev` → http://localhost:5173/slovakia-residence/ · `pnpm validate` · `pnpm test` · `pnpm build` · `pnpm test:e2e`

**Блокери:** снапшоти джерел не зняті (власник: `python3 scripts/download_and_hash.py`, див. RUN_ME.md). Три джерела в реєстрі без url — потрібні офіційні адреси.

**Пам'ятати:** нова сторінка додається в `content/ui/site.yaml`, інакше GitHub Pages не створить для неї файл і пряме відкриття дасть 404.

**Наступний крок:** Slice 1 — конвертер реєстру в `content/sources/*.yaml`, поріг životné minimum із похідними значеннями, органи, збори, сторінка «Джерела».

**Не чіпати:** `sources/snapshots/` (генерується скриптом) · `document-registry-v0.3.yaml` (історія) · спека та SOURCE_AUDIT.
