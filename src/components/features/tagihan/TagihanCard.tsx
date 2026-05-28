"use client";
import { CheckCircle2, Clock, AlertTriangle, Share2, Download } from "lucide-react";
import { formatRp, formatM3, formatTanggal, isMenunggak } from "@/lib/helpers";
import { Tagihan } from "@/types";
import { useAppStore } from "@/store/useAppStore";

interface TagihanCardProps {
  tagihan: Tagihan;
  onShare?: (t: Tagihan) => void;
  onDownload?: (t: Tagihan) => void;
}

export default function TagihanCard({ tagihan: t, onShare, onDownload }: TagihanCardProps) {
  const { activeBulan, activeTahun } = useAppStore();
  const lunas = t.status === "lunas";
  const menunggak = !lunas && isMenunggak(t.bulan, t.tahun, activeBulan, activeTahun);
  const isIuranRata = t.meterAwal === 0 && t.meterAkhir === 0;

  const statusColor = lunas
    ? "var(--color-lunas)"
    : menunggak ? "var(--color-belum)" : "var(--color-tunggakan)";
  const statusBg = lunas
    ? "rgba(21,128,61,0.12)"
    : menunggak ? "rgba(185,28,28,0.12)" : "rgba(202,138,4,0.12)";

  return (
    <div
      className="card"
      style={{
        padding: "14px 16px",
        borderLeft: `4px solid ${lunas ? "var(--color-lunas)" : menunggak ? "var(--color-belum)" : "var(--color-tunggakan)"}`,
      }}
    >
      {/* Nama + badge */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
        <div className="flex-min">
          <div style={{ fontWeight: 700, fontSize: 15, color: "var(--color-txt)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {t.memberNama}
          </div>
          <div style={{ fontSize: 13, color: "var(--color-txt3)", marginTop: 1 }}>
            No. {t.memberNomorSambungan} · {t.memberDusun ? `${t.memberDusun} / ` : ""}RT {t.memberRT}
          </div>
        </div>
        <span style={{
          flexShrink: 0, display: "flex", alignItems: "center", gap: 4,
          fontSize: 13, padding: "3px 8px", borderRadius: 20, fontWeight: 700,
          background: statusBg, color: statusColor,
        }}>
          {lunas ? <CheckCircle2 size={11} /> : menunggak ? <AlertTriangle size={11} /> : <Clock size={11} />}
          {lunas ? "Lunas" : menunggak ? "Menunggak" : "Belum"}
        </span>
      </div>

      {/* Detail meter / iuran rata */}
      <div style={{ display: "flex", gap: 12, fontSize: 13, color: "var(--color-txt2)", marginBottom: 8, flexWrap: "wrap" }}>
        {isIuranRata ? (
          <span style={{ fontStyle: "italic", color: "var(--color-txt3)" }}>iuran rata</span>
        ) : (
          <>
            <span>Meter: <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{t.meterAwal} → {t.meterAkhir}</span></span>
            <span>Pakai: <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{formatM3(t.pemakaian)}</span></span>
          </>
        )}
      </div>

      {/* Nominal + tanggal */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 18, fontWeight: 900, color: "var(--color-primary)", fontFamily: "JetBrains Mono, monospace" }}>
          {formatRp(t.total)}
        </span>
        <div style={{ fontSize: 13, color: "var(--color-txt3)", textAlign: "right" }}>
          <div>Entry: {formatTanggal(t.tanggalEntry)}</div>
          {lunas && Boolean(t.tanggalBayar) && <div>Bayar: {formatTanggal(t.tanggalBayar)}</div>}
        </div>
      </div>

      {/* Aksi — hanya tampil untuk tagihan nyata (bukan virtual) */}
      {(onShare || onDownload) && (
        <div className="row-8">
          {onShare && (
            <button
              onClick={() => onShare(t)}
              style={{
                flex: 1, height: 48, borderRadius: 8, border: "1px solid var(--color-border)",
                background: "var(--color-bg)", color: "var(--color-primary)", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                fontSize: 13, fontWeight: 600,
              }}
            >
              <Share2 size={14} /> Bagikan WA
            </button>
          )}
          {onDownload && (
            <button
              onClick={() => onDownload(t)}
              style={{
                width: 48, height: 48, borderRadius: 8, border: "1px solid var(--color-border)",
                background: "var(--color-bg)", color: "var(--color-txt3)", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <Download size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
