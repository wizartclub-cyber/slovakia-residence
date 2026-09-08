import { expect, test } from '@playwright/test';

const B2 = './uk/route/B2-employment-s23';

test('сторінка маршруту відкривається прямою адресою', async ({ page }) => {
  await page.goto(B2);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Тимчасове проживання — працевлаштування (§23)',
  );
  await expect(page.getByText('404/2011 §23')).toBeVisible();
});

test('видно, що маршрут не перевірений юристом і умови неповні', async ({ page }) => {
  await page.goto(B2);
  await expect(page.getByText('не перевірено юристом')).toBeVisible();
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
  for (let i = 0; i < 4; i += 1) {
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
  await expect(page.getByText('Kam sa podáva')).toBeVisible();
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
  expect(await steps.count()).toBe(5);
  await expect(steps.first()).toContainText('Роботодавець отримує підтвердження');
});

test('чеклист словацькою показує ті самі документи', async ({ page }) => {
  await page.goto('./sk/route/B2-employment-s23');
  await expect(page.getByText('Platný cestovný doklad').first()).toBeVisible();
  await expect(page.getByText('nie starší ako 90 dní').first()).toBeVisible();
});
