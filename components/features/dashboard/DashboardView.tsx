"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Droplets, CheckCircle2, Clock, TrendingUp, ArrowRight, WifiOff } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { getTotalOperasional } from "@/lib/db";
import { formatRp, formatM3 } from "@/lib/helpers";
import { MONTHS } from "@/lib/constants";

function DonutChart({ lunas, belum }: { lunas: number; belum: number }) {
  const total = lunas + belum;
  if (total === 0) return (
    <div style={{ width: 72, height: 72, borderRadius: "50%", border: "5px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <span style={{ fontSize: 11, color: "var(--color-txt3)" }}>-</span>
    </div>
  );
  const pct = lunas / total;
  const c = 2 * Math.PI * 15;
  return (
    <div style={{ position: "relative", width: 72, height: 72, flexShrink: 0 }}>
      <svg viewBox="0 0 40 40" style={{ width: 72, height: 72, transform: "rotate(-90deg)" }}>
        <circle cx="20" cy="20" r="15" fill="none" stroke="var(--color-belum)" strokeWidth="5" opacity="0.2" />
        <circle cx="20" cy="20" r="15" fill="none" stroke="var(--color-lunas)" strokeWidth="5"
          strokeDasharray={`${pct * c} ${c}`} strokeLinecap="round" style={{ transition: "stroke-dasharray 0.5s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: "var(--color-lunas)", fontFamily: "JetBrains Mono, monospace" }}>{Math.round(pct * 100)}%</span>
        <span style={{ fontSize: 9, color: "var(--color-txt3)" }}>lunas</span>
      </div>
    </div>
  );
}

export default function DashboardView() {
  const router = useRouter();
  const { activeBulan, activeTahun, userRole, isOnline, members, tagihan } = useAppStore();
  const [totalOps, setTotalOps] = useState(0);

  useEffect(() => {
    getTotalOperasional(activeBulan, activeTahun).then(setTotalOps).catch(() => {});
  }, [activeBulan, activeTahun]);

  const lunas = tagihan.filter((t) => t.status === "lunas");
  const belumTagihan = tagihan.filter((t) => t.status === "belum");
  const membersAktif = members.filter((m) => m.status === "aktif");
  // Member aktif yang belum ada tagihan sama sekali bulan ini
  const memberIdsDiinput = new Set(tagihan.map((t) => t.memberId));
  const membersBelumInput = membersAktif.filter((m) => m.id && !memberIdsDiinput.has(m.id));
  // Total belum bayar = tagihan berstatus belum + yang belum diinput
  const totalBelumCount = belumTagihan.length + membersBelumInput.length;
  const totalBelumNominal = belumTagihan.reduce((s, t) => s + t.total, 0);
  const totalTerkumpul = lunas.reduce((s, t) => s + t.total, 0);
  const totalM3 = tagihan.reduce((s, t) => s + t.pemakaian, 0);
  const pendapatanBersih = totalTerkumpul - totalOps;
  const bulanLabel = `${MONTHS[activeBulan - 1]} ${activeTahun}`;
  const now = new Date();
  const isCurrentMonth = activeBulan === now.getMonth() + 1 && activeTahun === now.getFullYear();

  return (
    <div className="col-12 animate-fade-in-up">
      {/* Offline banner */}
      {!isOnline && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10, background: "rgba(146,64,14,0.1)", color: "var(--color-tunggakan)", fontSize: 13, fontWeight: 600 }}>
          <WifiOff size={16} /> Mode offline — data mungkin tidak terkini
        </div>
      )}

      {/* Ringkasan utama */}
      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="flex-min">
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-txt3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
              Total Terkumpul — {bulanLabel}
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: "var(--color-lunas)", fontFamily: "JetBrains Mono, monospace", lineHeight: 1.1 }}>
              {formatRp(totalTerkumpul)}
            </div>
            <div style={{ fontSize: 13, color: "var(--color-txt3)", marginTop: 4 }}>
              {lunas.length} lunas · {totalBelumCount} belum bayar
            </div>
            {totalOps > 0 && (
              <div style={{ fontSize: 12, color: "var(--color-txt3)", marginTop: 2 }}>
                Bersih: <span style={{ fontFamily: "JetBrains Mono, monospace", fontWeight: 700, color: pendapatanBersih >= 0 ? "var(--color-lunas)" : "var(--color-belum)" }}>{formatRp(pendapatanBersih)}</span>
              </div>
            )}
          </div>
          <DonutChart lunas={lunas.length} belum={totalBelumCount} />
        </div>
      </div>

      {/* 3 stat cards — 1 kolom */}
      {[
        {
          icon: <CheckCircle2 size={18} />, color: "var(--color-lunas)",
          label: "Sudah Lunas", value: `${lunas.length} pelanggan`,
          sub: lunas.length > 0 ? formatRp(totalTerkumpul) : "Belum ada yang lunas",
        },
        {
          icon: <Clock size={18} />, color: "var(--color-belum)",
          label: "Belum Bayar", value: `${totalBelumCount} pelanggan`,
          sub: totalBelumCount > 0 ? `Rp ${totalBelumNominal.toLocaleString("id-ID")} belum terkumpul` : "Semua sudah lunas",
        },
        {
          icon: <Droplets size={18} />, color: "var(--color-accent)",
          label: "Total Pemakaian", value: formatM3(totalM3),
          sub: tagihan.length > 0 ? `Rata-rata ${formatM3(Math.round(totalM3 / tagihan.length))}/pelanggan` : "Belum ada data",
        },
      ].map((item) => (
        <div key={item.label} className="card" style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 38, height: 40, borderRadius: 10, background: item.color + "20", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: item.color }}>
            {item.icon}
          </div>
          <div className="flex-min">
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-txt3)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{item.label}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: item.color, fontFamily: "JetBrains Mono, monospace" }}>{item.value}</div>
            <div style={{ fontSize: 12, color: "var(--color-txt3)", marginTop: 1 }}>{item.sub}</div>
          </div>
        </div>
      ))}

      {/* Pelanggan aktif (admin) */}
      {userRole?.role === "admin" && (
        <div className="card" style={{ padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-txt3)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Pelanggan Aktif</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--color-txt)", fontFamily: "JetBrains Mono, monospace" }}>{membersAktif.length} orang</div>
            <div style={{ fontSize: 12, color: "var(--color-txt3)", marginTop: 1 }}>
              {tagihan.length > 0 ? `${tagihan.length} sudah diinput bulan ini` : "Belum ada entry bulan ini"}
            </div>
          </div>
          <TrendingUp size={28} style={{ color: "var(--color-txt3)", opacity: 0.5 }} />
        </div>
      )}

      {/* Shortcut entry */}
      {isCurrentMonth && (
        <button className="btn-primary" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          onClick={() => router.push("/entry")}>
          Entry / Catat Iuran Bulan Ini <ArrowRight size={17} />
        </button>
      )}

      {/* Hint entry jika ada member tapi belum ada tagihan bulan ini */}
      {tagihan.length === 0 && membersAktif.length > 0 && isCurrentMonth && (
        <div style={{ textAlign: "center", padding: "16px 0", color: "var(--color-txt3)" }}>
          <p style={{ fontSize: 13 }}>Belum ada iuran tercatat untuk {bulanLabel}</p>
        </div>
      )}
    </div>
  );
}
