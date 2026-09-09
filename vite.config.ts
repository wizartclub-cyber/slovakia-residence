import { readFile } from 'node:fs/promises';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { parse } from 'yaml';

// Юридичні дані з content/**/*.yaml вбудовуються у збірку на етапі білду.
// У готовому сайті немає жодного мережевого запиту за контентом (CLAUDE.md §2.1).
function contentYaml(): Plugin {
  return {
    name: 'content-yaml',
    enforce: 'pre',
    async load(id) {
      const file = id.split('?')[0] ?? '';
      if (!file.endsWith('.yaml') && !file.endsWith('.yml')) return null;
      const raw = await readFile(file, 'utf8');
      return `export default ${JSON.stringify(parse(raw))};`;
    },
  };
}

// У dev-режимі Vite потрібен websocket для гарячого перезавантаження, а продакшн-CSP
// його забороняє. Тому тільки під час `pnpm dev` метатег послаблюється.
// У зібраному сайті (dist/) лишається строгий CSP з index.html.
function relaxCspInDev(): Plugin {
  return {
    name: 'csp-dev-relax',
    apply: 'serve',
    transformIndexHtml(html) {
      return html.replace(
        /<meta\s+http-equiv="Content-Security-Policy"[\s\S]*?>/,
        `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' ws: wss:; form-action 'none'; base-uri 'self'">`,
      );
    },
  };
}

export default defineConfig({
  base: '/slovakia-residence/',
  plugins: [contentYaml(), react(), relaxCspInDev()],
  build: {
    target: 'es2022',
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        // Сторінки НЕ ділимо на частини, які довантажуються пізніше: spec §6
        // вимагає, щоб сайт працював офлайн після першого завантаження, а
        // відкладений шматок офлайн просто не завантажиться.
        // Бібліотеки виносимо окремо — вони не змінюються між релізами,
        // тож браузер не качатиме їх заново щоразу.
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom', 'i18next', 'react-i18next'],
        },
      },
    },
  },
  test: {
    include: ['tests/{unit,rules}/**/*.test.ts'],
    environment: 'node',
  },
});
