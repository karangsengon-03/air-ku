import type { NextConfig } from "next";
import { readFileSync } from "fs";
import { join } from "path";

// Baca versi dari package.json — satu-satunya sumber kebenaran versi
const { version } = JSON.parse(
  readFileSync(join(process.cwd(), "package.json"), "utf-8")
) as { version: string };

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Inject APP_VERSION dari package.json ke semua komponen via env
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
  },
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

export default nextConfig;
