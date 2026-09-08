# PLAN.md — Slovakia Residence Guide, Release 1

Один slice = одна сесія Claude Code. Позначки: `[ ]` не почато · `[~]` в роботі · `[x]` готово · `[?]` чекає рішення власника.
DoD = що власник перевіряє руками. Тести — додатково.

---

## Slice 0 — Скелет і гейти  `[x]` (2026-09-08)
Мета: порожній сайт, який збирається, деплоїться і вже падає на поганому контенті.
- [x] React + TS + Vite (каркас створено вручну), pnpm, ESLint, Prettier, Vitest, Playwright
- [x] `src/styles/tokens.css` з DESIGN_SYSTEM_TZ.md, глобальний reset, шрифтовий стек
- [x] i18next з `locales/uk`, `locales/sk`; мова в адресі `/uk/`, `/sk/`; `scripts/check-locales.ts` — білд падає на відсутньому ключі
- [x] Zod-схеми `src/lib/content/schema.ts` для Procedure, Step, Document, FeeRule, Source, Threshold, Authority (поля — spec §7), `.strict()`
- [x] `scripts/validate-content.ts`: читає `content/**/*.yaml`, валідує, перевіряє що кожен `sourceIds[]` існує в реєстрі, `published` без `reviewer` = помилка
- [x] `.github/workflows/deploy.yml` → GitHub Pages (Node 24, pnpm 12, + `pnpm lint`); `<meta http-equiv="Content-Security-Policy">` у `index.html`, у dev послаблюється плагіном
- [x] Сторінки-заглушки: Home (дисклеймер + стан права), About/Privacy, 404
**DoD:** ✓ перевірено локально (`pnpm dev` → /slovakia-residence/uk/ і /sk/, `pnpm validate` падає без `sourceIds` і на джерелі поза реєстром). Лишилось після пушу: увімкнути GitHub Pages у Settings → Pages (джерело: GitHub Actions) і відкрити публічний URL.

## Slice 1 — Контент-модель + реєстр джерел  `[x]` (2026-09-08)
- [x] Конвертер `document-registry-v0.4.yaml` → `content/sources/*.yaml` (`pnpm sources:build`, 26 файлів). sha256 порожні — снапшотів ще немає
- [x] `content/thresholds/zivotne-minimum-2026-07.yaml` (295.22, Measure 155/2026) + `derivedAmount()` з тестами на ×12/×20/×100
- [x] `content/authorities/` : OCP PZ (загальний), zastupiteľský úrad, ÚPSVaR, MV SR — з `checkedAt` і `sourceIds`. **obec не внесено** (немає джерела); OCP PZ Bratislava окремо — після снапшотів MV SR
- [x] `content/fees/` : 25 позицій зі spec §5. У візових `tariffItem: null` — номер позиції тарифу не встановлено
- [x] Source Library сторінка `/uk/sources`, `/sk/sources`: групування за юридичною силою, дата перевірки, два статуси, посилання
**DoD:** ✓ сторінка «Джерела» показує 26 записів із датами; `pnpm validate` зелений (56 записів).

## Slice 2 — Rule engine  `[x]` (2026-09-08)
- [x] `src/lib/rules/evaluate.ts`: `evaluate(procedures, answers) -> RouteMatch[]` — чисті функції, без React
- [x] `Answers`: citizenshipGroup, currentStatus, location, purpose, family + обов'язкова `asOfDate`; дозволені значення в `src/lib/rules/domain.ts`
- [x] Табличні тести `tests/rules/`: 64 кейси (мінімум був 25), включно з межами 15.07.2026, 01.10.2026 і 15.07.2027
- [x] Маршрут повертає `status: reviewed | incomplete` + `outcome` з п'яти значень — UI зобов'язаний показати обидва
**DoD:** ✓ `pnpm test` — 147 зелених (64 на движок); таблиця «ситуація → маршрут» у NOTES.md за 2026-09-08.

## Slice 3 — Route Finder + Results UI  `[ ]`
- [ ] Покроковий опитувальник (без імен/паспортів), порядок і тексти питань — у `content/ui/finder.yaml`
- [ ] Results: список маршрутів, статус `incomplete` бейджем, порівняння, «це не гарантія права»
- [ ] Стан тільки в пам'яті; кнопка «Очистити все»; тест: `localStorage/sessionStorage/IndexedDB` порожні
**DoD:** пройти опитувальник uk і sk на телефоні; перезавантажити — відповіді зникли.

