# Чеклист юридичного рев'ю маршруту / Kontrolný zoznam právnej kontroly

Один файл `content/procedures/<id>.yaml` = один прохід. Юрист позначає ✓/✗ і пише зауваження прямо тут або в коментарі до PR. Після ✓ по всіх пунктах — `reviewStatus: legally_reviewed`, `reviewer: <ім'я>`, `reviewedAt: <дата>`.

| # | uk | sk | ✓/✗ |
|---|----|----|-----|
| 1 | Правова основа: кожен § існує в пінованій версії закону на дату baseline | Právny základ: každý § existuje v pinovanej verzii zákona k dátumu baseline | |
| 2 | Умови прийнятності повні; винятки не пропущені | Podmienky oprávnenosti úplné; výnimky nevynechané | |
| 3 | Орган і місце подачі правильні (OCP PZ / ZÚ / ÚPSVaR) | Správny orgán a miesto podania | |
| 4 | Перелік документів повний; умовні документи мають умову | Zoznam dokladov úplný; podmienené doklady majú podmienku | |
| 5 | Вимоги до документів: давність, оригінал/копія, переклад, apostille, засвідчення підпису | Požiadavky na doklady: vek, originál/kópia, preklad, apostille, osvedčenie podpisu | |
| 6 | Збір і звільнення відповідають 145/1995 pol. 24 (версія baseline) | Poplatok a oslobodenia podľa 145/1995 pol. 24 | |
| 7 | Строки розгляду і правовий ефект подачі | Lehoty na rozhodnutie a právny účinok podania | |
| 8 | Обов'язки після рішення (прибуття, страхування, лікарський звіт, hlásenie pobytu) | Povinnosti po rozhodnutí | |
| 9 | Перехідні правила (15.07.2026, 01.10.2026, §131n/§131o, 15.07.2027) | Prechodné ustanovenia | |
| 10 | Текст uk і sk означає одне й те саме правило | Text uk a sk znamená to isté pravidlo | |
| 11 | Немає обіцянок результату; дисклеймер присутній | Žiadne sľuby výsledku; disclaimer prítomný | |

Зауваження / Pripomienky:
