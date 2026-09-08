# SNAPSHOT.md — стан на 2026-09-08

**Де ми:** Slice 2 закрито. Активний slice: **3** (опитувальник Route Finder + екран результатів).

**Живий сайт:** https://wizartclub-cyber.github.io/slovakia-residence/ (деплой автоматичний при пуші в main)

**Що працює:** дві мови в адресі (`/uk/`, `/sk/`) · дисклеймер і рядок «Стан права: 01.09.2026 · юридичне рев'ю не завершене» · сторінки Головна / Джерела / Про проєкт / Приватність / 404 · сторінка «Джерела» з 26 записами, датами перевірки та статусами · 147 unit + 43 e2e тестів.

**Движок правил:** `src/lib/rules/` — чисті функції, тризначна логіка (є / немає / не знаю), п'ять результатів (`not_applicable`, `excluded`, `not_eligible`, `possible`, `eligible`). Маршрутів у даних ще немає — движок перевірено на синтетичних фікстурах.

**Дані в `content/`:** 26 джерел (згенеровані з реєстру) · 1 поріг (životné minimum 295.22) · 4 органи · 25 позицій зборів. Усе зі статусом `draft` — юридичного рев'ю не було.

**Гейти (падає збірка):** немає `sourceIds` · джерело не з реєстру · `published`/`legally_reviewed` без `reviewer` · ключ є в uk і немає в sk · невідоме поле в yaml · `validTo` раніший за baseline · орган без `checkedAt`.

**Команди:** `pnpm dev` → http://localhost:5173/slovakia-residence/ · `pnpm validate` · `pnpm test` · `pnpm build` · `pnpm test:e2e` · `pnpm sources:build` (перегенерувати `content/sources/` з реєстру)

**Блокери:** снапшоти джерел не зняті (власник: `python3 scripts/download_and_hash.py`, див. RUN_ME.md) — доки їх немає, жодне джерело не може стати `source_verified`. Три джерела в реєстрі без url.

**Пам'ятати:** маршрут для справ, розпочатих до зміни закону, не може мати `validFrom` = дата зміни (див. PLAN.md) · нова сторінка додається в `content/ui/site.yaml`, інакше GitHub Pages не створить для неї файл · `content/sources/*.yaml` не редагувати руками, правити реєстр і запускати `pnpm sources:build`.

**Не чіпати:** `sources/snapshots/` (генерується скриптом) · `document-registry-v0.3.yaml` (історія) · спека та SOURCE_AUDIT.
