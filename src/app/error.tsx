"use client";
import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Kirim error ke Sentry jika DSN dikonfigurasi, fallback ke console
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      Sentry.captureException(error);
    } else {
      console.error("[AirKu Error]", error);
    }
  }, [error]);

  return (
    <div
      style={{
        minHeight: "100svh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-bg)",
        padding: "24px",
        gap: "16px",
        textAlign: "center",
      }}
    >
      <AlertTriangle
        size={48}
        style={{ color: "var(--color-belum)", flexShrink: 0 }}
      />
      <div>
        <p
          style={{
            fontSize: "18px",
            fontWeight: 700,
            color: "var(--color-txt)",
            marginBottom: "8px",
          }}
        >
          Terjadi Kesalahan
        </p>
        <p style={{ fontSize: "14px", color: "var(--color-txt3)", maxWidth: "280px" }}>
          {error.message || "Aplikasi mengalami error yang tidak terduga."}
        </p>
      </div>
      <button className="btn-primary" style={{ maxWidth: "200px" }} onClick={reset}>
        Coba Lagi
      </button>
    </div>
  );
}
