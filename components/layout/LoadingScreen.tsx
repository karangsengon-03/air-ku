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
      background: "#0369A1",
      gap: 20,
    }}>
      {/* Logo SVG inline — zero artifacts, presisi 100% */}
      <svg width="120" height="120" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="#0369A1"/>
        <path d="M100 28 C100 28 60 80 60 108 C60 130.9 78.1 150 100 150 C121.9 150 140 130.9 140 108 C140 80 100 28 100 28Z"
              fill="white" opacity="0.95"/>
        <ellipse cx="88" cy="95" rx="8" ry="14" fill="white" opacity="0.3" transform="rotate(-20 88 95)"/>
        <path d="M42 145 C55 132 70 132 83 145 C96 158 111 158 124 145 C137 132 152 132 165 145"
              fill="none" stroke="white" strokeWidth="9" strokeLinecap="round" opacity="0.9"/>
        <path d="M42 165 C55 152 70 152 83 165 C96 178 111 178 124 165 C137 152 152 152 165 165"
              fill="none" stroke="white" strokeWidth="9" strokeLinecap="round" opacity="0.65"/>
      </svg>
      <p style={{ fontSize: 24, fontWeight: 800, color: "#fff", letterSpacing: "-0.3px", margin: 0 }}>{APP_NAME}</p>
      <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", margin: 0 }}>Memuat…</p>
    </div>
  );
}
