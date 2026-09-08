# Як зняти снапшоти джерел (5 хвилин, один раз)

Хмарне середовище Claude не має доступу до mzv.sk / slov-lex.sk / upsvr.gov.sk, тому файли треба завантажити з твого Mac. Скрипт сам усе скачує, рахує SHA-256 (цифровий «відбиток» файлу — доказ, яку саме версію ми переглядали) і записує результат у реєстр.

## Крок 1 — відкрий Terminal
Spotlight (⌘ + пробіл) → набери `Terminal` → Enter.

## Крок 2 — перейди в папку проєкту
Вставити рядок і натиснути Enter:

    cd ~/Documents/Codex/slovakia-residence

(`cd` = «зайти в папку».)

## Крок 3 — встанови 3 бібліотеки (один раз)

    pip3 install pyyaml requests pypdf

Якщо пише `command not found: pip3` — спочатку встанови Python з python.org, потім повтори.

## Крок 4 — запусти скрипт

    python3 scripts/download_and_hash.py

Побачиш 20 рядків типу `→ mzv-form-11-057 … pdf 245 KB sha256=… pages=2 acroFields=0`.
`✗` означає, що файл не скачався — це нормально для 1–2 джерел, просто скажи мені, які саме.

## Що з'явиться
- `sources/snapshots/` — 20 файлів (PDF/DOC/HTML), як вони виглядали сьогодні
- `sources/manifest.json` — технічні докази по кожному файлу
- `document-registry-v0.4.yaml` — оновлений реєстр (поле `snapshot:` заповнене)

## Пізніше — перевірка, чи джерела не змінилися

    python3 scripts/download_and_hash.py --verify

Якщо бачиш `HASH MISMATCH` — файл на сайті змінили, треба юридичний перегляд.


---

# Що з'ясувалося після першого запуску (2026-09-08)

Скрипт завантажив **17 із 26** джерел. Решта — три причини.

## 1. Шість файлів MZV треба зберегти руками (сайт блокує скрипти)

`www.mzv.sk` відповідає «403 Доступ заборонено» будь-якій програмі — я перевірив і зі звичайним браузерним підписом, і з усіма заголовками справжнього браузера. Обходити цей захист ми не будемо. Файли публічні, тож просто збережи їх із браузера.

**Як це зробити:**

1. Створи папку, якщо її немає: у Terminal `mkdir -p ~/Documents/Codex/slovakia-residence/sources/snapshots`
2. Відкрий кожне посилання нижче в Safari або Chrome.
3. Збережи файл (⌘S) у папку `sources/snapshots` **точно з тією назвою**, що вказана — назва важлива, за нею скрипт знаходить файл.

1. **mzv-residence-master-guidance** → зберегти як `sources/snapshots/mzv-residence-master-guidance.html`
   https://www.mzv.sk/en/web/en/visa-and-services/residence-of-foreign-nationals-in-slovakia

2. **mzv-form-11-057** → зберегти як `sources/snapshots/mzv-form-11-057.pdf`
   https://www.mzv.sk/documents/30297/1912918/Application%2Bfor%2Bthe%2Btemporary%2Bresidence/12f647e7-5f64-4261-a98e-6ce4f895599f

3. **mzv-form-11-056** → зберегти як `sources/snapshots/mzv-form-11-056.pdf`
   https://www.mzv.sk/documents/10182/16461384/004-Application-for-renewal-of-the-temporary-residence-Application-for-permanent-residence-for-an-unlimited-time-long-term-residence.pdf/4e0ef0eb-bc76-db80-b4ac-0f7af22e1daa

4. **mzv-national-visa-sk** → зберегти як `sources/snapshots/mzv-national-visa-sk.pdf`
   https://www.mzv.sk/documents/10182/16274933/002-ziadost-o-narodne-vizum-SK.pdf/d2c0d2c1-c498-176c-7fae-cd1083393266

5. **mzv-national-visa-en** → зберегти як `sources/snapshots/mzv-national-visa-en.pdf`
   https://www.mzv.sk/documents/10182/16274933/004-ziadost-o-narodne-vizum-EN.pdf/3e457269-c704-45a0-3ec5-5ce02f650af9

6. **mzv-national-visa-guidance** → зберегти як `sources/snapshots/mzv-national-visa-guidance.html`
   https://www.mzv.sk/en/services/information-for-foreigners/national-visa

4. Повернись у Terminal і виконай:

       cd ~/Documents/Codex/slovakia-residence
       python3 scripts/download_and_hash.py --local

   Скрипт порахує контрольні суми збережених файлів, для PDF покаже кількість сторінок і чи має бланк заповнювані поля, і запише все в реєстр із поміткою, що файл отримано вручну.

## 2. Три джерела не мають офіційної адреси

`opatrenie-155-2026` (життєвий мінімум), `slovlex-5-2004` (закон про послуги зайнятості, потрібна закріплена редакція) і `minv-hlasenie-pobytu-form` (бланк реєстрації місця проживання). Адреси треба знайти на slov-lex.sk і minv.sk і вписати в реєстр — вгадувати їх не можна.

## 3. Виправлено в скрипті

Для законів на Slov-Lex скрипт раніше зберігав «плаваючу» адресу — а там лежить лише 2 КБ JavaScript, без тексту закону. Тепер він бере адресу закріпленої редакції (`staticUrl`), і закон 404/2011 зберігся як 1,9 МБ справжнього тексту. Якщо ти вже запускав скрипт до цієї правки — просто запусти ще раз, він перезапише.
