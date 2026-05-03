"use client";
import { AlertTriangle } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export default function Confirm() {
  const { confirm, closeConfirm } = useAppStore();
  if (!confirm.open) return null;

  const handleConfirm = () => {
    confirm.onConfirm();
    closeConfirm();
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
      zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20,
    }}>
      <div className="card" style={{ width: "min(100%, 360px)", padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <AlertTriangle size={22} color={confirm.danger ? "var(--color-belum)" : "var(--color-tunggakan)"} />
          <p style={{ fontSize: 17, fontWeight: 700, color: "var(--color-txt)" }}>{confirm.title}</p>
        </div>
        <p style={{ fontSize: 14, color: "var(--color-txt2)", lineHeight: 1.6, marginBottom: 20 }}>{confirm.message}</p>
        <div className="row-10">
          <button onClick={closeConfirm} className="btn-secondary" style={{ flex: 1, height: 48 }}>
            Batal
          </button>
          <button
            onClick={handleConfirm}
            className={`btn-primary${confirm.danger ? " btn-danger" : ""}`}
            style={{ flex: 1, height: 48 }}
          >
            Ya, Lanjutkan
          </button>
        </div>
      </div>
    </div>
  );
}
