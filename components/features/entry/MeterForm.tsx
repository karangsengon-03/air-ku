"use client";
import { AlertCircle } from "lucide-react";
import { formatRp, formatM3 } from "@/lib/helpers";
import { AppSettings } from "@/types";

interface KalkulasiResult {
  pemakaian: number;
  total: number;
  subtotalBlok1: number;
  subtotalBlok2: number;
  subtotalPemakaian: number;
  blokDetail: Array<{ batasAtas: number | null; subtotal: number }>;
}

interface MeterFormProps {
  bulanLabel: string;
  meterAwal: number | "";
  meterAkhir: number | "";
  meterAwalAuto: boolean;
  kalkulasi: KalkulasiResult | null;
  settings: AppSettings;
  meterAkhirRef: React.RefObject<HTMLInputElement | null>;
  onMeterAwalChange: (v: number | "") => void;
  onMeterAkhirChange: (v: number | "") => void;
}

export default function MeterForm({
  bulanLabel, meterAwal, meterAkhir, meterAwalAuto, kalkulasi, settings,
  meterAkhirRef, onMeterAwalChange, onMeterAkhirChange,
}: MeterFormProps) {
  return (
    <div className="card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
      <p style={{ fontWeight: 700, fontSize: 14, color: "var(--color-txt)" }}>Meter Air — {bulanLabel}</p>

      {/* Meter Awal */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 700, color: "var(--color-txt3)", display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
          METER AWAL (m³)
          {meterAwalAuto && (
            <span style={{ fontSize: 10, background: "rgba(21,128,61,0.12)", color: "var(--color-lunas)", padding: "2px 6px", borderRadius: 10 }}>
              Otomatis
            </span>
          )}
        </label>
        <input
          className="input-field mono"
          type="number"
          inputMode="numeric"
          placeholder="0"
          value={meterAwal}
          readOnly={meterAwalAuto}
          style={meterAwalAuto ? { background: "var(--color-border)" } : {}}
          onChange={(e) => onMeterAwalChange(e.target.value === "" ? "" : Number(e.target.value))}
        />
      </div>

      {/* Meter Sekarang */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 700, color: "var(--color-txt3)", display: "block", marginBottom: 6 }}>
          METER SEKARANG (m³)
        </label>
        <input
          ref={meterAkhirRef}
          className="input-field mono"
          type="number"
          inputMode="numeric"
          placeholder="Angka di meteran"
          value={meterAkhir}
          onChange={(e) => onMeterAkhirChange(e.target.value === "" ? "" : Number(e.target.value))}
        />
        {typeof meterAkhir === "number" && typeof meterAwal === "number" && meterAkhir < meterAwal && (
          <p style={{ fontSize: 11, color: "var(--color-belum)", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
            <AlertCircle size={11} /> Tidak boleh kurang dari meter awal
          </p>
        )}
      </div>

      {/* Preview Tagihan */}
      {kalkulasi && (
        <div style={{ background: "var(--color-bg)", borderRadius: 10, padding: 12, display: "flex", flexDirection: "column", gap: 6 }}>
          <p style={{ fontWeight: 700, fontSize: 13, color: "var(--color-txt)", marginBottom: 2 }}>Preview Tagihan</p>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: "var(--color-txt3)" }}>Pemakaian</span>
            <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{formatM3(kalkulasi.pemakaian)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: "var(--color-txt3)" }}>Abonemen</span>
            <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{formatRp(settings.abonemen)}</span>
          </div>
          {kalkulasi.blokDetail.map((blok, idx) => blok.subtotal > 0 && (
            <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: "var(--color-txt3)" }}>
                Blok {idx + 1}
                {blok.batasAtas !== null
                  ? ` (≤${blok.batasAtas}m³)`
                  : ` (>${(kalkulasi.blokDetail[idx - 1]?.batasAtas ?? 0)}m³)`}
              </span>
              <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{formatRp(blok.subtotal)}</span>
            </div>
          ))}
          <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: 8, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 700, color: "var(--color-txt)" }}>Total</span>
            <span style={{ fontWeight: 900, fontSize: 16, color: "var(--color-primary)", fontFamily: "monospace" }}>
              {formatRp(kalkulasi.total)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
