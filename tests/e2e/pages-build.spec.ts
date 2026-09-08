import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import { parse } from 'yaml';

// GitHub Pages віддає статичні файли: якщо для адреси немає свого index.html,
// сервер відповідає 404 і пошук її не індексує. Перевіряємо, що збірка
// створила файл для кожної адреси з content/ui/site.yaml.
const root = fileURLToPath(new URL('../..', import.meta.url));
const site = parse(readFileSync(join(root, 'content/ui/site.yaml'), 'utf8')) as {
  locales: string[];
  nav: Array<{ path: string }>;
};

const routes = site.locales.flatMap((locale) =>
  site.nav.map((item) => (item.path ? `${locale}/${item.path}` : locale)),
);

test.describe('збірка для GitHub Pages', () => {
  for (const route of routes) {
    test(`/${route}/ має власний index.html`, () => {
      expect(existsSync(join(root, 'dist', route, 'index.html'))).toBe(true);
    });
  }

  test('є запасний 404.html і .nojekyll', () => {
    expect(existsSync(join(root, 'dist', '404.html'))).toBe(true);
    expect(existsSync(join(root, 'dist', '.nojekyll'))).toBe(true);
  });
});
