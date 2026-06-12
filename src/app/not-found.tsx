import Link from "next/link";
import { MapPin } from "lucide-react";

/**
 * not-found.tsx — Halaman 404 kustom Air-Ku.
 * Tampil saat user mengakses URL yang tidak ada.
 * Bahasa Indonesia, ramah, konsisten dengan offline page.
 */
export default function NotFound() {
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
          background: "rgba(3,105,161,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <MapPin size={36} style={{ color: "var(--color-primary)" }} />
      </div>

      {/* Teks */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
        <p
          style={{
            fontSize: "20px",
            fontWeight: 800,
            color: "var(--color-txt)",
            margin: 0,
          }}
        >
          Halaman Tidak Ditemukan
        </p>
        <p
          style={{
            fontSize: "14px",
            color: "var(--color-txt3)",
            maxWidth: "280px",
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          Halaman yang Anda cari tidak tersedia atau sudah dipindahkan.
          Silakan kembali ke beranda.
        </p>
      </div>

      {/* Tombol kembali */}
      <Link
        href="/"
        className="btn-primary"
        style={{ maxWidth: "220px", textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
      >
        Kembali ke Beranda
      </Link>
    </div>
  );
}
