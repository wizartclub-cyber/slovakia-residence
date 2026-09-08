/**
 * Після збірки: підготовка до GitHub Pages.
 * 1) 404.html — копія index.html. GitHub Pages віддає її, коли людина відкриває
 *    /uk/about напряму; браузер завантажує сайт, і роутер показує потрібну сторінку.
 *    Без цього чисті адреси працювали б тільки при переході всередині сайту.
 * 2) .nojekyll — вимикає обробку Jekyll, яка ігнорує папки з підкресленням.
 */
import { copyFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../dist', import.meta.url));

copyFileSync(join(dist, 'index.html'), join(dist, '404.html'));
writeFileSync(join(dist, '.nojekyll'), '');

console.log('✓ dist/404.html і dist/.nojekyll створено (GitHub Pages).');
