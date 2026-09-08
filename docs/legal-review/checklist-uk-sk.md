# Чеклист юридичної перевірки · Kontrolný zoznam právnej kontroly

Стан на 2026-09-09. Усі дані мають статус `draft` або `source_verified` — жоден
маршрут іще не перевірений юристом.
Stav k 2026-09-09. Všetky údaje majú stav `draft` alebo `source_verified` — žiadnu
cestu zatiaľ neskontroloval právnik.

## Як це працює · Ako to funguje

Дані лежать у папці `content/` у файлах YAML. Правити їх можна у звичайному
текстовому редакторі — це не програмування. Після правки хтось запускає
`pnpm validate`, і перевірка сама скаже, якщо щось порушено (наприклад, правило
без посилання на джерело).

Údaje sú v priečinku `content/` v súboroch YAML. Dajú sa upraviť v bežnom textovom
editore. Po úprave niekto spustí `pnpm validate` a kontrola sama upozorní na chybu
(napríklad pravidlo bez odkazu na zdroj).

**Що означають статуси · Čo znamenajú stavy**

| Статус | Значення · Význam |
|---|---|
| `draft` | Чернетка. Ніхто не звіряв із джерелом. · Koncept. |
| `source_verified` | Дані взяті зі збереженої копії джерела. **Не юридична перевірка.** · Údaje pochádzajú z uloženej kópie zdroja. **Nie je to právna kontrola.** |
| `legally_reviewed` | Перевірив юрист. Ставить **тільки** юрист. · Skontroloval právnik. |
| `published` | Опубліковано після перевірки. · Zverejnené po kontrole. |

Щоб поставити `legally_reviewed`, у файлі маршруту треба заповнити три поля:
`reviewStatus: legally_reviewed`, `reviewer: <ім'я>`, `reviewedAt: <РРРР-ММ-ДД>`.
Без двох останніх збірка сайту впаде — це навмисно.

## Що перевіряти в кожному маршруті · Čo skontrolovať v každej ceste

Файли: `content/procedures/*.yaml`

| # | uk | sk | ✓/✗ |
|---|----|----|-----|
| 1 | `legalBasis`: кожен § існує в редакції на дату baseline | `legalBasis`: každý § existuje v znení k dátumu baseline | |
| 2 | `eligibilityRules`: умови повні; підстави відмови за §33 ods. 6 враховані | `eligibilityRules`: podmienky úplné; dôvody zamietnutia podľa §33 ods. 6 zohľadnené | |
| 3 | Якщо умови справді повні — підняти `conditionsComplete: true`. Доти сайт каже лише «варте уваги», а не «підходить» | Ak sú podmienky úplné, nastaviť `conditionsComplete: true` | |
| 4 | `documentIds`: перелік повний, умовні документи мають опис умови | `documentIds`: zoznam úplný, podmienené doklady majú opis podmienky | |
| 5 | `grantedFor` і `decisionDeadline` відповідають закону | `grantedFor` a `decisionDeadline` zodpovedajú zákonu | |
| 6 | `steps`: порядок правильний, обов'язки після рішення позначені `afterDecision: true` | `steps`: poradie správne, povinnosti po rozhodnutí označené `afterDecision: true` | |
| 7 | `feeRuleIds`: збір відповідає 145/1995 pol. 24 у редакції baseline | `feeRuleIds`: poplatok podľa 145/1995 pol. 24 | |
| 8 | `authorityIds`: орган і місце подання правильні | `authorityIds`: orgán a miesto podania správne | |
| 9 | `openQuestions`: усе, що лишилося нез'ясованим, перелічено чесно | `openQuestions`: všetko nedoriešené je uvedené | |
| 10 | Перехідні правила (15.07.2026, 01.10.2026, §131n/§131o, 15.07.2027) | Prechodné ustanovenia | |
| 11 | Текст uk і sk означає одне й те саме правило | Text uk a sk znamená to isté pravidlo | |

## Що перевіряти в документах · Čo skontrolovať pri dokladoch

Файли: `content/documents/*.yaml`

| # | uk | sk | ✓/✗ |
|---|----|----|-----|
| 1 | `officialName` — саме так документ називає закон і проситиме орган | `officialName` zodpovedá zákonu | |
| 2 | `maxAgeDays` — строк давності правильний (§32 ods. 2: 90 днів; винятки §32 ods. 4) | `maxAgeDays` správne | |
| 3 | `requiredWhen` — усі винятки перелічені | `requiredWhen` — všetky výnimky uvedené | |
| 4 | `afterDecision` — правильно відділено додатки до заяви від обов'язків після рішення | `afterDecision` správne | |
| 5 | `thresholds` — множник прив'язаний до конкретної норми, не «бо так рахують» | `thresholds` — násobok viazaný na konkrétne ustanovenie | |
| 6 | **Переклад і легалізація:** у §32 ці вимоги не знайдені. Де вони? | **Preklad a legalizácia:** v §32 sa nenašli. Kde sú? | |

## Найважливіші відкриті питання · Najdôležitejšie otvorené otázky

1. **§33 ods. 6** — підстави для відмови не внесені в жоден маршрут. Доки їх немає, жоден маршрут не може мати `conditionsComplete: true`.
2. **Переклад, апостиль, засвідчення підпису** — вимоги до іноземних документів не знайдені в §32; потрібне джерело.
3. **§32 ods. 9 (медичне страхування)** перелічує §22, §25, §26, §27, §30 — маршруту §23 у переліку немає. Це справді так?
4. **Звільнення від зборів** — IOM повідомляє про звільнення для дітей до 18 і подружжя громадян СР; звірити з 145/1995 pol. 24.
5. **Національна віза:** які випадки відповідають зборам 15 / 50 / 90 €.
6. **§131o і перехід із тимчасового захисту** — SOURCE_AUDIT застерігає, що §131o стосується припинення захисту. Яка правова підстава переходу?
7. **§46 і §52** — жодної статутної підстави ще не внесено.

## Джерела · Zdroje

Сторінка «Джерела» на сайті показує для кожного джерела дату перевірки адреси,
контрольну суму SHA-256 збереженої копії і статус. Шість бланків MZV поки без
копії — сайт про це прямо каже.

Stránka „Zdroje“ zobrazuje pri každom zdroji dátum kontroly adresy, kontrolný súčet
SHA-256 uloženej kópie a stav. Šesť tlačív MZV zatiaľ nemá kópiu.
