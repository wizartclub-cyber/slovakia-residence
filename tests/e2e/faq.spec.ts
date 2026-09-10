import { expect, test } from '@playwright/test';
import { openNav } from './nav-helper';

test('пошук фільтрує питання без перезавантаження сторінки', async ({ page }) => {
  await page.goto('./uk/faq');
  const before = await page.locator('.faq-item').count();
  expect(before).toBeGreaterThanOrEqual(6);

  // Слово є лише в тексті відповіді, не в заголовку — пошук має шукати всюди.
  await page.getByLabel('Пошук по питаннях і відповідях').fill('апостиль');
  await expect(page.locator('.faq-item')).toHaveCount(1);
  await expect(page.locator('.faq-item__button')).toContainText('довідки');

  // Жодної навігації: адреса лишилася тією самою.
  await expect(page).toHaveURL(/\/uk\/faq$/);
});

test('пошук пробачає регістр і діакритику', async ({ page }) => {
  await page.goto('./uk/faq');
  await page.getByLabel('Пошук по питаннях і відповідях').fill('UTOCISKO');
  await expect(page.locator('.faq-item')).toHaveCount(1);
});

test('фільтр за темою поєднується з пошуком', async ({ page }) => {
  await page.goto('./uk/faq');
  await page.getByRole('button', { name: 'Гроші й збори' }).click();
  await expect(page.locator('.faq-item')).toHaveCount(1);

  await page.getByLabel('Пошук по питаннях і відповідях').fill('несудимість');
  await expect(page.locator('.faq-item')).toHaveCount(0);
  await expect(page.getByText('нічого не знайшлося', { exact: false })).toBeVisible();
});

test('перші два популярні питання відкриті, решта згорнуті', async ({ page }) => {
  await page.goto('./uk/faq');
  const open = page.locator('.faq-item__button[aria-expanded="true"]');
  await expect(open).toHaveCount(2);
});

test('акордеон керується клавіатурою і повідомляє стан', async ({ page }) => {
  await page.goto('./uk/faq');
  const button = page.locator('.faq-item__button').last();
  await expect(button).toHaveAttribute('aria-expanded', 'false');

  await button.focus();
  await page.keyboard.press('Enter');
  await expect(button).toHaveAttribute('aria-expanded', 'true');

  // Панель пов'язана з кнопкою через aria-controls, а не «десь поруч».
  const panelId = await button.getAttribute('aria-controls');
  await expect(page.locator(`#${panelId}`)).toBeVisible();
});

test('пряме посилання з hash відкриває потрібну відповідь і переводить фокус', async ({ page }) => {
  await page.goto('./uk/faq#faq-language-exam');

  const button = page.locator('#faq-language-exam .faq-item__button');
  await expect(button).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator(':focus')).toHaveAttribute('aria-controls', /./);
});

test('у відповіді видно правову основу, джерело і дату перевірки', async ({ page }) => {
  await page.goto('./uk/faq#faq-after-card-30-days');
  const item = page.locator('#faq-after-card-30-days');

  await expect(item.getByText('404/2011 §32')).toBeVisible();
  await expect(item.getByRole('link', { name: /404\/2011/ })).toBeVisible();
  await expect(item.getByText('11.09.2026')).toBeVisible();
});

test('відповідь без підтвердженого джерела на сайт не потрапляє', async ({ page }) => {
  await page.goto('./uk/faq');
  await page.getByLabel('Пошук по питаннях і відповідях').fill('Німеччині');
  await expect(page.locator('.faq-item')).toHaveCount(0);
  // Але про існування питання ми чесно кажемо.
  await expect(page.locator('.faq-drafts')).toContainText('не мають підтвердженого джерела');
});

test('розмітка FAQPage описує рівно ті питання, що видимі', async ({ page }) => {
  await page.goto('./uk/faq');
  const readJsonLd = async () =>
    JSON.parse((await page.locator('script[type="application/ld+json"]').innerText()) || '{}');

  const all = await readJsonLd();
  expect(all['@type']).toBe('FAQPage');
  expect(all.mainEntity.length).toBe(await page.locator('.faq-item').count());

  await page.getByRole('button', { name: 'Гроші й збори' }).click();
  const filtered = await readJsonLd();
  expect(filtered.mainEntity.length).toBe(1);
});

test('на сторінці маршруту показані лише його питання', async ({ page }) => {
  await page.goto('./uk/route/C4-longterm-s52');
  const section = page.locator('section', { hasText: 'Часті запитання про цей маршрут' }).last();

  await expect(section.locator('.faq-item')).toHaveCount(2);
  await expect(section.getByText('іспит зі словацької мови', { exact: false })).toBeVisible();
  // Питання про збори прив'язане до інших маршрутів — тут його бути не може.
  await expect(section.getByText('Скільки коштує подання', { exact: false })).toHaveCount(0);
});

test('питання доступні з меню обома мовами', async ({ page }) => {
  await page.goto('./sk/');
  await openNav(page, 'Menu');
  await page.getByRole('navigation', { name: 'Hlavné menu' }).getByRole('link', { name: 'Otázky' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Časté otázky');
});
