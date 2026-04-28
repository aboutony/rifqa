import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: {
    timeout: 5_000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.03,
    },
  },
  use: {
    baseURL: 'http://127.0.0.1:5174',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5174',
    url: 'http://127.0.0.1:5174',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'mobile-ar',
      use: { ...devices['Pixel 7'], locale: 'ar-SA' },
    },
    {
      name: 'mobile-en',
      use: { ...devices['Pixel 7'], locale: 'en-US' },
    },
    {
      name: 'desktop-en',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 }, locale: 'en-US' },
    },
  ],
})
