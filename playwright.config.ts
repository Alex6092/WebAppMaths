import { defineConfig, devices } from '@playwright/test';

const PORT = 3100;

// Lance le serveur construit (npm run build avant) sur une base vide, puis joue les parcours
// en vue PC (Chrome), tablette Android et iPad (WebKit, le moteur de Safari).
export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'preparation', testMatch: /preparation\.setup\.ts/ },
    { name: 'pc', use: { ...devices['Desktop Chrome'] }, dependencies: ['preparation'] },
    { name: 'tablette', use: { ...devices['Galaxy Tab S4'] }, dependencies: ['preparation'] },
    { name: 'ipad', use: { ...devices['iPad (gen 7)'] }, dependencies: ['preparation'] },
  ],
  webServer: {
    command: `node -e "require('fs').rmSync('build/e2e-data',{recursive:true,force:true})" && node apps/server/dist/index.js`,
    url: `http://127.0.0.1:${PORT}/api/health`,
    reuseExistingServer: false,
    env: {
      PORT: String(PORT),
      DATA_DIR: 'build/e2e-data',
      ADMIN_INVITE_CODE: 'E2E0-TEST-CODE',
      COOKIE_SECURE: 'false',
      LOG_LEVEL: 'warn',
    },
  },
});
