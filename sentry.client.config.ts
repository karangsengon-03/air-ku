// sentry.client.config.ts
// Konfigurasi Sentry untuk client-side (browser)
//
// Cara aktivasi:
//   1. Daftar/login di https://sentry.io
//   2. Buat project baru → Next.js
//   3. Copy DSN dari Project Settings → Client Keys
//   4. Tambahkan ke .env.local:
//        NEXT_PUBLIC_SENTRY_DSN=https://xxx@o0.ingest.sentry.io/0
//
// Dokumentasi: https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Nonaktifkan jika DSN belum diset (development tanpa Sentry)
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Persentase transaksi yang di-trace untuk performance monitoring
  // 0.1 = 10% di production, 1.0 = 100% di development
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Persentase session replay (rekam sesi user saat error)
  // Hanya aktif di production untuk hemat kuota
  replaysOnErrorSampleRate: process.env.NODE_ENV === "production" ? 0.5 : 0,
  replaysSessionSampleRate: 0,

  // Debug mode hanya di development
  debug: process.env.NODE_ENV === "development",
});
