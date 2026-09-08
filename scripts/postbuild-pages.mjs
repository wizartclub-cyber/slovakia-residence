/**
 * Після збірки: підготовка до GitHub Pages.
 *
 * GitHub Pages віддає файли, а не запускає сервер. Тому для кожної адреси,
 * яка має індексуватися пошуком (/uk/, /sk/about …), кладемо справжній файл
 * index.html — інакше сервер відповідає «404 сторінку не знайдено», і Google
 * такі адреси ігнорує, навіть якщо людина бачить нормальний сайт.
 *
 * Список адрес береться з content/ui/site.yaml (мови × пункти меню) —
 * додати сторінку в меню достатньо там, код правити не треба.
 *
 * 404.html лишається як запасний варіант для всіх інших адрес.
 * .nojekyll вимикає обробку Jekyll, яка ігнорує папки з підкресленням.
 */
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = join(root, 'dist');
const indexHtml = join(dist, 'index.html');

const site = parse(readFileSync(join(root, 'content/ui/site.yaml'), 'utf8'));

const routes = site.locales.flatMap((locale) =>
  site.nav.map((item) => (item.path ? `${locale}/${item.path}` : locale)),
);

for (const route of routes) {
  const dir = join(dist, route);
  mkdirSync(dir, { recursive: true });
  copyFileSync(indexHtml, join(dir, 'index.html'));
}

copyFileSync(indexHtml, join(dist, '404.html'));
writeFileSync(join(dist, '.nojekyll'), '');

console.log(`✓ Сторінки для GitHub Pages: ${routes.join(', ')} + 404.html + .nojekyll`);
