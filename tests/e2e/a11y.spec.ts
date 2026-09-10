/**
 * Доступність: автоматична перевірка axe за критеріями WCAG 2.2 AA.
 *
 * Автоперевірка ловить не все (контраст із токенів перевіряється окремим
 * unit-тестом, а логіку читання з клавіатури — тести в smoke/finder), але
 * зупиняє типові регресії: відсутні підписи, зламану ієрархію заголовків,
 * поля без назви.
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { openNav } from './nav-helper';

const PAGES = ['', 'finder', 'routes', 'authorities', 'sources', 'about', 'privacy', 'route/B2-employment-s23'];
const LOCALES = ['uk', 'sk'];

for (const locale of LOCALES) {
  for (const path of PAGES) {
    test(`/${locale}/${path} без порушень WCAG 2.2 AA`, async ({ page }) => {
      await page.goto(`./${locale}/${path}`);

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();

      expect(describe(results.violations)).toEqual([]);
    });
  }
}

test('результати опитувальника теж доступні', async ({ page }) => {
  await page.goto('./uk/finder');
  await page.locator('#citizenship-third_country').check();
  await page.getByRole('button', { name: 'Далі' }).click();
  for (let i = 0; i < 5; i += 1) {
    await page.getByRole('button', { name: 'Не знаю / пропустити' }).click();
  }

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();

  expect(describe(results.violations)).toEqual([]);
});

/** Розгорнутий опис порушення: що саме і де — щоб падіння тесту було зрозумілим. */
function describe(violations: Array<{ id: string; nodes: Array<{ target: unknown[]; failureSummary?: string }> }>) {
  return violations.flatMap((v) =>
    v.nodes.map(
      (n) =>
        `${v.id} @ ${n.target.join(' ')} — ${(n.failureSummary ?? '').split('\n').slice(1).join(' ')}`,
    ),
  );
}

test('перехід між сторінками оголошується скрінрідеру і переносить фокус', async ({ page }) => {
  await page.goto('./uk/');

  // Перше завантаження браузер озвучує сам — область оголошень порожня.
  await expect(page.locator('[role="status"]')).toBeEmpty();

  await openNav(page, 'Меню');
  await page.getByRole('navigation', { name: 'Головне меню' }).getByRole('link', { name: 'Джерела' }).click();

  await expect(page.locator('[role="status"]')).toContainText('Джерела');
  // Фокус має перейти на заголовок нової сторінки, а не лишитися в меню.
  await expect(page.locator(':focus')).toHaveText('Джерела');
});
