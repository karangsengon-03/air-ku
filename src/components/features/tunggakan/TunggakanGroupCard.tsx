"use client";
// #16a — Sub-komponen kartu grup tunggakan per pelanggan
import { useState } from "react";
import { ChevronDown, ChevronUp, CheckCircle2, Share2 } from "lucide-react";
import { formatRp, formatM3, formatTanggal } from "@/lib/helpers";
import { MONTHS } from "@/lib/constants";
import { Tagihan } from "@/types";

// ─── Shared Types (di-export agar bisa dipakai TunggakanView) ────────────────
export interface TunggakanGroup {
  memberId: string;
  memberNama: string;
  memberNomorSambungan: string;
  memberDusun: string;
  memberRT: string;
  tagihan: Tagihan[];
  totalTunggakan: number;
  jumlahBulan: number;
}

export function groupTunggakan(list: Tagihan[]): TunggakanGroup[] {
  const map = new Map<string, TunggakanGroup>();

  for (const t of list) {
    if (!map.has(t.memberId)) {
      map.set(t.memberId, {
        memberId: t.memberId,
        memberNama: t.memberNama,
        memberNomorSambungan: t.memberNomorSambungan,
        memberDusun: t.memberDusun,
        memberRT: t.memberRT,
        tagihan: [],
        totalTunggakan: 0,
        jumlahBulan: 0,
      });
    }
    const g = map.get(t.memberId)!;
    g.tagihan.push(t);
    g.totalTunggakan += t.total;
    g.jumlahBulan += 1;
  }

  for (const g of map.values()) {
    g.tagihan.sort((a, b) => {
      if (a.tahun !== b.tahun) return a.tahun - b.tahun;
      return a.bulan - b.bulan;
    });
  }

  return Array.from(map.values()).sort((a, b) => b.totalTunggakan - a.totalTunggakan);
}

// ─── Component ────────────────────────────────────────────────────────────────
interface TunggakanGroupCardProps {
  group: TunggakanGroup;
  isLocked: boolean;
  onTandaiLunas: (t: Tagihan) => void;
  onShare: (t: Tagihan) => void;
}

export default function TunggakanGroupCard({
  group,
  isLocked,
  onTandaiLunas,
  onShare,
}: TunggakanGroupCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="card overflow-hidden" style={{ borderLeft: "4px solid var(--color-tunggakan)" }}>
      {/* Header grup */}
      <button className="w-full p-4 text-left" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="font-bold text-base leading-tight" style={{ color: "var(--color-txt)" }}>
              {group.memberNama}
            </div>
            <div className="text-xs mt-0.5" style={{ color: "var(--color-txt3)" }}>
              No. {group.memberNomorSambungan} ·{" "}
              {group.memberDusun ? `${group.memberDusun} / ` : ""}RT {group.memberRT}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="mono font-bold text-base" style={{ color: "var(--color-tunggakan)" }}>
                {formatRp(group.totalTunggakan)}
              </div>
              <div className="text-xs" style={{ color: "var(--color-txt3)" }}>
                {group.jumlahBulan} bln tunggak
              </div>
            </div>
            {expanded
              ? <ChevronUp size={18} style={{ color: "var(--color-txt3)" }} />
              : <ChevronDown size={18} style={{ color: "var(--color-txt3)" }} />
            }
          </div>
        </div>
      </button>

      {/* Detail per tagihan */}
      {expanded && (
        <div style={{ borderTop: "1px solid var(--color-border)" }}>
          {group.tagihan.map((t, idx) => (
            <div
              key={t.id}
              className="px-4 py-4"
              style={{
                borderBottom: idx < group.tagihan.length - 1 ? "1px solid var(--color-border)" : "none",
                background: idx % 2 === 0 ? "transparent" : "rgba(146,64,14,0.04)",
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-semibold text-sm" style={{ color: "var(--color-txt)" }}>
                    {MONTHS[t.bulan - 1]} {t.tahun}
                  </div>
                  <div className="text-xs" style={{ color: "var(--color-txt3)" }}>
                    Entry: {formatTanggal(t.tanggalEntry)}
                  </div>
                </div>
                <div className="mono font-bold text-base" style={{ color: "var(--color-txt)" }}>
                  {formatRp(t.total)}
                </div>
              </div>

              <div className="flex gap-3 text-xs mb-3" style={{ color: "var(--color-txt3)" }}>
                <span>Meter: <span className="mono">{t.meterAwal} → {t.meterAkhir}</span></span>
                <span>Pakai: <span className="mono font-semibold">{formatM3(t.pemakaian)}</span></span>
              </div>

              <div className="flex gap-2">
                {!isLocked && (
                  <button
                    onClick={() => onTandaiLunas(t)}
                    className="btn-primary flex-1"
                    style={{ height: 48, fontSize: 13 }}
                  >
                    <CheckCircle2 size={13} /> Tandai Lunas
                  </button>
                )}
                <button
                  onClick={() => onShare(t)}
                  className="btn-secondary"
                  style={{ height: 48, width: 48, padding: 0 }}
                  title="Kirim ke WA"
                >
                  <Share2 size={15} />
                </button>
              </div>
            </div>
          ))}

          {/* Tandai SEMUA lunas */}
          {!isLocked && group.tagihan.length > 1 && (
            <div className="p-3" style={{ borderTop: "1px solid var(--color-border)" }}>
              <button
                onClick={() => group.tagihan.forEach((t) => onTandaiLunas(t))}
                className="btn-primary w-full"
                style={{ height: 48, fontSize: 13, background: "var(--color-tunggakan)" }}
              >
                <CheckCircle2 size={14} /> Tandai Semua Lunas ({formatRp(group.totalTunggakan)})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
