// sentry.server.config.ts
// Konfigurasi Sentry untuk server-side (Next.js Server Components, API Routes)
//
// File ini di-load otomatis oleh @sentry/nextjs saat withSentryConfig diaktifkan.

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Trace rate lebih rendah di server (lebih banyak traffic)
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 1.0,

  debug: process.env.NODE_ENV === "development",
});
