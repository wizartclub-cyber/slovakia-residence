import { readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

test('на сторінці маршруту є кнопка збереження в PDF і пояснення, як це зробити', async ({ page }) => {
  await page.goto('./uk/route/B2-employment-s23');

  await expect(page.getByRole('button', { name: 'Зберегти як PDF' })).toBeVisible();
  await expect(page.getByText('виберіть у ньому «Зберегти як PDF»')).toBeVisible();
});

test('на папір іде пам\'ятка: без розділу «Що ще каже закон», але з адресою сторінки', async ({ page }) => {
  await page.goto('./uk/route/B2-employment-s23');

  // На екрані розділ є — його можна розгорнути.
  await expect(page.getByRole('heading', { level: 2, name: 'Що ще каже закон' })).toBeVisible();

  await page.emulateMedia({ media: 'print' });

  // На папері його немає: це десяток приміток, у яких головне губиться.
  await expect(page.getByRole('heading', { level: 2, name: 'Що ще каже закон' })).toBeHidden();
  // Зате з'являється адреса — щоб аркуш вів назад на сайт.
  await expect(page.locator('.route-page__print-source')).toContainText('/uk/route/B2-employment-s23');
  // Кнопки на папері бути не може: її не натиснути.
  await expect(page.getByRole('button', { name: 'Зберегти як PDF' })).toBeHidden();
});

test('найважчий маршрут вміщається у 8 аркушів A4', async ({ page, isMobile }) => {
  // page.pdf() є лише в Chromium; на мобільному проєкті цей самий CSS,
  // тому достатньо однієї перевірки.
  test.skip(!!isMobile, 'достатньо перевірити раз');

  await page.goto('./uk/route/B2-employment-s23');
  const path = join(tmpdir(), 'route-memo-test.pdf');
  await page.pdf({
    path,
    format: 'A4',
    margin: { top: '16mm', bottom: '16mm', left: '14mm', right: '14mm' },
  });

  // Рахуємо «/Type /Page» без «/Pages» — цього досить, щоб зловити розростання.
  const pdf = readFileSync(path, 'latin1');
  const pages = (pdf.match(/\/Type\s*\/Page[^s]/g) ?? []).length;
  expect(pages).toBeGreaterThan(0);
  expect(pages).toBeLessThanOrEqual(8);
});
