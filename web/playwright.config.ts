import { defineConfig, devices } from '@playwright/test';

const WEB_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3002';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: WEB_URL,
    launchOptions: process.env.PW_EXECUTABLE_PATH
      ? { executablePath: process.env.PW_EXECUTABLE_PATH }
      : {},
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: undefined,
  globalSetup: undefined,
});