"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { AlertTriangle, CheckCircle2, Share2 } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import {
  getTagihanBelumBayarSebelumBulanIni,
  updateTagihanStatus,
  saveActivityLog,
} from "@/lib/db";
import { formatRp, isMenunggak } from "@/lib/helpers";
import { shareTagihan } from "@/lib/export";
import { MONTHS } from "@/lib/constants";
import { Tagihan } from "@/types";
import { toast } from "@/lib/toast";
import TunggakanGroupCard, { TunggakanGroup, groupTunggakan } from "./TunggakanGroupCard";
import TunggakanSummary from "./TunggakanSummary";

export default function TunggakanView() {
  const { settings, activeBulan, activeTahun, firebaseUser, userRole, showConfirm, members, tagihan: allTagihan } =
    useAppStore();

  const isLocked = settings.globalLock;
  const isViewer = userRole?.role === "viewer";

  const [tagihanBelum, setTagihanBelum] = useState<Tagihan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTunggakan = useCallback(
    async (signal?: AbortSignal) => {
      if (!firebaseUser) return;
      setLoading(true);
      try {
        const data = await getTagihanBelumBayarSebelumBulanIni(activeBulan, activeTahun, members);
        if (signal?.aborted) return;
        setTagihanBelum(data);
      } catch {
        if (signal?.aborted) return;
        toast.error("Gagal memuat data tunggakan.");
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [activeBulan, activeTahun, firebaseUser, members]
  );

  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTunggakan(controller.signal);
    return () => controller.abort();
  }, [fetchTunggakan]);

  // Gabung tagihan belum bayar (Firestore) + virtual untuk member yang belum di-entry bulan ini
  const tunggakan = useMemo(() => {
    const membersAktif = members.filter((m) => m.status === "aktif");

    // Member yang sudah di-entry bulan ini (lunas atau belum) — tidak perlu virtual
    const memberSudahEntryBulanIni = new Set(
      allTagihan
        .filter((t) => t.bulan === activeBulan && t.tahun === activeTahun)
        .map((t) => t.memberId)
    );

    // Virtual hanya jika sudah lewat tanggal 25 bulan aktif
    const menunggakBulanIni = isMenunggak(activeBulan, activeTahun, activeBulan, activeTahun);
    const virtual: Tagihan[] = menunggakBulanIni
      ? membersAktif
          .filter((m) => m.id && !memberSudahEntryBulanIni.has(m.id))
          .map((m) => ({
            id: `virtual-${m.id}-${activeBulan}-${activeTahun}`,
            memberId: m.id!,
            memberNama: m.nama,
            memberNomorSambungan: m.nomorSambungan,
            memberDusun: m.dusun ?? "",
            memberRT: m.rt ?? "",
            bulan: activeBulan,
            tahun: activeTahun,
            meterAwal: 0,
            meterAkhir: 0,
            pemakaian: 0,
            subtotalBlok1: 0,
            subtotalBlok2: 0,
            subtotalPemakaian: 0,
            total: 0,
            abonemen: settings.abonemen,
            abonemenSnapshot: settings.abonemen,
            hargaBlok1Snapshot: settings.hargaBlok1,
            batasBlokSnapshot: settings.batasBlok,
            hargaBlok2Snapshot: settings.hargaBlok2,
            hargaHistoryId: "",
            blokSnapshot: [],
            status: "belum" as const,
            nomorTagihan: "",
            tanggal: null,
            tanggalBayar: null,
            tanggalEntry: null,
            dibayarOleh: "",
            entryOleh: "",
            diinputOleh: "",
            catatan: "",
          }))
      : [];

    return [...tagihanBelum, ...virtual];
  }, [tagihanBelum, members, allTagihan, activeBulan, activeTahun, settings]);

  const groups: TunggakanGroup[] = groupTunggakan(tunggakan);
  const totalPelanggan = groups.length;
  const totalNominal = tunggakan.reduce((a, t) => a + t.total, 0);
  const totalBulan = tunggakan.length;

  const handleTandaiLunas = useCallback(
    (t: Tagihan) => {
      if (isLocked) { toast.error("Aplikasi terkunci. Hubungi admin."); return; }
      if (t.id?.startsWith("virtual-")) {
        toast.error("Pelanggan ini belum di-entry. Gunakan menu Entry untuk mencatat pembayaran.");
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
      if (t.id?.startsWith("virtual-")) {
        toast.error("Tagihan ini belum tercatat, tidak bisa dibagikan.");
        return;
      }
      try { await shareTagihan(t, settings); }
      catch { toast.error("Gagal membuka share."); }
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
        (g, i) => `${i + 1}. ${g.memberNama} — ${g.jumlahBulan} bln — *${formatRp(g.totalTunggakan)}*`
      ),
      ``,
      `Total: ${totalPelanggan} pelanggan, *${formatRp(totalNominal)}*`,
    ];
    window.open(`https://wa.me/?text=${encodeURIComponent(baris.join("\n"))}`, "_blank");
  }, [settings, activeBulan, activeTahun, groups, totalPelanggan, totalNominal]);

  return (
    <div className="col-12 animate-fade-in-up">
      {/* Info periode */}
      <div className="card p-3 mb-4 flex items-center gap-3"
        style={{ borderLeft: "4px solid var(--color-tunggakan)" }}>
        <AlertTriangle size={20} style={{ color: "var(--color-tunggakan)", flexShrink: 0 }} />
        <div>
          <div className="font-semibold text-sm" style={{ color: "var(--color-tunggakan)" }}>
            Tunggakan s/d {MONTHS[activeBulan - 1]} {activeTahun}
          </div>
          <div className="text-xs mt-0.5" style={{ color: "var(--color-txt3)" }}>
            {isMenunggak(activeBulan, activeTahun, activeBulan, activeTahun)
              ? "Tagihan belum lunas melewati tanggal 25"
              : "Belum melewati tanggal 25 bulan ini"}
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
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "var(--color-tunggakan)" }} />
          <p style={{ color: "var(--color-txt3)", fontSize: 13 }}>Memuat data tunggakan…</p>
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
            {isMenunggak(activeBulan, activeTahun, activeBulan, activeTahun)
              ? "Semua pelanggan sudah lunas."
              : "Belum melewati tanggal 25 bulan ini."}
          </p>
        </div>
      )}

      {/* List grup */}
      {!loading && groups.length > 0 && (
        <>
          {!isViewer && (
            <button onClick={handleShareKolektif} className="btn-secondary w-full mb-4"
              style={{ height: 48, fontSize: 13 }}>
              <Share2 size={14} /> Kirim Daftar Tunggakan ke WA
            </button>
          )}

          <div className="flex flex-col gap-4">
            {groups.map((g) => (
              <TunggakanGroupCard
                key={g.memberId}
                group={g}
                isLocked={isLocked || isViewer}
                onTandaiLunas={handleTandaiLunas}
                onShare={isViewer ? undefined : handleShare}
              />
            ))}
          </div>

          <button onClick={() => fetchTunggakan()} className="btn-ghost w-full mt-4"
            style={{ height: 48, fontSize: 13 }}>
            Perbarui Data
          </button>
        </>
      )}
    </div>
  );
}
