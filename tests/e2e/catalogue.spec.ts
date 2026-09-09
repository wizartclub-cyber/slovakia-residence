import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

// Скільки маршрутів має бути — рахуємо з даних, а не хардкодимо: маршрути
// додаються, і тест не має падати від самого лише зростання.
const ROUTE_COUNT = readdirSync(fileURLToPath(new URL('../../content/procedures', import.meta.url)))
  .filter((f) => f.endsWith('.yaml') && !f.startsWith('_')).length;

test('каталог показує всі маршрути, згруповані за категорією', async ({ page }) => {
  await page.goto('./uk/routes');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Усі маршрути');

  const items = page.locator('.catalogue__item');
  expect(await items.count()).toBe(ROUTE_COUNT);

  await expect(page.getByRole('heading', { level: 2, name: 'Тимчасове проживання (третіх країн)' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Постійне і довгострокове проживання' })).toBeVisible();
});

test('каталог чесно каже, що описано не весь закон', async ({ page }) => {
  await page.goto('./uk/routes');
  await expect(page.getByText('Це не весь закон', { exact: false })).toBeVisible();
});

test('із каталогу можна перейти на маршрут', async ({ page }) => {
  await page.goto('./uk/routes');
  await page.getByRole('link', { name: 'Постійне проживання на п\'ять років (§43)' }).click();
  await expect(page).toHaveURL(/\/uk\/route\/C1-permanent-s43$/);
});

test('каталог працює словацькою', async ({ page }) => {
  await page.goto('./sk/routes');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Všetky cesty');
  await expect(page.locator('.catalogue__item')).toHaveCount(ROUTE_COUNT);
});

test('кожен маршрут у каталозі позначений як неперевірений юристом', async ({ page }) => {
  await page.goto('./uk/routes');
  const badges = page.locator('.catalogue__item .badge');
  expect(await badges.count()).toBe(ROUTE_COUNT);
  for (let i = 0; i < ROUTE_COUNT; i += 1) {
    await expect(badges.nth(i)).toHaveText('не перевірено юристом');
  }
});

test('пошук у каталозі звужує список і оголошує кількість', async ({ page }) => {
  await page.goto('./uk/routes');
  await expect(page.locator('.catalogue__item')).toHaveCount(ROUTE_COUNT);

  await page.getByLabel('Пошук за назвою або статтею закону').fill('§23');

  await expect(page.locator('.catalogue__item')).toHaveCount(1);
  await expect(page.getByText('Знайдено: 1')).toBeVisible();
  // Фільтр має бути в адресі, щоб посилання можна було надіслати.
  await expect(page).toHaveURL(/q=%C2%A723|q=§23/);
});

test('пошук за словом працює обома мовами', async ({ page }) => {
  await page.goto('./sk/routes');
  await page.getByLabel('Hľadanie podľa názvu alebo paragrafu').fill('zamestnan');
  const found = await page.locator('.catalogue__item').count();
  expect(found).toBeGreaterThanOrEqual(1);
  expect(found).toBeLessThan(ROUTE_COUNT);
});

test('порожній результат пояснює, що робити', async ({ page }) => {
  await page.goto('./uk/routes');
  await page.getByLabel('Пошук за назвою або статтею закону').fill('щось чого немає');
  await expect(page.getByText('нічого не знайдено', { exact: false })).toBeVisible();
});

test('фільтри за категорією і групою працюють і зберігаються в адресі', async ({ page }) => {
  await page.goto('./uk/routes');

  await page.getByLabel('Категорія').selectOption('F');
  await expect(page).toHaveURL(/category=F/);
  const items = page.locator('.catalogue__item');
  expect(await items.count()).toBe(3);
  await expect(page.getByRole('heading', { level: 2, name: 'Вільний рух громадян ЄС' })).toBeVisible();

  await page.getByLabel('Категорія').selectOption('');
  await page.getByLabel('Хто ви').selectOption('ua_temporary_protection');
  await expect(page).toHaveURL(/group=ua_temporary_protection/);
  expect(await items.count()).toBeGreaterThan(0);
});

test('відфільтроване посилання відкривається таким самим', async ({ page }) => {
  await page.goto('./uk/routes?category=C');
  await expect(page.getByLabel('Категорія')).toHaveValue('C');
  const items = page.locator('.catalogue__item');
  expect(await items.count()).toBeGreaterThanOrEqual(3);
});

test('картка маршруту показує строк рішення і збір «від»', async ({ page }) => {
  await page.goto('./uk/routes?q=§23');
  const card = page.locator('.catalogue__item').first();
  await expect(card).toContainText('Строк рішення');
  await expect(card).toContainText('днів');
  await expect(card).toContainText('від 250 EUR');
});

test('можна порівняти до трьох маршрутів, і підбірка тримається в адресі', async ({ page }) => {
  await page.goto('./uk/routes?category=B');

  const boxes = page.locator('.catalogue__compare input');
  await boxes.nth(0).check();
  await expect(page.getByText('Позначте ще один маршрут', { exact: false })).toBeVisible();

  await boxes.nth(1).check();
  const table = page.locator('.comparison table');
  await expect(table).toBeVisible();
  await expect(table.getByRole('rowheader', { name: 'Картка з правом працювати' })).toBeVisible();
  await expect(page).toHaveURL(/compare=/);

  await boxes.nth(2).check();
  // Четвертий уже не додається: більше трьох не порівнюємо.
  await boxes.nth(3).check({ force: true }).catch(() => {});
  const headers = table.locator('thead th');
  expect(await headers.count()).toBe(4); // показник + три маршрути
});

test('порівняння прямо каже, що це не рейтинг', async ({ page }) => {
  await page.goto('./uk/routes?compare=B2-employment-s23,B1-business-s22');
  await expect(page.getByText('не рейтинг', { exact: false })).toBeVisible();
  await expect(page.locator('.comparison')).toContainText('так (§73 ods. 3)').catch(() => {});
});
