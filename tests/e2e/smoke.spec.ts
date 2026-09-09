import { expect, test } from '@playwright/test';

test('корінь веде на українську версію', async ({ page }) => {
  await page.goto('./');
  await expect(page).toHaveURL(/\/slovakia-residence\/uk\/?$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('видно стан права і те, що рев\'ю не завершене', async ({ page }) => {
  await page.goto('./uk/');
  const notice = page.getByRole('note');
  await expect(notice).toContainText('01.09.2026');
  await expect(notice).toContainText("рев'ю не завершене");
});

test('перемикач мови міняє адресу і текст, зберігаючи сторінку', async ({ page }) => {
  await page.goto('./uk/privacy');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Приватність');

  await page.getByRole('group', { name: 'Вибір мови' }).getByText('Slovenčina').click();

  await expect(page).toHaveURL(/\/sk\/privacy$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Súkromie');
  await expect(page.locator('html')).toHaveAttribute('lang', 'sk');
});

test('пряме відкриття глибокої адреси працює (404.html на GitHub Pages)', async ({ page }) => {
  await page.goto('./sk/about');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('O projekte');
});

test('приватність: сховища браузера лишаються порожніми', async ({ page }) => {
  await page.goto('./uk/');
  await page.goto('./sk/privacy');
  await page.goto('./uk/about');

  const state = await page.evaluate(async () => {
    const dbs = 'databases' in indexedDB ? await indexedDB.databases() : [];
    return {
      local: window.localStorage.length,
      session: window.sessionStorage.length,
      cookies: document.cookie,
      idb: dbs.length,
    };
  });

  expect(state).toEqual({ local: 0, session: 0, cookies: '', idb: 0 });
});

test('приватність: сторінка не робить жодного зовнішнього запиту', async ({ page }) => {
  const external: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith('http://localhost:4173')) external.push(r.url());
  });

  await page.goto('./uk/');
  await page.goto('./sk/');

  expect(external).toEqual([]);
});

test('клавіатура: перше натискання Tab дає посилання «перейти до змісту»', async ({
  page,
  isMobile,
}) => {
  // Мобільний Safari не має навігації клавішею Tab — перевіряємо на десктопі.
  test.skip(!!isMobile, 'на мобільному Safari немає клавіатурної навігації Tab');
  await page.goto('./uk/');
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toHaveText('Перейти до основного змісту');
});

test('сайт працює офлайн після першого завантаження (spec §6)', async ({ page, context }) => {
  await page.goto('./uk/');
  await page.goto('./uk/routes');

  // Обриваємо мережу повністю.
  await context.setOffline(true);

  // Переходи всередині сайту мають працювати: увесь контент уже в сторінці.
  await page.getByRole('link', { name: 'Тимчасове проживання — працевлаштування (§23)' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('працевлаштування (§23)');

  const grounds = page.locator('.route-page__grounds li');
  expect(await grounds.count()).toBeGreaterThan(10);

  await context.setOffline(false);
});
