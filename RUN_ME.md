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
