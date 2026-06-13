import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './test',
  testMatch: 'browser.spec.js',
  fullyParallel: true,
  retries: 0,
  workers: 1,
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'node test-server.js',
    port: 8080,
    reuseExistingServer: !process.env.CI,
  },
});
