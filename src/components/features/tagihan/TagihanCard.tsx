"use client";
import { CheckCircle2, Clock, AlertTriangle, Share2, Download } from "lucide-react";
import { formatRp, formatM3, formatTanggal, getStatusTagihan, STATUS_TIER_LABEL, STATUS_TIER_COLOR, STATUS_TIER_BG } from "@/lib/helpers";
import { Tagihan } from "@/types";

interface TagihanCardProps {
  tagihan: Tagihan;
  onShare?: (t: Tagihan) => void;
  onDownload?: (t: Tagihan) => void;
  onTandaiLunas?: (t: Tagihan) => void; // hanya untuk status Ditagih
}

export default function TagihanCard({ tagihan: t, onShare, onDownload, onTandaiLunas }: TagihanCardProps) {
  const isVirtual = !!(t as Tagihan & { _virtual?: boolean })._virtual || t.catatan === "belum-dientry";
  const tier = getStatusTagihan(t.status, isVirtual);
  const isIuranRata = t.meterAwal === 0 && t.meterAkhir === 0;

  const tierColor = STATUS_TIER_COLOR[tier];
  const tierBg = STATUS_TIER_BG[tier];
  const tierLabel = STATUS_TIER_LABEL[tier];
  const TierIcon = tier === "lunas" ? CheckCircle2 : tier === "ditagih" ? Clock : AlertTriangle;

  return (
    <div
      className="card"
      style={{
        padding: "14px 16px",
        borderLeft: `4px solid ${tierColor}`,
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
          background: tierBg, color: tierColor,
        }}>
          <TierIcon size={11} />
          {tierLabel}
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
          {tier === "lunas" && Boolean(t.tanggalBayar) && <div>Bayar: {formatTanggal(t.tanggalBayar)}</div>}
        </div>
      </div>

      {/* Tandai Lunas — hanya untuk status Ditagih (belum bayar tapi sudah dientry) */}
      {tier === "ditagih" && onTandaiLunas && (
        <button
          onClick={() => onTandaiLunas(t)}
          style={{
            width: "100%", height: 48, borderRadius: 8,
            border: "none", background: "var(--color-lunas)",
            color: "white", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            fontSize: 13, fontWeight: 700,
          }}
        >
          <CheckCircle2 size={16} /> Tandai Lunas — Warga Sudah Bayar
        </button>
      )}

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
