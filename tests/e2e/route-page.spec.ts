import { expect, test } from '@playwright/test';

const B2 = './uk/route/B2-employment-s23';

test('сторінка маршруту відкривається прямою адресою', async ({ page }) => {
  await page.goto(B2);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Тимчасове проживання — працевлаштування (§23)',
  );
  await expect(page.locator('.summary')).toContainText('404/2011 §23');
});

test('видно, що маршрут не перевірений юристом і умови неповні', async ({ page }) => {
  await page.goto(B2);
  await expect(page.getByText('не перевірено юристом').first()).toBeVisible();
  await expect(page.getByText('Умови цього маршруту ще не внесені повністю', { exact: false })).toBeVisible();
});

test('блок офіційного бланка попереджає про словацьку мову', async ({ page }) => {
  await page.goto(B2);
  await expect(page.getByText('T MV SR 11-057', { exact: false }).first()).toBeVisible();
  await expect(page.locator('.route-page__warning').first()).toContainText(
    'заповнюється СЛОВАЦЬКОЮ мовою',
  );
  await expect(page.getByRole('link', { name: 'Відкрити офіційний бланк' })).toHaveAttribute(
    'target',
    '_blank',
  );
});

test('збір показано з тарифом, знижкою і звільненнями', async ({ page }) => {
  await page.goto(B2);

  await expect(page.getByText('250.00 EUR')).toBeVisible();
  await expect(page.getByText('145/1995 položka 24 písm. a) bod 2')).toBeVisible();
  await expect(page.getByText('Юрист їх ще не перевірив', { exact: false })).toBeVisible();

  // Знижка за електронну подачу: 50 % від 250 = 125, але зниження не більше 50 € → 200.
  await expect(page.getByText('Електронна подача: 200.00 EUR')).toBeVisible();

  // Звільнення — головне, заради чого цей блок існує.
  const exemptions = page.locator('.route-page__fee-exemptions li');
  expect(await exemptions.count()).toBeGreaterThanOrEqual(3);
  await expect(page.getByText('молодші за 18 років', { exact: false })).toBeVisible();
  await expect(page.getByText('може відпустити збір', { exact: false }).first()).toBeVisible();
});

test('маршрут без переліку документів чесно про це каже', async ({ page }) => {
  // У §52 кроки вже описані, а перелік документів ще ні — сторінка це визнає,
  // а не лишає розділ порожнім (порожній розділ читався б як «нічого не треба»).
  await page.goto('./uk/route/C4-longterm-s52');
  await expect(page.getByText('Перелік документів ще не складено', { exact: false })).toBeVisible();
});

test('виключення §52 для осіб із тимчасовим захистом описане на сторінці', async ({ page }) => {
  await page.goto('./uk/route/C4-longterm-s52');
  await expect(page.getByText('ВІДІДЕНТІВ', { exact: false })).toBeVisible();
});

