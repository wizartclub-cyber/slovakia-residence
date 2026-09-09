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
