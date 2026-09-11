import { expect, test } from '@playwright/test';

test('сторінка пояснює, що ми не бронюємо і не є посередником', async ({ page }) => {
  await page.goto('./uk/booking');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Запис до іноземної поліції');
  await expect(page.locator('.route-page__warning')).toContainText('не є посередником');
});

test('посилання на офіційну систему відкривається безпечно в новій вкладці', async ({ page }) => {
  await page.goto('./uk/booking');
  const link = page.getByRole('link', { name: 'Перейти до офіційної системи MV SR' });

  await expect(link).toHaveAttribute('href', 'https://www.minv.sk/?objednavaci-system-na-ocp');
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toHaveAttribute('rel', /noopener/);
  await expect(link).toHaveAttribute('rel', /noreferrer/);
});

test('кроки пронумеровані і кожен показує джерело з датою перевірки', async ({ page }) => {
  await page.goto('./uk/booking');
  const steps = page.locator('.booking-step');
  expect(await steps.count()).toBeGreaterThanOrEqual(5);

  for (const step of await steps.all()) {
    await expect(step.locator('.booking-source')).toContainText('11.09.2026');
  }
});

test('офіційні числа показані так, як їх пише міністерство', async ({ page }) => {
  await page.goto('./uk/booking');

  // Одна резервація на 15 днів — не дві, як у загальних агендах.
  await expect(page.getByText('ОДНУ резервацію на всі локації протягом 15', { exact: false })).toBeVisible();
  // Блокування 60 днів і скасування за 12 годин.
  await expect(page.getByText('60 календарних днів', { exact: false })).toBeVisible();
  await expect(page.getByText('щонайменше за 12 годин', { exact: false })).toBeVisible();
  // Вивільнення о 15:00 з інтервалом 20 хвилин.
  await expect(page.getByText('від 15:00 з інтервалом 20 хвилин', { exact: false })).toBeVisible();
});

test('поширені поради, які джерело спростовує, названі прямо', async ({ page }) => {
  await page.goto('./uk/booking');

  await expect(page.getByText('о 7–8 ранку', { exact: false })).toBeVisible();
  await expect(page.getByText('«скасовувати щонайменше за 24 години»', { exact: false })).toBeVisible();
});

test('порада надіслати документи поштою позначена як непідтверджена законом', async ({ page }) => {
  await page.goto('./uk/booking');
  const card = page.locator('#p-post');

  await expect(card.locator('.booking-problem__severity')).toContainText('Критично');
  await expect(card).toContainText('подавати заяву особисто');
  await expect(card).toContainText('§17');
  await expect(card).toContainText('незаконного перебування');
});

test('фільтр за типом проблеми звужує список', async ({ page }) => {
  await page.goto('./uk/booking');
  const all = await page.locator('.booking-problem').count();
  expect(all).toBeGreaterThanOrEqual(6);

  await page.getByRole('button', { name: 'Немає термінів' }).click();
  const filtered = await page.locator('.booking-problem').count();
  expect(filtered).toBeLessThan(all);
  expect(filtered).toBeGreaterThan(0);
});

test('на вузькому екрані немає горизонтального прокручування', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('./uk/booking');

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test('сторінка існує словацькою', async ({ page }) => {
  await page.goto('./sk/booking');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Objednanie na cudzineckú políciu');
});
