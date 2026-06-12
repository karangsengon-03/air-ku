"use client";
// #16a — Sub-komponen untuk stat summary tunggakan
import { formatRp } from "@/lib/helpers";

interface TunggakanSummaryProps {
  totalNominal: number;
  totalPelanggan: number;
  totalBulan: number;
}

export default function TunggakanSummary({
  totalNominal,
  totalPelanggan,
  totalBulan,
}: TunggakanSummaryProps) {
  return (
    <div style={{ display: "flex", gap: 10 }}>
      <div
        className="card flex-1"
        style={{ borderLeft: "3px solid var(--color-tunggakan)", padding: "14px 10px" }}
      >
        <div className="section-label mb-1">Total Nominal</div>
        <div className="mono font-bold" style={{ color: "var(--color-tunggakan)", fontSize: 13 }}>
          {formatRp(totalNominal)}
        </div>
      </div>
      <div
        className="card flex-1"
        style={{ borderLeft: "3px solid var(--color-belum)", padding: "14px 10px" }}
      >
        <div className="section-label mb-1">Pelanggan</div>
        <div className="mono font-bold" style={{ color: "var(--color-belum)", fontSize: 13 }}>
          {totalPelanggan} orang
        </div>
      </div>
      <div
        className="card flex-1"
        style={{ borderLeft: "3px solid var(--color-txt3)", padding: "14px 10px" }}
      >
        <div className="section-label mb-1">Tagihan</div>
        <div className="mono font-bold" style={{ color: "var(--color-txt2)", fontSize: 13 }}>
          {totalBulan} bulan
        </div>
      </div>
    </div>
  );
}
