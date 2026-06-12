"use client";

import { useEffect, useState, useCallback } from "react";
import { AlertTriangle, CheckCircle2, Share2 } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import {
  getAllTagihanEntrySet,
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
  const { settings, activeBulan, activeTahun, firebaseUser, userRole, showConfirm, members } =
    useAppStore();

  const isLocked = settings.globalLock;
  const isViewer = userRole?.role === "viewer";

  const [tunggakan, setTunggakan] = useState<Tagihan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTunggakan = useCallback(
    async (signal?: AbortSignal) => {
      if (!firebaseUser) return;
      setLoading(true);
      try {
        // 1. Ambil semua tagihan yang sudah pernah di-entry (semua status, semua bulan)
        const entrySet = await getAllTagihanEntrySet();

        // 2. Ambil tagihan belum bayar dari Firestore (bulan-bulan sebelum aktif)
        const tagihanBelum = await getTagihanBelumBayarSebelumBulanIni(
          activeBulan, activeTahun, members
        );
        if (signal?.aborted) return;

        // 3. Buat virtual entries untuk member yang belum di-entry sama sekali
        const membersAktif = members.filter((m) => m.status === "aktif");
        const virtual: Tagihan[] = [];
        const menunggakBulanAktif = isMenunggak(activeBulan, activeTahun, activeBulan, activeTahun);

        // Tentukan range bulan yang perlu dicek: dari bulan terdaftar s/d bulan aktif
        membersAktif.forEach((m) => {
          if (!m.id) return;

          // Bulan mulai dari createdAt member
          let startBulan = activeBulan;
          let startTahun = activeTahun;
          if (m.createdAt) {
            let createdDate: Date | null = null;
            if (m.createdAt instanceof Date) {
              createdDate = m.createdAt;
            } else if (typeof m.createdAt === "object" && "seconds" in (m.createdAt as object)) {
              createdDate = new Date((m.createdAt as { seconds: number }).seconds * 1000);
            }
            if (createdDate) {
              startBulan = createdDate.getMonth() + 1;
              startTahun = createdDate.getFullYear();
            }
          }

          // Iterasi semua bulan dari terdaftar s/d bulan aktif (tanpa batas)
          let y = startTahun;
          let b = startBulan;

          while (y < activeTahun || (y === activeTahun && b <= activeBulan)) {
            // Bulan aktif: hanya masuk tunggakan jika sudah lewat tgl 25
            if (y === activeTahun && b === activeBulan && !menunggakBulanAktif) break;

            const key = `${m.id}-${y}-${b}`;
            if (!entrySet.has(key)) {
              virtual.push({
                id: `virtual-${m.id}-${b}-${y}`,
                memberId: m.id,
                memberNama: m.nama,
                memberNomorSambungan: m.nomorSambungan,
                memberDusun: m.dusun ?? "",
                memberRT: m.rt ?? "",
                bulan: b, tahun: y,
                meterAwal: 0, meterAkhir: 0,
                pemakaian: 0,
                subtotalBlok1: 0,
                subtotalBlok2: 0,
                subtotalPemakaian: 0,
                total: 0,
                hargaHistoryId: "",
                abonemenSnapshot: settings.abonemen,
                hargaBlok1Snapshot: settings.hargaBlok1,
                batasBlokSnapshot: settings.batasBlok,
                hargaBlok2Snapshot: settings.hargaBlok2,
                blokSnapshotList: [],
                status: "belum" as const,
                nomorTagihan: "",
                tanggalBayar: null, tanggalEntry: null,
                entryOleh: "", catatan: "belum-dientry",
              });
            }

            // Maju ke bulan berikutnya
            b++;
            if (b > 12) { b = 1; y++; }
          }
        });

        // 4. Gabung: tagihan belum (Firestore) + virtual
        setTunggakan([...tagihanBelum, ...virtual]);
      } catch {
        if (signal?.aborted) return;
        toast.error("Gagal memuat data tunggakan.");
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [activeBulan, activeTahun, firebaseUser, members, settings]
  );

  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTunggakan(controller.signal);
    return () => controller.abort();
  }, [fetchTunggakan]);

  const memberMap = new Map(members.map((m) => [m.id!, m.nama]));
  const groups: TunggakanGroup[] = groupTunggakan(tunggakan, memberMap);
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
        toast.error("Tagihan belum tercatat, tidak bisa dibagikan.");
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
              : "Tagihan bulan sebelumnya yang belum dilunasi"}
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
            Semua pelanggan sudah lunas.
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
