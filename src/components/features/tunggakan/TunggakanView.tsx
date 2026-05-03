"use client";

import { useEffect, useState, useCallback } from "react";
import { AlertTriangle, CheckCircle2, Share2 } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import {
  getTagihanBelumBayarSebelumBulanIni,
  updateTagihanStatus,
  saveActivityLog,
} from "@/lib/db";
import { formatRp } from "@/lib/helpers";
import { shareTagihan } from "@/lib/export";
import { MONTHS } from "@/lib/constants";
import { Tagihan } from "@/types";
import { toast } from "@/lib/toast";
import TunggakanGroupCard, { TunggakanGroup, groupTunggakan } from "./TunggakanGroupCard";
import TunggakanSummary from "./TunggakanSummary";

export default function TunggakanView() {
  const { settings, activeBulan, activeTahun, firebaseUser, userRole, showConfirm } =
    useAppStore();

  const isLocked = settings.globalLock;

  const [tunggakan, setTunggakan] = useState<Tagihan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTunggakan = useCallback(
    async (signal?: AbortSignal) => {
      if (!firebaseUser) return;
      setLoading(true);
      try {
        const data = await getTagihanBelumBayarSebelumBulanIni(activeBulan, activeTahun);
        // #20: Batalkan state update jika komponen sudah unmount
        if (signal?.aborted) return;
        setTunggakan(data);
      } catch {
        if (signal?.aborted) return;
        toast.error("Gagal memuat data tunggakan.");
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [activeBulan, activeTahun]
  );

  // #20 Fix: AbortController cleanup untuk mencegah state update setelah unmount
  useEffect(() => {
    const controller = new AbortController();
    fetchTunggakan(controller.signal);
    return () => controller.abort();
  }, [fetchTunggakan]);

  const groups: TunggakanGroup[] = groupTunggakan(tunggakan);
  const totalPelanggan = groups.length;
  const totalNominal = tunggakan.reduce((a, t) => a + t.total, 0);
  const totalBulan = tunggakan.length;

  const handleTandaiLunas = useCallback(
    (t: Tagihan) => {
      if (isLocked) {
        toast.error("Aplikasi terkunci. Hubungi admin.");
        return;
      }
      showConfirm(
        "Tandai Lunas Tunggakan",
        `Tandai tunggakan ${t.memberNama} — ${MONTHS[t.bulan - 1]} ${t.tahun} (${formatRp(t.total)}) sebagai lunas?`,
        async () => {
          try {
            await updateTagihanStatus(t.id!, "lunas");
            await saveActivityLog(
              "LUNAS_TUNGGAKAN",
              `${t.memberNama} — ${MONTHS[t.bulan - 1]} ${t.tahun} (${t.nomorTagihan})`,
              userRole?.email ?? "",
              userRole?.role ?? ""
            );
            toast.success("Tunggakan ditandai lunas.");
            fetchTunggakan();
          } catch {
            toast.error("Gagal memperbarui status.");
          }
        }
      );
    },
    [isLocked, userRole, showConfirm, fetchTunggakan]
  );

  const handleShare = useCallback(
    async (t: Tagihan) => {
      try {
        await shareTagihan(t, settings);
      } catch {
        toast.error("Gagal membuka share.");
      }
    },
    [settings]
  );

  const handleShareKolektif = useCallback(() => {
    const baris = [
      `*${settings.namaOrganisasi || "PAM Desa"}*`,
      `*Daftar Tunggakan Air*`,
      `Per ${MONTHS[activeBulan - 1]} ${activeTahun}`,
      ``,
      ...groups.map(
        (g, i) =>
          `${i + 1}. ${g.memberNama} — ${g.jumlahBulan} bln — *${formatRp(g.totalTunggakan)}*`
      ),
      ``,
      `Total: ${totalPelanggan} pelanggan, *${formatRp(totalNominal)}*`,
    ];
    window.open(`https://wa.me/?text=${encodeURIComponent(baris.join("\n"))}`, "_blank");
  }, [settings, activeBulan, activeTahun, groups, totalPelanggan, totalNominal]);

  return (
    <div className="col-12 animate-fade-in-up">
      {/* Info periode */}
      <div
        className="card p-3 mb-4 flex items-center gap-3"
        style={{ borderLeft: "4px solid var(--color-tunggakan)" }}
      >
        <AlertTriangle size={20} style={{ color: "var(--color-tunggakan)", flexShrink: 0 }} />
        <div>
          <div className="font-semibold text-sm" style={{ color: "var(--color-tunggakan)" }}>
            Tunggakan s/d {MONTHS[activeBulan - 1]} {activeTahun}
          </div>
          <div className="text-xs mt-0.5" style={{ color: "var(--color-txt3)" }}>
            Tagihan belum lunas dari bulan-bulan sebelumnya
          </div>
        </div>
      </div>

      {/* Stat summary */}
      {!loading && tunggakan.length > 0 && (
        <TunggakanSummary
          totalNominal={totalNominal}
          totalPelanggan={totalPelanggan}
          totalBulan={totalBulan}
        />
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center gap-3 py-12">
          <div
            className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "var(--color-tunggakan)" }}
          />
          <p style={{ color: "var(--color-txt3)", fontSize: 14 }}>Memuat data tunggakan…</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && tunggakan.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-12">
          <CheckCircle2 size={44} style={{ color: "var(--color-lunas)", opacity: 0.7 }} />
          <p className="text-center font-semibold" style={{ color: "var(--color-lunas)", fontSize: 15 }}>
            Tidak ada tunggakan!
          </p>
          <p className="text-center text-sm" style={{ color: "var(--color-txt3)" }}>
            Semua pelanggan sudah lunas hingga bulan lalu.
          </p>
        </div>
      )}

      {/* List grup */}
      {!loading && groups.length > 0 && (
        <>
          <button
            onClick={handleShareKolektif}
            className="btn-secondary w-full mb-4"
            style={{ height: 48, fontSize: 13 }}
          >
            <Share2 size={14} /> Kirim Daftar Tunggakan ke WA
          </button>

          <div className="flex flex-col gap-4">
            {groups.map((g) => (
              <TunggakanGroupCard
                key={g.memberId}
                group={g}
                isLocked={isLocked}
                onTandaiLunas={handleTandaiLunas}
                onShare={handleShare}
              />
            ))}
          </div>

          <button
            onClick={() => fetchTunggakan()}
            className="btn-ghost w-full mt-4"
            style={{ height: 48, fontSize: 13 }}
          >
            Perbarui Data
          </button>
        </>
      )}
    </div>
  );
}
