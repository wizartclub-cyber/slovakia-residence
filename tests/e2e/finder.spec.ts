import { expect, test } from '@playwright/test';

/** Порядок питань — з content/ui/finder.yaml. */
const STEP_IDS = ['citizenship', 'location', 'purpose', 'currentStatus', 'specialStatus', 'family'];

/** Проходить опитувальник: де є відповідь — обирає її, де немає — пропускає. */
async function fillFinder(
  page: import('@playwright/test').Page,
  choices: Record<string, string>,
  labels: { skip: string; next: string; results: string },
) {
  for (const [i, stepId] of STEP_IDS.entries()) {
    const last = i === STEP_IDS.length - 1;
    const choice = choices[stepId];

    if (choice === undefined) {
      await page.getByRole('button', { name: labels.skip }).click();
      continue;
    }

    await page.locator(`#${stepId}-${choice}`).check();
    await page.getByRole('button', { name: last ? labels.results : labels.next }).click();
  }
}

const UK = { skip: 'Не знаю / пропустити', next: 'Далі', results: 'Показати маршрути' };

test('опитувальник доводить до маршрутів (uk)', async ({ page }) => {
  await page.goto('./uk/finder');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Знайти свій маршрут');

  await fillFinder(page, { citizenship: 'third_country', purpose: 'employment' }, UK);

  await expect(page.getByRole('heading', { name: 'Що вам може підійти' })).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Тимчасове проживання — працевлаштування (§23)' }),
  ).toBeVisible();
});

test('маршрут із неповними умовами не обіцяє придатності', async ({ page }) => {
  await page.goto('./uk/finder');
  await fillFinder(page, { citizenship: 'third_country', purpose: 'employment' }, UK);

  const card = page.locator('.route-card', { hasText: 'працевлаштування (§23)' });
  await expect(card.getByText('не перевірено юристом')).toBeVisible();
  await expect(card.locator('.route-card__outcome')).toHaveText('варте уваги');
  await expect(card.getByText('Умови цього маршруту ще не внесені повністю', { exact: false })).toBeVisible();
});

test('громадянин ЄС отримує маршрути за правом ЄС, а не для третіх країн', async ({ page }) => {
  await page.goto('./uk/finder');
  await fillFinder(page, { citizenship: 'eu_eea_ch' }, UK);

  const offered = page.locator('.route-card');
  await expect(offered.filter({ hasText: 'Громадянин ЄС' }).first()).toBeVisible();
  // Маршрути для третіх країн мають опинитися серед тих, що не підійшли.
  await expect(offered.filter({ hasText: 'працевлаштування (§23)' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Показати, що не підійшло/ })).toBeVisible();
});

test('перезавантаження стирає відповіді (DoD)', async ({ page }) => {
  await page.goto('./uk/finder');
  await fillFinder(page, { citizenship: 'third_country', purpose: 'employment' }, UK);
  await expect(page.getByRole('heading', { name: 'Що вам може підійти' })).toBeVisible();

  await page.reload();

  await expect(page.getByText(`Питання 1 з ${STEP_IDS.length}`)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Що вам може підійти' })).toHaveCount(0);
});

test('кнопка «Очистити все» повертає на перше питання', async ({ page }) => {
  await page.goto('./uk/finder');
  await fillFinder(page, { citizenship: 'third_country', purpose: 'employment' }, UK);

  await page.getByRole('button', { name: 'Очистити все і почати спочатку' }).click();

  await expect(page.getByText(`Питання 1 з ${STEP_IDS.length}`)).toBeVisible();
  await expect(page.locator('#citizenship-third_country')).not.toBeChecked();
});

test('відповіді не потрапляють в адресу сторінки', async ({ page }) => {
  await page.goto('./uk/finder');
  await fillFinder(page, { citizenship: 'third_country', purpose: 'employment' }, UK);
  expect(page.url()).not.toContain('third_country');
  expect(page.url()).not.toContain('?');
});

test('приватність: після опитувальника сховища браузера порожні', async ({ page }) => {
  await page.goto('./uk/finder');
  await fillFinder(page, { citizenship: 'third_country', purpose: 'employment' }, UK);

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

test('опитувальник працює словацькою', async ({ page }) => {
  await page.goto('./sk/finder');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Nájdite svoju cestu');

  await fillFinder(
    page,
    { citizenship: 'third_country', purpose: 'employment' },
    { skip: 'Neviem / preskočiť', next: 'Ďalej', results: 'Zobraziť cesty' },
  );

  await expect(page.getByRole('heading', { name: 'Čo pre vás môže prichádzať do úvahy' })).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Prechodný pobyt na účel zamestnania (§23)' }),
  ).toBeVisible();
});

test('варіант відповіді обирається з клавіатури', async ({ page }) => {
  await page.goto('./uk/finder');
  await page.locator('#citizenship-eu_eea_ch').focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('#citizenship-third_country')).toBeChecked();
});

test('таблиця порівняння показує строки і суми', async ({ page }) => {
  await page.goto('./uk/finder');
  await fillFinder(page, { citizenship: 'third_country', purpose: 'employment', location: 'abroad' }, UK);

  const table = page.locator('.comparison table');
  await expect(table).toBeVisible();
  await expect(table.getByRole('columnheader', { name: 'Строк рішення' })).toBeVisible();

  const rows = table.locator('tbody tr');
  expect(await rows.count()).toBeGreaterThanOrEqual(2);
  await expect(page.getByText('це не рейтинг', { exact: false })).toBeVisible();
});

test('прогрес доступний скрінрідеру і рухається', async ({ page }) => {
  await page.goto('./uk/finder');
  const bar = page.getByRole('progressbar');

  await expect(bar).toHaveAttribute('aria-valuemin', '1');
  await expect(bar).toHaveAttribute('aria-valuemax', String(STEP_IDS.length));
  await expect(bar).toHaveAttribute('aria-valuenow', '1');

  await page.locator('#citizenship-third_country').check();
  await page.getByRole('button', { name: 'Далі' }).click();

  await expect(bar).toHaveAttribute('aria-valuenow', '2');
});

test('дані відповіді показані як chips і кожну можна змінити', async ({ page }) => {
  await page.goto('./uk/finder');
  await page.locator('#citizenship-third_country').check();
  await page.getByRole('button', { name: 'Далі' }).click();
  await page.locator('#location-abroad').check();
  await page.getByRole('button', { name: 'Далі' }).click();

  const chips = page.locator('.chip');
  await expect(chips).toHaveCount(2);
  await expect(chips.first()).toContainText('Країна поза ЄС');

  // Клік по chip повертає саме до того питання.
  await chips.first().click();
  await expect(page.getByText(`Питання 1 з ${STEP_IDS.length}`)).toBeVisible();
  await expect(page.locator('#citizenship-third_country')).toBeChecked();
});
