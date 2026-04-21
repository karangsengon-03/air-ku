"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Share2,
  ChevronDown,
  ChevronUp,
  User,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import {
  getTagihanBelumBayarSebelumBulanIni,
  updateTagihanStatus,
  saveActivityLog,
} from "@/lib/db";
import { formatRp, formatM3, formatTanggal } from "@/lib/helpers";
import { shareTagihan } from "@/lib/export";
import { MONTHS } from "@/lib/constants";
import { Tagihan } from "@/types";

// ─── Grup tunggakan per pelanggan ─────────────────────────────────────────────
interface TunggakanGroup {
  memberId: string;
  memberNama: string;
  memberNomorSambungan: string;
  memberDusun: string;
  memberRT: string;
  tagihan: Tagihan[];
  totalTunggakan: number;
  jumlahBulan: number;
}

function groupTunggakan(list: Tagihan[]): TunggakanGroup[] {
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

  // Sort tiap grup: bulan terlama dulu
  for (const g of map.values()) {
    g.tagihan.sort((a, b) => {
      if (a.tahun !== b.tahun) return a.tahun - b.tahun;
      return a.bulan - b.bulan;
    });
  }

  // Sort grup: total tunggakan terbesar dulu
  return Array.from(map.values()).sort(
    (a, b) => b.totalTunggakan - a.totalTunggakan
  );
}

