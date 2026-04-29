"use client";
import { WifiOff, RefreshCw } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

/**
 * offline/page.tsx — Halaman fallback saat Service Worker mendeteksi
 * bahwa user offline dan konten tidak tersedia di cache.
 * SW mengalihkan ke /offline ketika fetch gagal.
 */
export default function OfflinePage() {
  return (
    <div
      style={{
        minHeight: "100svh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-bg)",
        padding: "32px 24px",
        gap: "20px",
        textAlign: "center",
      }}
    >
      {/* Ikon */}
      <div
        style={{
          width: "80px",
          height: "80px",
          borderRadius: "50%",
          background: "rgba(185,28,28,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <WifiOff size={36} style={{ color: "var(--color-belum)" }} />
      </div>

      {/* Teks */}
      <div className="col-10">
        <p
          style={{
            fontSize: "20px",
            fontWeight: 800,
            color: "var(--color-txt)",
            margin: 0,
          }}
        >
          Tidak Ada Koneksi
        </p>
        <p
          style={{
            fontSize: "14px",
            color: "var(--color-txt3)",
            maxWidth: "260px",
            lineHeight: 1.5,
            margin: "0 auto",
          }}
        >
          {APP_NAME} membutuhkan koneksi internet untuk memuat data terbaru.
          Periksa koneksi Wi-Fi atau data seluler Anda.
        </p>
      </div>

      {/* Tombol retry */}
      <button
        className="btn-primary"
        style={{ maxWidth: "220px" }}
        onClick={() => {
          // Coba reload ke halaman utama
          window.location.href = "/";
        }}
      >
        <RefreshCw size={16} />
        Coba Lagi
      </button>
    </div>
  );
}
