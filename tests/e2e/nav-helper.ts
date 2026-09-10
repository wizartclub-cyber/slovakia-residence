import type { Page } from '@playwright/test';

// На вузькому екрані меню сховане за кнопкою. Тести, які ходять по меню,
// мають працювати в обох проєктах (desktop і mobile) без копій.
export async function openNav(page: Page, label: 'Меню' | 'Menu'): Promise<void> {
  const toggle = page.getByRole('button', { name: label });
  if (await toggle.isVisible()) await toggle.click();
}
