import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import { parse } from 'yaml';

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

test('кількість збережених копій відповідає даним', async ({ page }) => {
  // Рахуємо з content/sources, а не хардкодимо: після кожного запуску
  // download_and_hash.py число росте, і тест не має від цього падати.
  const dir = fileURLToPath(new URL('../../content/sources', import.meta.url));
  const withHash = readdirSync(dir).filter((f) => {
    const data = parse(readFileSync(join(dir, f), 'utf8')) as { sha256: string | null };
    return data.sha256 !== null;
  }).length;

  await page.goto('./uk/sources');
  await expect(page.getByText(`збережено копію з контрольною сумою: ${withHash}`)).toBeVisible();
});

test('джерело зі збереженою копією показує контрольну суму', async ({ page }) => {
  await page.goto('./uk/sources');
  const hashes = page.locator('.source-card__hash');
  expect(await hashes.count()).toBeGreaterThan(0);
  await expect(hashes.first()).toContainText('SHA-256');
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

test('кожне джерело має чотири незалежні ознаки надійності', async ({ page }) => {
  await page.goto('./uk/sources');
  const first = page.locator('.source-card').first();
  await expect(first.locator('.trust__item')).toHaveCount(4);

  // Колір не єдиний носій змісту: у кожної ознаки є текст.
  await expect(first.locator('.trust__item').first()).toContainText(/офіційне|вторинне/);
});

test('джерело без копії позначене як таке, що її не має', async ({ page }) => {
  await page.goto('./uk/sources');
  const missing = page.locator('.trust__item--bad', { hasText: 'копії немає' });
  expect(await missing.count()).toBeGreaterThan(0);
});

test('контрольна сума схована в технічній секції, а не на першому плані', async ({ page }) => {
  await page.goto('./uk/sources');
  await expect(page.locator('.source-card__hash').first()).toBeHidden();

  await page.getByText('Технічні дані').first().click();
  await expect(page.locator('.source-card__hash').first()).toContainText('SHA-256');
});

test('є легенда позначок і лічильник джерел, що потребують перевірки', async ({ page }) => {
  await page.goto('./uk/sources');
  await page.getByText('Що означають позначки надійності').click();
  await expect(page.getByText('Первинне джерело — закон', { exact: false })).toBeVisible();
  await expect(page.getByText('хоча б одна ознака незадовільна', { exact: false })).toBeVisible();
});
