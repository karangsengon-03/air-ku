"use client";
import { Droplets } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

export default function LoadingScreen() {
  return (
    <div style={{
      minHeight: "100svh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--color-bg)",
      gap: 16,
    }}>
      <div style={{
        background: "var(--color-primary)",
        borderRadius: 20,
        padding: 18,
        color: "#fff",
        animation: "pulse 1.5s infinite",
      }}>
        <Droplets size={36} />
      </div>
      <p style={{ fontSize: 22, fontWeight: 800, color: "var(--color-txt)" }}>{APP_NAME}</p>
      <p style={{ fontSize: 14, color: "var(--color-txt3)" }}>Memuat…</p>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.6} }`}</style>
    </div>
  );
}
