import { defineConfig, devices } from "@playwright/test";

/**
 * playwright.config.ts — Konfigurasi E2E test Air-Ku
 *
 * Untuk menjalankan:
 *   npm run test:e2e
 *
 * Prasyarat:
 *   1. Buat file .env.test.local dengan kredensial Firebase test
 *   2. Jalankan: npx playwright install --with-deps
 */
export default defineConfig({
  testDir: "./e2e",
  /* Timeout per test */
  timeout: 30_000,
  /* Matikan paralel untuk hindari konflik state */
  fullyParallel: false,
  /* Gagalkan CI jika ada test.only yang ketinggalan */
  forbidOnly: !!process.env.CI,
  /* Tidak retry di lokal, 1x retry di CI */
  retries: process.env.CI ? 1 : 0,
  /* Satu worker agar state bersih */
  workers: 1,

  reporter: [["html", { outputFolder: "playwright-report", open: "never" }], ["list"]],

  use: {
    /* URL dev server Next.js */
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3000",
    /* Screenshot saat fail */
    screenshot: "only-on-failure",
    /* Trace saat retry pertama */
    trace: "on-first-retry",
    /* Bahasa Indonesia agar teks UI konsisten */
    locale: "id-ID",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },
  ],

  /* Jalankan dev server otomatis sebelum test */
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