## Slice 4 — Route page + чеклист документів  `[ ]`
- [ ] Шаблон сторінки маршруту: правова основа, кроки, документи (статуси prepare_locally / obtain_from_authority / translate_officially / …), збори, орган, строки, обов'язки після рішення
- [ ] Чеклист для друку (print CSS)
- [ ] Блок «Офіційна форма»: посилання на оригінал (з реєстру, з sha256) + таблиця «поле → що написати (словацькою) → пояснення uk/sk»; дані таблиці — `content/documents/forms/11-057.fields.yaml`
**DoD:** маршрут B2 (employment §23) відкривається, друкується на A4, кожен факт має посилання на джерело.

## Slice 5 — Перший пакет маршрутів (дані, не код)  `[ ]`
Кожен — окремий yaml, статус `draft` → після юриста `legally_reviewed`.
- [ ] E7→B: dočasné útočisko → prechodný pobyt (§131o + ÚHCP guidance 08.04.2026)
- [ ] B2 employment §23 (single permit + гілка після національної візи, §21b(4)(f) Act 5/2004)
- [ ] B1 business §22
- [ ] B6 family reunification §27
- [ ] A3 national visa 120 днів для подачі в SR
- [ ] C3 §46 / C4 §52 permanent
- [ ] Усі інші маршрути з таксономії spec §3 — записи-заглушки зі `status: incomplete` + посилання на орган
- [ ] `docs/legal-review/checklist-uk-sk.md` — що юрист перевіряє в кожному файлі
**DoD:** 6 маршрутів проходять `validate`; юрист отримав чеклист.

## Slice 6 — Тести, доступність, реліз  `[ ]`
- [ ] Playwright e2e: uk/sk, клавіатура, мобільний, no-storage, no-network-with-form-data
- [ ] WCAG 2.2 AA прохід (axe), контраст із токенів
- [ ] `.github/workflows/source-drift.yml` — щотижня `download_and_hash.py --verify` → issue при зміні
- [ ] About/Privacy остаточний текст (благодійна організація, дисклеймер), дата рев'ю на Home
- [ ] Реліз на GitHub Pages
**DoD:** сайт публічний; усі 6 маршрутів `legally_reviewed`; решта — з бейджем `incomplete`.

---

## Правило авторства даних (з'ясовано в Slice 2)
Маршрут, що має покривати справи, розпочаті **до** зміни закону, не може мати `validFrom` = дата зміни: движок такий маршрут на ранішу дату взагалі не оцінює. Потрібні або ранній `validFrom`, або дві версії маршруту (стара і нова) з `validTo`/`validFrom` на межі. Стосується §131n і всіх перехідних випадків у Slice 5.

## Борг, що з'явився в Slice 1  `[ ]`
- `obec` (муніципалітет) як орган — потрібне джерело про hlásenie pobytu.
- Звільнення від зборів (`exemptions`) — звірити повідомлення IOM із тарифом 145/1995 pol. 24.
- Умови для трьох сум національної візи (15 / 50 / 90 €) — spec не каже, якій меті відповідає кожна.
- Джерело права ЄС для шенгенської візи (Візовий кодекс 810/2009) ще не в реєстрі.

## Відкладено на Release 2
en-локаль · PDF overlay/AcroForm генерація (spec §6) · Decap CMS для юриста · Cloudflare Pages (headers) · експорт/імпорт стану з шифруванням.

## Відкриті питання власнику  `[?]`
- Назва благодійної організації (у текстах плейсхолдери `[НАЗВА ОРГАНІЗАЦІЇ]` / `[NÁZOV ORGANIZÁCIE]`).
- Ім'я/контакт юриста для поля `reviewer`.
- Чи буде посилання на послуги власника (lead magnet) і де саме на сайті.
- Офіційні URL для трьох джерел без адреси в реєстрі: `opatrenie-155-2026`, `slovlex-5-2004` (пінована темпоральна версія), `minv-hlasenie-pobytu-form`.
- Назви джерел (`title`) у реєстрі складені нами з наявних доказів — юрист має перевірити їх разом із рештою полів.

## Вирішено  `[x]`
- Хостинг: GitHub Pages, репозиторій `wizartclub-cyber/slovakia-residence`, адреса `https://wizartclub-cyber.github.io/slovakia-residence/` (2026-09-08).
- Адреси чисті (`/uk/route/B2`), мова в шляху; вибір мови ніде не зберігається (2026-09-08).
- Baseline на головній до першого рев'ю: дата 01.09.2026 + бейдж «юридичне рев'ю не завершене» (2026-09-08).
