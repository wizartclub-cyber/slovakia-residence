import js from '@eslint/js';
import tseslint from 'typescript-eslint';

// Правило CLAUDE.md §2.1 («нуль персональних даних поза браузером») зроблено
// помилкою лінтера: випадкове звернення до localStorage не пройде перевірку.
const noBrowserStorage = {
  'no-restricted-globals': [
    'error',
    { name: 'localStorage', message: 'CLAUDE.md §2.1: жодних сховищ браузера.' },
    { name: 'sessionStorage', message: 'CLAUDE.md §2.1: жодних сховищ браузера.' },
    { name: 'indexedDB', message: 'CLAUDE.md §2.1: жодних сховищ браузера.' },
  ],
  'no-restricted-properties': [
    'error',
    { object: 'window', property: 'localStorage', message: 'CLAUDE.md §2.1' },
    { object: 'window', property: 'sessionStorage', message: 'CLAUDE.md §2.1' },
    { object: 'window', property: 'indexedDB', message: 'CLAUDE.md §2.1' },
  ],
};

const browserGlobals = {
  window: 'readonly',
  document: 'readonly',
  navigator: 'readonly',
  localStorage: 'readonly',
  sessionStorage: 'readonly',
  indexedDB: 'readonly',
  console: 'readonly',
  fetch: 'readonly',
};

const nodeGlobals = {
  console: 'readonly',
  process: 'readonly',
  URL: 'readonly',
  __dirname: 'readonly',
};

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'sources', 'playwright-report', 'test-results'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: { globals: browserGlobals },
    rules: noBrowserStorage,
  },
  {
    files: ['scripts/**/*.{ts,mjs}', '*.config.{ts,js}'],
    languageOptions: { globals: nodeGlobals },
  },
  {
    // Тести приватності навмисно читають сховища браузера, щоб довести, що вони порожні.
    files: ['tests/**/*.ts'],
    languageOptions: { globals: { ...browserGlobals, ...nodeGlobals } },
  },
);
