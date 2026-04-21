"use client";
import { Lock } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export default function LockBanner() {
  const { settings } = useAppStore();
  if (!settings.globalLock) return null;
  return (
    <div style={{
      background: "#B91C1C",
      color: "#fff",
      padding: "10px 16px",
      display: "flex",
      alignItems: "center",
      gap: 8,
      fontSize: 14,
      fontWeight: 600,
    }}>
      <Lock size={16} />
      <span>Aplikasi sedang dikunci. Tidak ada perubahan data yang diizinkan.</span>
    </div>
  );
}
