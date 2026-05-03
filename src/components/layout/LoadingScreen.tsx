"use client";
import { APP_NAME } from "@/lib/constants";

export default function LoadingScreen() {
  return (
    <div style={{
      minHeight: "100svh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      /* #15 Fix: #073571 → var(--color-primary) */
      background: "var(--color-primary)",
      gap: 20,
    }}>
      <img
        src="/icons/icon-192.png"
        alt={APP_NAME}
        width={140}
        height={140}
        style={{ borderRadius: 32, display: "block" }}
      />
      {/* #15 Fix: #fff → white */}
      <p style={{ fontSize: 24, fontWeight: 800, color: "white", letterSpacing: "-0.3px", margin: 0 }}>{APP_NAME}</p>
      <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", margin: 0 }}>Memuat…</p>
    </div>
  );
}
