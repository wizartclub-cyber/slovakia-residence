import { readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import { parse } from 'yaml';

const A4 = { format: 'A4' as const, margin: { top: '12mm', bottom: '12mm', left: '12mm', right: '12mm' } };

function routeIds(): string[] {
  const dir = fileURLToPath(new URL('../../content/procedures', import.meta.url));
  const ids: string[] = [];
  for (const file of readdirSync(dir)) {
    const data = parse(readFileSync(join(dir, file), 'utf8'));
    for (const procedure of Array.isArray(data) ? data : [data]) ids.push(procedure.id);
  }
  return [...new Set(ids)];
}

// Рахуємо об'єкти сторінок у самому PDF: це те, що людина побачить у
// вікні друку, а не наша оцінка висоти блоку.
function pdfPages(path: string): number {
  return (readFileSync(path, 'latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length;
}

test('на сторінці маршруту є вибір: пам\'ятка на аркуш або вся сторінка', async ({ page }) => {
  await page.goto('./uk/route/B2-employment-s23');

  await expect(page.getByRole('button', { name: "Зберегти пам'ятку (1 аркуш A4)" })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Роздрукувати всю сторінку' })).toBeVisible();
  await expect(page.getByText('виберіть у ньому «Зберегти як PDF»')).toBeVisible();
});

test('пам\'ятки на екрані немає — вона існує лише для друку', async ({ page }) => {
  await page.goto('./uk/route/B2-employment-s23');
  await expect(page.locator('.route-memo')).toBeHidden();
});

test('у режимі пам\'ятки друкується вона, а не сторінка', async ({ page }) => {
  await page.goto('./uk/route/B2-employment-s23');
  await page.evaluate(() => (document.documentElement.dataset.printMode = 'memo'));
  await page.emulateMedia({ media: 'print' });

  const memo = page.locator('.route-memo');
  await expect(memo).toBeVisible();
  // Головне з маршруту на аркуші є.
  await expect(memo).toContainText('250.00 EUR');
  await expect(memo.locator('.route-memo__box')).not.toHaveCount(0);
  // А сторінка цілком — ні, інакше аркуш був би не один.
  await expect(page.locator('.route-page__full')).toBeHidden();
});

test('повний друк лишає сторінку і ховає пам\'ятку', async ({ page }) => {
  await page.goto('./uk/route/B2-employment-s23');
  await page.evaluate(() => (document.documentElement.dataset.printMode = 'full'));
  await page.emulateMedia({ media: 'print' });

  await expect(page.locator('.route-memo')).toBeHidden();
  await expect(page.locator('.route-page__full')).toBeVisible();
});

test('пам\'ятка кожного маршруту обома мовами вміщається рівно в один аркуш A4', async ({
  page,
  isMobile,
}) => {
  // page.pdf() є лише в Chromium, а CSS друку однаковий для обох проєктів.
  test.skip(!!isMobile, 'достатньо перевірити раз');
  test.setTimeout(180_000);

  const path = join(tmpdir(), 'route-memo-check.pdf');
  const overflowing: string[] = [];

  for (const locale of ['uk', 'sk']) {
    for (const id of routeIds()) {
      await page.goto(`./${locale}/route/${id}`);
      await page.evaluate(() => (document.documentElement.dataset.printMode = 'memo'));
      await page.pdf({ path, ...A4 });
      const pages = pdfPages(path);
      if (pages !== 1) overflowing.push(`${locale}/${id} → ${pages}`);
    }
  }

  expect(overflowing).toEqual([]);
});

test('повний друк найважчого маршруту вміщається у 8 аркушів', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'достатньо перевірити раз');

  await page.goto('./uk/route/B2-employment-s23');
  await page.evaluate(() => (document.documentElement.dataset.printMode = 'full'));
  const path = join(tmpdir(), 'route-full-check.pdf');
  await page.pdf({ path, ...A4 });

  expect(pdfPages(path)).toBeGreaterThan(1);
  expect(pdfPages(path)).toBeLessThanOrEqual(8);
});
