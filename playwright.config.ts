import { defineConfig, devices } from '@playwright/test';

// Browser tests run against the built static site in `dist/`, served locally by
// `vite preview`. They never use the development server, a remote URL, or cloud
// credentials. Build first (`npm run test:browser` and `npm run test:a11y` do).
// A dedicated port keeps tests separate from a manually started preview.
const previewPort = 4174;
const baseURL = `http://localhost:${String(previewPort)}`;

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  outputDir: './test-results/playwright',
  fullyParallel: true,
  // Repeatable verification: no focused-test escape hatch and no flake retries.
  forbidOnly: true,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL,
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `vite preview --port ${String(previewPort)} --strictPort`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
