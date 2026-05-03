"use client";
import { CheckCircle, XCircle, Info, X } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export default function Toast() {
  const { toasts, removeToast } = useAppStore();
  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)",
      zIndex: 9999, display: "flex", flexDirection: "column", gap: 8,
      width: "min(92vw, 380px)",
    }}>
      {toasts.map((t) => (
        <div key={t.id} style={{
          display: "flex", alignItems: "center", gap: 10,
          /* #15 Fix: gunakan CSS vars */
          background: t.type === "success" ? "var(--color-lunas)" : t.type === "error" ? "var(--color-belum)" : "var(--color-primary)",
          /* #15 Fix: #fff → white */
          color: "white", borderRadius: 10, padding: "12px 14px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
          animation: "slideDown 0.2s ease",
        }}>
          {t.type === "success" && <CheckCircle size={18} />}
          {t.type === "error" && <XCircle size={18} />}
          {t.type === "info" && <Info size={18} />}
          <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{t.message}</span>
          <button onClick={() => removeToast(t.id)} aria-label="Tutup notifikasi" style={{ background: "none", border: "none", color: "white", cursor: "pointer", padding: 2 }}>
            <X size={16} />
          </button>
        </div>
      ))}
      <style>{`@keyframes slideDown { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }`}</style>
    </div>
  );
}
