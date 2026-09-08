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
  await expect(page.getByText('заповнюється СЛОВАЦЬКОЮ мовою', { exact: false })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Відкрити офіційний бланк' })).toHaveAttribute(
    'target',
    '_blank',
  );
});

test('збір показано як довідковий, а не як підсумковий рахунок', async ({ page }) => {
  await page.goto(B2);
  await expect(page.getByText('250.00 EUR')).toBeVisible();
  await expect(page.getByText('Юрист їх ще не перевірив', { exact: false })).toBeVisible();
  await expect(page.getByText('Звільнення від збору не внесені', { exact: false })).toBeVisible();
});

test('кроки й документи чесно позначені як неописані', async ({ page }) => {
  await page.goto(B2);
  await expect(page.getByText('Кроки ще не описані', { exact: false })).toBeVisible();
  await expect(page.getByText('Перелік документів ще не складено', { exact: false })).toBeVisible();
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
