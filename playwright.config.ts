import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  testMatch: ['visual.*.spec.ts'],
  use: {
    baseURL: 'http://localhost:5173',
    viewport: { width: 900, height: 900 }
  },
  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: true,
    timeout: 60_000
  },
  reporter: [['list']]
});