test('кожне джерело веде на сторінку «Джерела»', async ({ page }) => {
  await page.goto(B2);
  const link = page.getByRole('link', { name: 'Zákon č. 404/2011 Z. z. o pobyte cudzincov' });
  await link.click();
  await expect(page).toHaveURL(/\/uk\/sources#slovlex-404-2011$/);
  await expect(page.locator('#slovlex-404-2011')).toBeVisible();
});

test('з результатів опитувальника можна перейти на маршрут', async ({ page }) => {
  await page.goto('./uk/finder');
  await page.locator('#citizenship-third_country').check();
  await page.getByRole('button', { name: 'Далі' }).click();
  for (let i = 0; i < 5; i += 1) {
    await page.getByRole('button', { name: 'Не знаю / пропустити' }).click();
  }
  await page.getByRole('link', { name: 'Тимчасове проживання — працевлаштування (§23)' }).click();
  await expect(page).toHaveURL(/\/uk\/route\/B2-employment-s23$/);
});

test('неіснуючий маршрут не вдає, що існує', async ({ page }) => {
  await page.goto('./uk/route/NEMA-TAKOGO');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Такого маршруту немає');
});

test('у режимі друку зникає навігація і з\'являються адреси джерел', async ({ page }) => {
  await page.goto(B2);
  await expect(page.locator('.site-header')).toBeVisible();

  await page.emulateMedia({ media: 'print' });

  await expect(page.locator('.site-header')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Роздрукувати' })).toBeHidden();
  await expect(page.locator('.route-page__url').first()).toBeVisible();
});

test('сторінка маршруту працює словацькою', async ({ page }) => {
  await page.goto('./sk/route/C3-permanent-s46');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Trvalý pobyt na neobmedzený čas (§46)',
  );
  await expect(page.getByText('Kam sa podáva').first()).toBeVisible();
});

test('чеклист документів побудований із закону', async ({ page }) => {
  await page.goto(B2);

  const items = page.locator('.checklist__item');
  expect(await items.count()).toBeGreaterThanOrEqual(5);

  // Офіційна словацька назва — саме її проситиме орган.
  await expect(page.getByText('Platný cestovný doklad').first()).toBeVisible();
  await expect(
    page.getByText('Potvrdenie o možnosti obsadenia voľného pracovného miesta').first(),
  ).toBeVisible();

  // Строки давності документів — з §32.
  await expect(page.getByText('не старший за 90 днів').first()).toBeVisible();
  await expect(page.getByText('не старший за 180 днів')).toBeVisible();
});

test('видно строк рішення і на який час надають дозвіл', async ({ page }) => {
  await page.goto(B2);
  await expect(page.getByText('не більше ніж на п\'ять років', { exact: false })).toBeVisible();
  await expect(page.getByText('60 днів від дня надходження заяви', { exact: false })).toBeVisible();
});

test('обов\'язки після рішення відокремлені від додатків до заяви', async ({ page }) => {
  await page.goto(B2);
  const after = page.locator('section', { hasText: 'Після рішення' }).last();
  await expect(after.locator('.checklist__title')).toContainText('Медичний висновок');
  // Той самий документ не має дублюватися серед додатків до заяви.
  const attachments = page.locator('section', { hasText: 'Документи' }).first();
  await expect(attachments.getByText('Медичний висновок', { exact: false })).toHaveCount(0);
});

test('суми фінансового забезпечення обчислені з життєвого мінімуму', async ({ page }) => {
  await page.goto('./uk/route/B1-business-s22');

  // 20 × 295.22 = 5904.40 і 100 × 295.22 = 29522.00 (§32 ods. 7)
  await expect(page.getByText('5904.40 EUR')).toBeVisible();
  await expect(page.getByText('29522.00 EUR')).toBeVisible();
  await expect(page.getByText('20 × 295.22', { exact: false })).toBeVisible();
});

test('кроки маршруту показані по порядку', async ({ page }) => {
  await page.goto(B2);
  const steps = page.locator('.route-page__steps li');
  expect(await steps.count()).toBe(7);
  await expect(steps.first()).toContainText('Роботодавець отримує підтвердження');
});

test('чеклист словацькою показує ті самі документи', async ({ page }) => {
  await page.goto('./sk/route/B2-employment-s23');
  await expect(page.getByText('Platný cestovný doklad').first()).toBeVisible();
  await expect(page.getByText('nie starší ako 90 dní').first()).toBeVisible();
});

test('на сторінці перелічені всі підстави для відмови (§33 ods. 6)', async ({ page }) => {
  await page.goto(B2);

  // Примітки згорнуті — спершу розгортаємо потрібну.
  await page.getByRole('button', { name: /Через що відмовляють/ }).click();
  const refusal = page.locator('.legal-note').filter({ hasText: 'Через що відмовляють' });
  // У законі рівно п'ятнадцять підстав, від a) до o). Неповний перелік
  // вводив би в оману, тому число зафіксоване.
  await expect(refusal.locator('li')).toHaveCount(15);
  await expect(refusal).toContainText('фіктивний шлюб');
  await expect(page.getByText('Це не «можуть відмовити», а «відмовлять»', { exact: false })).toBeVisible();
});

test('маршрут обновлення пояснює головне: подати вчасно і що буде далі', async ({ page }) => {
  await page.goto('./uk/route/G1-renewal-s34');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Обновлення тимчасового проживання (§34)');
  const steps = page.locator('.route-page__steps li');
  await expect(steps.first()).toContainText('НЕ ПІЗНІШЕ останнього дня');
  await expect(steps.nth(1)).toContainText('перебування лишається законним');
});

test('на сторінці видно, коли пробут припиняється і коли його скасовують', async ({ page }) => {
  await page.goto(B2);
  await expect(page.getByRole('button', { name: /припиняється саме/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /скасовує тимчасове проживання/ })).toBeVisible();

  await page.getByRole('button', { name: /припиняється саме/ }).click();
  await expect(page.getByText('не в\'їхала на територію Словаччини протягом 180 днів', { exact: false })).toBeVisible();
});

test('маршрут тимчасового захисту пояснює житло і компенсацію', async ({ page }) => {
  await page.goto('./uk/route/E6-temporary-protection-s58');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Тимчасовий захист');

  const steps = page.locator('.route-page__steps li');
  await expect(steps.filter({ hasText: 'Додатку №3' })).toHaveCount(1);

  // Обов'язки й права після надання захисту — окремим розділом.
  const after = page.locator('section').filter({ hasText: 'Після рішення' }).last();
  await expect(after).toContainText('60 днів');
  await expect(after).toContainText('через громаду');
});

test('видно, коли тимчасовий захист припиняється', async ({ page }) => {
  await page.goto('./uk/route/E6-temporary-protection-s58');
  await page.getByRole('button', { name: /тимчасовий захист припиняється/ }).click();
  const note = page.locator('.legal-note').filter({ hasText: 'тимчасовий захист припиняється' });
  await expect(note.locator('li')).toHaveCount(10);
});

test('сторінка попереджає, хто може бути представником', async ({ page }) => {
  await page.goto(B2);
  await page.getByRole('button', { name: /хто може вас представляти/ }).click();
  const note = page.locator('.legal-note').filter({ hasText: 'хто може вас представляти' });
  await expect(note).toContainText('лише ОДНОГО обраного представника');
  await expect(note).toContainText('бездоганною репутацією');
  // Рішення про надання пробуту оскарженню не підлягає — отже оскаржують відмови.
  await expect(note).toContainText('НАДАННЯ пробуту');
});

test('перелічені обов\'язки під час пробуту, включно з правилом половини часу', async ({ page }) => {
  await page.goto(B2);
  await page.getByRole('button', { name: /Обов'язки під час пробуту/ }).click();
  const note = page.locator('.legal-note').filter({ hasText: "Обов'язки під час пробуту" });

  // У законі рівно двадцять обов'язків, від a) до t).
  await expect(note.locator('li')).toHaveCount(20);
  await expect(note).toContainText('БІЛЬШЕ ПОЛОВИНИ часу');
  await expect(note).toContainText('ТРЬОХ РОБОЧИХ ДНІВ');
});

test('попереджає, що картку видадуть на строк житла, а не пробуту', async ({ page }) => {
  await page.goto(B2);
  await page.getByRole('button', { name: /Картка проживання/ }).click();
  const note = page.locator('.legal-note').filter({ hasText: 'Картка проживання' });
  await expect(note).toContainText('якщо житло забезпечене на коротший час');
  await expect(note).toContainText('oprávnenie pracovať');
});

test('маршрут додаткового захисту пояснює, що статус прирівняний до постійного', async ({ page }) => {
  await page.goto('./uk/route/E3-subsidiary-protection-s31');
  await expect(page.getByText('ПОСТІЙНЕ ПРОЖИВАННЯ', { exact: false })).toBeVisible();
  await expect(page.getByText('це не обов\'язок органу, а його право', { exact: false })).toBeVisible();
});

test('пояснює, що пробут заявляє власник житла, а не сам іноземець', async ({ page }) => {
  await page.goto(B2);
  await page.getByRole('button', { name: /Хто заявляє ваш пробут/ }).click();
  const note = page.locator('.legal-note').filter({ hasText: 'Хто заявляє ваш пробут' });
  await expect(note).toContainText('ТОЙ, ХТО НАДАЄ ЖИТЛО');
  await expect(note).toContainText("П'ЯТИ ДНІВ");
  await expect(note).toContainText('РОБОТОДАВЕЦЬ');
});

test('громадянин ЄС бачить власний, коротший перелік обов\'язків', async ({ page }) => {
  await page.goto('./uk/route/F2-eu-registration-s66');
  await page.getByRole('button', { name: /Обов'язки громадянина ЄС/ }).click();
  const note = page.locator('.legal-note').filter({ hasText: "Обов'язки громадянина ЄС" });
  await expect(note.locator('li')).toHaveCount(10);
  await expect(note).toContainText('ДЕСЯТИ РОБОЧИХ ДНІВ');
});

test('пояснює, що добровільне звернення знімає заборону в\'їзду', async ({ page }) => {
  await page.goto(B2);
  await page.getByRole('button', { name: /Адміністративне видворення/ }).click();
  const note = page.locator('.legal-note').filter({ hasText: 'Адміністративне видворення' });
  await expect(note).toContainText('БЕЗ заборони');
  await expect(note).toContainText('асистованого добровільного повернення');
  // Строки заборони — з тексту закону, не з голови.
  await expect(note).toContainText('десять років');
});

test('заявник про захист бачить свої права і правило однієї заяви', async ({ page }) => {
  await page.goto('./uk/route/E1-protection-application-s3');

  await page.getByRole('button', { name: /Права й обов'язки заявника/ }).click();
  const rights = page.locator('.legal-note').filter({ hasText: "Права й обов'язки заявника" });
  await expect(rights).toContainText("П'ЯТИ РОБОЧИХ ДНІВ");
  await expect(rights).toContainText('ШІСТЬ років');

  await page.getByRole('button', { name: /Як розглядають заяву/ }).click();
  const decision = page.locator('.legal-note').filter({ hasText: 'Як розглядають заяву' });
  await expect(decision).toContainText("ЗОБОВ'ЯЗАНЕ водночас вирішити");
});

test('маршрут §23 показує випадки, коли пробут перші 90 днів не потрібен', async ({ page }) => {
  await page.goto(B2);
  const steps = page.locator('.route-page__steps li');
  await expect(steps.last()).toContainText('перші 90 днів пробут не потрібен');
  await expect(steps.last()).toContainText('сезонну зайнятість');
});

test('толероване перебування: право лишатися до рішення і виняток для вразливих', async ({ page }) => {
  await page.goto('./uk/route/D1-tolerated-s58');
  const steps = page.locator('.route-page__steps li');
  await expect(steps.filter({ hasText: 'право лишатися в Словаччині' })).toHaveCount(1);
  await expect(steps.filter({ hasText: 'НЕ застосовуються до знайдених неповнолітніх' })).toHaveCount(1);
});

test('допомога після захисту показана обчисленими сумами', async ({ page }) => {
  await page.goto('./uk/route/E2-asylum-persecution-s30');
  await page.getByRole('button', { name: /Допомога після надання захисту/ }).click();
  const note = page.locator('.legal-note').filter({ hasText: 'Допомога після надання захисту' });

  // 1,5 × 295.22 = 442.83 і 1,75 × 295.22 = 516.64 — рахується, а не зберігається.
  await expect(note).toContainText('442.83 EUR');
  await expect(note).toContainText('516.64 EUR');
});

test('оскарження у справах тимчасового захисту різко обмежене', async ({ page }) => {
  await page.goto('./uk/route/E6-temporary-protection-s58');
  await page.getByRole('button', { name: /Оскарження у справах тимчасового захисту/ }).click();
  const note = page.locator('.legal-note').filter({ hasText: 'Оскарження у справах' });
  await expect(note).toContainText('НЕ можна подати');
  await expect(note).toContainText('НЕ має відкладального ефекту');
});

test('паспорт процедури показує головне одразу під заголовком', async ({ page }) => {
  await page.goto(B2);
  const summary = page.locator('.summary');
  await expect(summary).toContainText('Тип');
  await expect(summary).toContainText('Тимчасове проживання (третіх країн)');
  await expect(summary).toContainText('404/2011 §23');
  await expect(summary).toContainText('не перевірено юристом');
  await expect(summary).toContainText('01.09.2026');
});

test('непідтверджене поле в паспорті позначене, а не приховане', async ({ page }) => {
  // У §46 строк рішення в даних відсутній — має бути «потребує перевірки».
  await page.goto('./uk/route/C3-permanent-s46');
  await expect(page.locator('.summary__unverified').first()).toContainText('потребує перевірки');
});

test('чеклист працює і рахує відмічене, але нічого не зберігає', async ({ page }) => {
  await page.goto(B2);
  await expect(page.getByText('Відмічено 0 із 5')).toBeVisible();

  await page.locator('.checklist__input').first().check();
  await expect(page.getByText('Відмічено 1 із 5')).toBeVisible();

  // Правило CLAUDE.md §2.1: жодних сховищ браузера.
  const stored = await page.evaluate(() => ({
    local: window.localStorage.length,
    session: window.sessionStorage.length,
  }));
  expect(stored).toEqual({ local: 0, session: 0 });

  await page.getByRole('button', { name: 'Зняти всі відмітки' }).click();
  await expect(page.getByText('Відмічено 0 із 5')).toBeVisible();

  // Перезавантаження стирає відмітки — і це чесно, бо ми нічого не зберігаємо.
  await page.locator('.checklist__input').first().check();
  await page.reload();
  await expect(page.getByText('Відмічено 0 із 5')).toBeVisible();
});

test('кожен документ показує, чи він потрібен завжди', async ({ page }) => {
  await page.goto(B2);
  const items = page.locator('.checklist__item');
  await expect(items.filter({ hasText: 'потрібен завжди' })).toHaveCount(2);
  await expect(items.filter({ hasText: 'залежить від ситуації' }).first()).toBeVisible();
});

test('шкала строків показує етапи і не додає паралельні строки', async ({ page }) => {
  await page.goto('./uk/route/B1-business-s22');
  const timeline = page.locator('.deadlines');
  await expect(timeline).toBeVisible();

  await expect(timeline).toContainText('До подання');
  await expect(timeline).toContainText('День подання');
  await expect(timeline).toContainText('Розгляд і рішення');
  await expect(timeline).toContainText('Після отримання картки');

  // 90 днів поліції і 60 днів міністерства — окремі точки, не «150».
  await expect(timeline).toContainText('90');
  await expect(timeline).toContainText('це окремий строк, не додається до 90');
  await expect(page.getByText('Строки не додаються один до одного', { exact: false })).toBeVisible();
});

test('маршрут §23 показує строк 180 днів на підтвердження від управління праці', async ({ page }) => {
  await page.goto(B2);
  await expect(page.locator('.deadlines')).toContainText('не більше 180 днів');
});
