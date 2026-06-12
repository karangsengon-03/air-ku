"use client";
// #16c — Dipecah dari SettingsSections.tsx
import { useState } from "react";
import { AlertTriangle, ToggleLeft, ToggleRight } from "lucide-react";
import { updateSettings } from "@/lib/db";
import { AppSettings } from "@/types";
import { toast } from "@/lib/toast";
import SettingsSection from "./SettingsSection";

export default function ModeTunggakanSection({ settings }: { settings: AppSettings }) {
  const [saving, setSaving] = useState(false);
  const isMandiri = settings.modeTunggakan === "mandiri";

  const toggle = async () => {
    const newMode = isMandiri ? "carryover" : "mandiri";
    setSaving(true);
    try {
      await updateSettings({ modeTunggakan: newMode });
      toast.success(`Mode tunggakan: ${newMode === "mandiri" ? "Berdiri Sendiri" : "Carry-over"}`);
    } catch { toast.error("Gagal mengubah mode"); }
    finally { setSaving(false); }
  };

  return (
    <SettingsSection icon={<AlertTriangle size={18} />} title="Mode Tunggakan">
      <div style={{ paddingTop: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "var(--color-txt)" }}>
              {isMandiri ? "Berdiri Sendiri" : "Carry-over"}
            </div>
            <div style={{ fontSize: 13, color: "var(--color-txt3)", marginTop: 2 }}>
              {isMandiri ? "Setiap bulan dihitung terpisah" : "Tunggakan dijumlahkan ke tagihan berikutnya"}
            </div>
          </div>
          <button onClick={toggle} disabled={saving}
            style={{ background: "none", border: "none", cursor: "pointer", color: isMandiri ? "var(--color-txt3)" : "var(--color-primary)" }}>
            {isMandiri ? <ToggleLeft size={40} strokeWidth={1.5} /> : <ToggleRight size={40} strokeWidth={1.5} />}
          </button>
        </div>
        <div style={{ background: "var(--color-bg)", borderRadius: 8, padding: 12, fontSize: 13, color: "var(--color-txt3)" }}>
          <div style={{ marginBottom: 6, fontWeight: 600, color: "var(--color-txt2)" }}>Penjelasan mode:</div>
          <div style={{ marginBottom: 4 }}><strong>Berdiri Sendiri:</strong> Tunggakan tiap bulan ditampilkan terpisah.</div>
          <div><strong>Carry-over:</strong> Total semua tunggakan diakumulasikan dan ditagihkan sekaligus.</div>
        </div>
      </div>
    </SettingsSection>
  );
}
