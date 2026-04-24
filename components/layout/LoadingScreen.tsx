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
      background: "var(--color-primary)",
      gap: 20,
    }}>
      <img
        src="/icons/icon-192.png"
        alt={APP_NAME}
        width={120}
        height={120}
        style={{ borderRadius: 28, boxShadow: "0 8px 32px rgba(0,0,0,0.25)" }}
      />
      <p style={{ fontSize: 24, fontWeight: 800, color: "#fff", letterSpacing: "-0.3px" }}>{APP_NAME}</p>
      <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)" }}>Memuat…</p>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.65} }`}</style>
    </div>
  );
}
