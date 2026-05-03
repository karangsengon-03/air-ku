import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // PWA headers
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
        ],
      },
    ];
  },
};

// Sentry hanya aktif jika NEXT_PUBLIC_SENTRY_DSN diisi di .env.local.
// Jika tidak ada DSN, aplikasi berjalan normal tanpa Sentry — tidak ada error build.
const hasSentryDsn = !!process.env.NEXT_PUBLIC_SENTRY_DSN;

export default hasSentryDsn
  ? withSentryConfig(nextConfig, {
      // Token untuk upload source maps ke Sentry (opsional)
      // Daftarkan di: https://sentry.io → Settings → Auth Tokens
      authToken: process.env.SENTRY_AUTH_TOKEN,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      // Sembunyikan log Sentry saat build
      silent: true,
      // Upload source maps untuk stack trace yang akurat, hapus setelah upload
      sourcemaps: {
        deleteSourcemapsAfterUpload: true,
      },
    })
  : nextConfig;
