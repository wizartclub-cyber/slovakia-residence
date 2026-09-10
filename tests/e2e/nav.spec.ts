import { expect, test } from '@playwright/test';

const PHONE = { width: 390, height: 844 };
const DESKTOP = { width: 1280, height: 800 };

test('на телефоні меню сховане за кнопкою і не займає екран', async ({ page }) => {
  await page.setViewportSize(PHONE);
  await page.goto('./uk/');

  const nav = page.getByRole('navigation', { name: 'Головне меню' });
  await expect(nav).toBeHidden();

  const toggle = page.getByRole('button', { name: 'Меню' });
  await expect(toggle).toBeVisible();
  // Кнопка має бути досяжною пальцем (WCAG 2.2 target size).
  const box = await toggle.boundingBox();
  expect(box!.height).toBeGreaterThanOrEqual(44);

  // Шапка не може з'їдати екран: заголовок сторінки має бути видно одразу.
  const header = await page.locator('.site-header').boundingBox();
  expect(header!.height).toBeLessThan(PHONE.height * 0.2);
});

test('кнопка розкриває меню і повідомляє свій стан', async ({ page }) => {
  await page.setViewportSize(PHONE);
  await page.goto('./uk/');

  const toggle = page.getByRole('button', { name: 'Меню' });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();

  const nav = page.getByRole('navigation', { name: 'Головне меню' });
  await expect(nav).toBeVisible();
  await expect(page.getByRole('button', { name: 'Закрити' })).toHaveAttribute('aria-expanded', 'true');
  await expect(nav.getByRole('link')).toHaveCount(7);
});

test('перехід за посиланням закриває меню', async ({ page }) => {
  await page.setViewportSize(PHONE);
  await page.goto('./uk/');

  await page.getByRole('button', { name: 'Меню' }).click();
  await page.getByRole('navigation', { name: 'Головне меню' }).getByRole('link', { name: 'Органи' }).click();

  await expect(page).toHaveURL(/\/uk\/authorities$/);
  await expect(page.getByRole('navigation', { name: 'Головне меню' })).toBeHidden();
  // Заголовок нової сторінки видно без прокрутки — меню його не накриває.
  await expect(page.getByRole('heading', { level: 1 })).toBeInViewport();
});

test('Escape закриває меню і повертає фокус на кнопку', async ({ page }) => {
  await page.setViewportSize(PHONE);
  await page.goto('./uk/');

  await page.getByRole('button', { name: 'Меню' }).click();
  await page.keyboard.press('Escape');

  await expect(page.getByRole('navigation', { name: 'Головне меню' })).toBeHidden();
  await expect(page.locator(':focus')).toHaveAttribute('aria-controls', 'site-nav');
});

test('на широкому екрані меню відкрите, а кнопки немає', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto('./uk/');

  await expect(page.getByRole('navigation', { name: 'Головне меню' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Меню' })).toBeHidden();
});

test('меню працює і словацькою', async ({ page }) => {
  await page.setViewportSize(PHONE);
  await page.goto('./sk/');

  await page.getByRole('button', { name: 'Menu' }).click();
  await expect(page.getByRole('navigation', { name: 'Hlavné menu' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Zavrieť' })).toBeVisible();
});
