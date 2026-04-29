"use client";
import { formatRp } from "@/lib/helpers";
import { QUICKPAY_PRESETS } from "@/lib/constants";

interface QuickPayFormProps {
  bulanLabel: string;
  qpPreset: number | null;
  qpManual: string;
  qpNominal: number;
  qpValid: boolean;
  qpIsZero: boolean;
  qpManualRef: React.RefObject<HTMLInputElement | null>;
  onPresetChange: (v: number | null) => void;
  onManualChange: (v: string) => void;
}

export default function QuickPayForm({
  bulanLabel, qpPreset, qpManual, qpNominal, qpValid, qpIsZero,
  qpManualRef, onPresetChange, onManualChange,
}: QuickPayFormProps) {
  return (
    <div className="card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
      <p style={{ fontWeight: 700, fontSize: 14, color: "var(--color-txt)" }}>Iuran Rata — {bulanLabel}</p>

      <div style={{
        background: "rgba(21,128,61,0.06)", border: "1px solid rgba(21,128,61,0.2)",
        borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "var(--color-txt2)",
      }}>
        Ketik <strong>0</strong> untuk pelanggan baru yang belum bayar di bulan ini
      </div>

      <div>
        <label style={{ fontSize: 12, fontWeight: 700, color: "var(--color-txt3)", display: "block", marginBottom: 8 }}>
          PILIH NOMINAL (ribu Rp)
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
          {/* Preset 0 */}
          <button
            onClick={() => onPresetChange(0 === qpPreset ? null : 0)}
            style={{
              padding: "10px 4px", borderRadius: 8, fontSize: 13, fontWeight: 800,
              border: qpPreset === 0 ? "2px solid var(--color-lunas)" : "2px solid var(--color-border)",
              background: qpPreset === 0 ? "rgba(21,128,61,0.1)" : "var(--color-bg)",
              color: qpPreset === 0 ? "var(--color-lunas)" : "var(--color-txt3)",
              cursor: "pointer", fontFamily: "JetBrains Mono, monospace",
            }}
          >
            0
          </button>
          {QUICKPAY_PRESETS.map((v) => (
            <button
              key={v}
              onClick={() => onPresetChange(v === qpPreset ? null : v)}
              style={{
                padding: "10px 4px", borderRadius: 8, fontSize: 14, fontWeight: 800,
                border: qpPreset === v ? "2px solid var(--color-primary)" : "2px solid var(--color-border)",
                background: qpPreset === v ? "rgba(3,105,161,0.1)" : "var(--color-bg)",
                color: qpPreset === v ? "var(--color-primary)" : "var(--color-txt)",
                cursor: "pointer", fontFamily: "JetBrains Mono, monospace",
              }}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label style={{ fontSize: 12, fontWeight: 700, color: "var(--color-txt3)", display: "block", marginBottom: 6 }}>
          ATAU KETIK MANUAL (×1.000)
        </label>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            ref={qpManualRef}
            className="input-field mono"
            inputMode="numeric"
            placeholder="25 = Rp 25.000 | 0 = pelanggan baru"
            value={qpManual}
            onChange={(e) => onManualChange(e.target.value.replace(/\D/g, ""))}
            style={{ flex: 1 }}
          />
          <span style={{ fontSize: 13, color: "var(--color-txt3)", whiteSpace: "nowrap" }}>× 1.000</span>
        </div>
      </div>

      {qpValid && (
        <div style={{ background: "rgba(3,105,161,0.08)", borderRadius: 10, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "var(--color-txt2)", fontWeight: 600 }}>Total Pembayaran</span>
          <span style={{ fontSize: 22, fontWeight: 900, color: qpIsZero ? "var(--color-lunas)" : "var(--color-primary)", fontFamily: "JetBrains Mono, monospace" }}>
            {qpIsZero ? "Rp 0 (Baru)" : formatRp(qpNominal)}
          </span>
        </div>
      )}
    </div>
  );
}
