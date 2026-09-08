import { defineConfig, devices } from '@playwright/test';

const BASE = 'http://localhost:4173/slovakia-residence/';

// e2e ганяються на зібраному сайті (pnpm build → pnpm preview), а не на dev-сервері:
// у dev CSP навмисно послаблений, і перевірка приватності була б несправжньою.
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: BASE, trace: 'on-first-retry' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'] } },
  ],
  webServer: {
    command: 'pnpm build && pnpm preview --port 4173 --strictPort',
    url: BASE,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
