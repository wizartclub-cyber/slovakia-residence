import { expect, test } from '@playwright/test';

test('сторінка «Джерела» показує понад 20 записів із датами перевірки', async ({ page }) => {
  await page.goto('./uk/sources');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Джерела');

  const cards = page.locator('.source-card');
  expect(await cards.count()).toBeGreaterThanOrEqual(20);

  // Дата перевірки адреси — головне, заради чого сторінка існує.
  const dates = page.locator('.source-card time');
  expect(await dates.count()).toBeGreaterThanOrEqual(20);
  await expect(dates.first()).toHaveText(/^\d{2}\.\d{2}\.\d{4}$/);
});

test('джерела згруповані за юридичною силою', async ({ page }) => {
  await page.goto('./uk/sources');
  await expect(page.getByRole('heading', { level: 2, name: 'Закони' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Офіційні бланки' })).toBeVisible();
});

test('джерело без офіційної адреси чесно позначене', async ({ page }) => {
  await page.goto('./uk/sources');
  const missing = page.getByText('офіційної адреси ще немає', { exact: false });
  expect(await missing.count()).toBeGreaterThanOrEqual(1);
});

test('видно, що копії джерел ще не зняті', async ({ page }) => {
  await page.goto('./uk/sources');
  await expect(page.getByText('збережено копію з контрольною сумою: 0')).toBeVisible();
});

test('сторінка джерел існує словацькою і доступна з меню', async ({ page }) => {
  await page.goto('./sk/');
  await page.getByRole('navigation', { name: 'Hlavné menu' }).getByRole('link', { name: 'Zdroje' }).click();

  await expect(page).toHaveURL(/\/sk\/sources$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Zdroje');
  await expect(page.getByRole('heading', { level: 2, name: 'Zákony' })).toBeVisible();
});

test('посилання на джерела відкриваються в новій вкладці й не течуть рефером', async ({ page }) => {
  await page.goto('./uk/sources');
  const link = page.locator('.source-card__links a').first();
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toHaveAttribute('rel', /noreferrer/);
});