// ─── Kartu grup tunggakan ─────────────────────────────────────────────────────
function TunggakanGroupCard({
  group,
  isLocked,
  onTandaiLunas,
  onShare,
  settings,
}: {
  group: TunggakanGroup;
  isLocked: boolean;
  onTandaiLunas: (t: Tagihan) => void;
  onShare: (t: Tagihan) => void;
  settings: { namaOrganisasi: string; desa: string; kecamatan: string };
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="card overflow-hidden"
      style={{ borderLeft: "4px solid var(--color-tunggakan)" }}
    >
      {/* Header grup */}
      <button
        className="w-full p-4 text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div
              className="font-bold text-base leading-tight"
              style={{ color: "var(--color-txt)" }}
            >
              {group.memberNama}
            </div>
            <div
              className="text-xs mt-0.5"
              style={{ color: "var(--color-txt3)" }}
            >
              No. {group.memberNomorSambungan} ·{" "}
              {group.memberDusun ? `${group.memberDusun} / ` : ""}RT{" "}
              {group.memberRT}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div
                className="mono font-bold text-base"
                style={{ color: "var(--color-tunggakan)" }}
              >
                {formatRp(group.totalTunggakan)}
              </div>
              <div
                className="text-xs"
                style={{ color: "var(--color-txt3)" }}
              >
                {group.jumlahBulan} bln tunggak
              </div>
            </div>
            {expanded ? (
              <ChevronUp size={18} style={{ color: "var(--color-txt3)" }} />
            ) : (
              <ChevronDown size={18} style={{ color: "var(--color-txt3)" }} />
            )}
          </div>
        </div>
      </button>

      {/* Detail per tagihan */}
      {expanded && (
        <div
          style={{
            borderTop: "1px solid var(--color-border)",
          }}
        >
          {group.tagihan.map((t, idx) => (
            <div
              key={t.id}
              className="px-4 py-3"
              style={{
                borderBottom:
                  idx < group.tagihan.length - 1
                    ? "1px solid var(--color-border)"
                    : "none",
                background:
                  idx % 2 === 0
                    ? "transparent"
                    : "rgba(146,64,14,0.04)",
              }}
            >
              {/* Periode + total */}
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div
                    className="font-semibold text-sm"
                    style={{ color: "var(--color-txt)" }}
                  >
                    {MONTHS[t.bulan - 1]} {t.tahun}
                  </div>
                  <div
                    className="text-xs"
                    style={{ color: "var(--color-txt3)" }}
                  >
                    Entry: {formatTanggal(t.tanggalEntry)}
                  </div>
                </div>
                <div
                  className="mono font-bold text-base"
                  style={{ color: "var(--color-txt)" }}
                >
                  {formatRp(t.total)}
                </div>
              </div>

              {/* Meter */}
              <div
                className="flex gap-3 text-xs mb-3"
                style={{ color: "var(--color-txt3)" }}
              >
                <span>
                  Meter:{" "}
                  <span className="mono">
                    {t.meterAwal} → {t.meterAkhir}
                  </span>
                </span>
                <span>
                  Pakai:{" "}
                  <span className="mono font-semibold">
                    {formatM3(t.pemakaian)}
                  </span>
                </span>
              </div>

              {/* Tombol aksi per tagihan */}
              <div className="flex gap-2">
                {!isLocked && (
                  <button
                    onClick={() => onTandaiLunas(t)}
                    className="btn-primary flex-1"
                    style={{ height: 40, fontSize: 12 }}
                  >
                    <CheckCircle2 size={13} /> Tandai Lunas
                  </button>
                )}
                <button
                  onClick={() => onShare(t)}
                  className="btn-secondary"
                  style={{ height: 40, width: 40, padding: 0 }}
                  title="Kirim ke WA"
                >
                  <Share2 size={15} />
                </button>
              </div>
            </div>
          ))}

          {/* Tandai SEMUA lunas (jika > 1 bulan) */}
          {!isLocked && group.tagihan.length > 1 && (
            <div
              className="p-3"
              style={{ borderTop: "1px solid var(--color-border)" }}
            >
              <button
                onClick={() => group.tagihan.forEach((t) => onTandaiLunas(t))}
                className="btn-primary w-full"
                style={{
                  height: 44,
                  fontSize: 13,
                  background: "var(--color-tunggakan)",
                }}
              >
                <CheckCircle2 size={14} /> Tandai Semua Lunas (
                {formatRp(group.totalTunggakan)})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TunggakanView() {
  const { settings, activeBulan, activeTahun, userRole, showConfirm, addToast } =
    useAppStore();

  const isLocked = settings.globalLock;

  const [tunggakan, setTunggakan] = useState<Tagihan[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Fetch (bukan realtime — query tunggakan agak complex) ───────────────────
  const fetchTunggakan = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTagihanBelumBayarSebelumBulanIni(
        activeBulan,
        activeTahun
      );
      setTunggakan(data);
    } catch {
      addToast("error", "Gagal memuat data tunggakan.");
    } finally {
      setLoading(false);
    }
  }, [activeBulan, activeTahun, addToast]);

  useEffect(() => {
    fetchTunggakan();
  }, [fetchTunggakan]);

  // ── Grup data ───────────────────────────────────────────────────────────────
  const groups = groupTunggakan(tunggakan);
  const totalPelanggan = groups.length;
  const totalNominal = tunggakan.reduce((a, t) => a + t.total, 0);
  const totalBulan = tunggakan.length;

  // ── Tandai lunas ────────────────────────────────────────────────────────────
  const handleTandaiLunas = useCallback(
    (t: Tagihan) => {
      if (isLocked) {
        addToast("error", "Aplikasi terkunci. Hubungi admin.");
        return;
      }
      showConfirm(
        "Tandai lunas?",
        `Tunggakan ${t.memberNama} — ${MONTHS[t.bulan - 1]} ${t.tahun} (${formatRp(t.total)}) akan ditandai lunas.`,
        async () => {
          try {
            await updateTagihanStatus(t.id!, "lunas");
            await saveActivityLog(
              "LUNAS_TUNGGAKAN",
              `${t.memberNama} — ${MONTHS[t.bulan - 1]} ${t.tahun} (${t.nomorTagihan})`,
              userRole?.email ?? "",
              userRole?.role ?? ""
            );
            addToast("success", "Tunggakan ditandai lunas.");
            // Refresh setelah update
            fetchTunggakan();
          } catch {
            addToast("error", "Gagal memperbarui status.");
          }
        }
      );
    },
    [isLocked, userRole, showConfirm, addToast, fetchTunggakan]
  );

  // ── Share WA ────────────────────────────────────────────────────────────────
  const handleShare = useCallback(
    async (t: Tagihan) => {
      try {
        await shareTagihan(t, settings);
      } catch {
        addToast("error", "Gagal membuka share.");
      }
    },
    [settings, addToast]
  );

  // ── Share kolektif WA (semua belum bayar) ───────────────────────────────────
  const handleShareKolektif = useCallback(() => {
    const baris = [
      `*${settings.namaOrganisasi || "PAM Desa"}*`,
      `⚠️ *Daftar Tunggakan Air*`,
      `Per ${MONTHS[activeBulan - 1]} ${activeTahun}`,
      ``,
      ...groups.map(
        (g, i) =>
          `${i + 1}. ${g.memberNama} — ${g.jumlahBulan} bln — *${formatRp(g.totalTunggakan)}*`
      ),
      ``,
      `Total: ${totalPelanggan} pelanggan, *${formatRp(totalNominal)}*`,
    ];
    const text = baris.join("\n");
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }, [settings, activeBulan, activeTahun, groups, totalPelanggan, totalNominal]);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="pb-safe">
      {/* ── Info periode ── */}
      <div
        className="card p-3 mb-4 flex items-center gap-3"
        style={{ borderLeft: "4px solid var(--color-tunggakan)" }}
      >
        <AlertTriangle
          size={20}
          style={{ color: "var(--color-tunggakan)", flexShrink: 0 }}
        />
        <div>
          <div
            className="font-semibold text-sm"
            style={{ color: "var(--color-tunggakan)" }}
          >
            Tunggakan s/d {MONTHS[activeBulan - 1]} {activeTahun}
          </div>
          <div className="text-xs mt-0.5" style={{ color: "var(--color-txt3)" }}>
            Tagihan belum lunas dari bulan-bulan sebelumnya
          </div>
        </div>
      </div>

      {/* ── Stat summary ── */}
      {!loading && tunggakan.length > 0 && (
        <div className="flex gap-2 mb-4">
          <div
            className="card p-3 flex-1"
            style={{ borderLeft: "3px solid var(--color-tunggakan)" }}
          >
            <div className="section-label mb-1">Total Nominal</div>
            <div
              className="mono font-bold text-base"
              style={{ color: "var(--color-tunggakan)" }}
            >
              {formatRp(totalNominal)}
            </div>
          </div>
          <div
            className="card p-3 flex-1"
            style={{ borderLeft: "3px solid var(--color-belum)" }}
          >
            <div className="section-label mb-1">Pelanggan</div>
            <div
              className="mono font-bold text-base"
              style={{ color: "var(--color-belum)" }}
            >
              {totalPelanggan} orang
            </div>
          </div>
          <div
            className="card p-3 flex-1"
            style={{ borderLeft: "3px solid var(--color-txt3)" }}
          >
            <div className="section-label mb-1">Tagihan</div>
            <div
              className="mono font-bold text-base"
              style={{ color: "var(--color-txt2)" }}
            >
              {totalBulan} bulan
            </div>
          </div>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="flex flex-col items-center gap-3 py-12">
          <div
            className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "var(--color-tunggakan)" }}
          />
          <p style={{ color: "var(--color-txt3)", fontSize: 14 }}>
            Memuat data tunggakan…
          </p>
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && tunggakan.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-12">
          <CheckCircle2
            size={44}
            style={{ color: "var(--color-lunas)", opacity: 0.7 }}
          />
          <p
            className="text-center font-semibold"
            style={{ color: "var(--color-lunas)", fontSize: 15 }}
          >
            Tidak ada tunggakan! 🎉
          </p>
          <p
            className="text-center text-sm"
            style={{ color: "var(--color-txt3)" }}
          >
            Semua pelanggan sudah lunas hingga bulan lalu.
          </p>
        </div>
      )}

      {/* ── List grup ── */}
      {!loading && groups.length > 0 && (
        <>
          {/* Tombol share kolektif */}
          <button
            onClick={handleShareKolektif}
            className="btn-secondary w-full mb-4"
            style={{ height: 44, fontSize: 13 }}
          >
            <Share2 size={14} /> Kirim Daftar Tunggakan ke WA
          </button>

          <div className="flex flex-col gap-3">
            {groups.map((g) => (
              <TunggakanGroupCard
                key={g.memberId}
                group={g}
                isLocked={isLocked}
                onTandaiLunas={handleTandaiLunas}
                onShare={handleShare}
                settings={{
                  namaOrganisasi: settings.namaOrganisasi,
                  desa: settings.desa,
                  kecamatan: settings.kecamatan,
                }}
              />
            ))}
          </div>

          {/* Refresh button */}
          <button
            onClick={fetchTunggakan}
            className="btn-ghost w-full mt-4"
            style={{ height: 40, fontSize: 13 }}
          >
            Perbarui Data
          </button>
        </>
      )}
    </div>
  );
}
