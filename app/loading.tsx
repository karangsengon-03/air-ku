import { APP_NAME } from "@/lib/constants";

/**
 * Global loading.tsx — ditampilkan Next.js secara otomatis saat
 * navigasi ke route baru sedang berlangsung (Suspense boundary).
 * Menggunakan LoadingScreen visual yang sama agar konsisten.
 */
export default function GlobalLoading() {
  return (
    <div
      style={{
        minHeight: "100svh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#073571",
        gap: "20px",
      }}
    >
      <img
        src="/icons/icon-192.png"
        alt={APP_NAME}
        width={100}
        height={100}
        style={{ borderRadius: "24px", display: "block", opacity: 0.9 }}
      />
      <p
        style={{
          fontSize: "20px",
          fontWeight: 800,
          color: "#fff",
          letterSpacing: "-0.3px",
          margin: 0,
        }}
      >
        {APP_NAME}
      </p>
      <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", margin: 0 }}>
        Memuat…
      </p>
    </div>
  );
}
