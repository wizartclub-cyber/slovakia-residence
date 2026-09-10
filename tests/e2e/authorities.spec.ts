import { expect, test } from '@playwright/test';

test('сторінка «Органи» показує підрозділи іноземної поліції з адресами', async ({ page }) => {
  await page.goto('./uk/authorities');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Органи');
  await expect(page.getByRole('heading', { level: 2, name: 'Поліція у справах іноземців' })).toBeVisible();

  expect(await page.locator('.authority').count()).toBeGreaterThanOrEqual(13);
  expect(await page.locator('.authority__address').count()).toBeGreaterThanOrEqual(13);
  await expect(page.getByText('Račianska 62, 812 72 Bratislava')).toBeVisible();
});

test('пошук за округом показує саме той відділ, який його обслуговує', async ({ page }) => {
  await page.goto('./uk/authorities');

  // Poprad обслуговує Prešov — це не очевидно з географії, саме тому пошук і потрібен.
  await page.getByLabel('Знайти свій відділ за округом').fill('Poprad');
  await expect(page.locator('.authority')).toHaveCount(1);
  await expect(page.locator('.authority__name')).toHaveText('Oddelenie cudzineckej polície PZ Prešov');
  await expect(page.locator('.authority__districts li.is-match')).toHaveText('Poprad');
});

test('пошук пробачає діакритику', async ({ page }) => {
  await page.goto('./uk/authorities');
  await page.getByLabel('Знайти свій відділ за округом').fill('zilina');
  await expect(page.locator('.authority__name')).toHaveText('Oddelenie cudzineckej polície PZ Žilina');
});

test('посилання на мапу шукає за офіційною адресою, а не за координатами', async ({ page }) => {
  await page.goto('./uk/authorities');
  // Адресуємося до конкретної картки, а не до «першого посилання»: порядок карток
  // задають дані, і він змінюється від додавання органу.
  const card = page.locator('.authority').filter({ hasText: 'Račianska 62' });
  const link = card.getByRole('link', { name: 'Показати на мапі' });
  await expect(link).toHaveAttribute('href', /openstreetmap\.org\/search\?query=Ra%C4%8Dianska/);
});

test('години прийому сховані під розкривачкою, а не займають екран', async ({ page }) => {
  await page.goto('./uk/authorities');
  const hours = page.locator('.authority__hours').first();
  await expect(hours.getByText('Pondelok: 7:30 – 15:30')).toBeHidden();
  await hours.getByText('Години прийому').click();
  await expect(hours.getByText('Pondelok: 7:30 – 15:30')).toBeVisible();
});

test('сторінка існує і словацькою', async ({ page }) => {
  await page.goto('./sk/authorities');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Orgány');
  await expect(page.getByRole('heading', { level: 2, name: 'Cudzinecká polícia' })).toBeVisible();
});
