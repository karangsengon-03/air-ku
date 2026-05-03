// sentry.edge.config.ts
// Konfigurasi Sentry untuk Edge Runtime (middleware Next.js)

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 1.0,

  debug: false,
});
