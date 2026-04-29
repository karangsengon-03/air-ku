"use client";
import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log ke console untuk debugging — tidak perlu Sentry di tahap ini
    console.error("[AirKu Error]", error);
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
