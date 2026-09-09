import { expect, test } from '@playwright/test';

test('сторінка «Органи» показує підрозділи іноземної поліції з адресами', async ({ page }) => {
  await page.goto('./uk/authorities');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Органи');
  await expect(page.getByRole('heading', { level: 2, name: 'Поліція у справах іноземців' })).toBeVisible();

  const cards = page.locator('.authority');
  expect(await cards.count()).toBeGreaterThanOrEqual(13);

  // Адреса — головне, заради чого сторінка існує.
  expect(await page.locator('.authority__address').count()).toBeGreaterThanOrEqual(13);
  await expect(page.getByText('Račianska 62, 812 72 Bratislava')).toBeVisible();
});

test('попереджає, що територіальна компетенція не встановлена', async ({ page }) => {
  await page.goto('./uk/authorities');
  await expect(page.locator('.route-page__warning')).toContainText('територіальн');
});

test('посилання на мапу веде на OpenStreetMap із координатами', async ({ page }) => {
  await page.goto('./uk/authorities');
  const link = page.getByRole('link', { name: 'Показати на мапі' }).first();
  await expect(link).toHaveAttribute('href', /openstreetmap\.org\/\?mlat=\d+\.\d+&mlon=\d+\.\d+/);
});

test('сторінка існує і словацькою', async ({ page }) => {
  await page.goto('./sk/authorities');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Orgány');
  await expect(page.getByRole('heading', { level: 2, name: 'Cudzinecká polícia' })).toBeVisible();
});
