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
import { formatRp, isMenunggak, getMemberStartPeriode, getBulanTahunAktif } from "@/lib/helpers";
import { shareTagihan } from "@/lib/export";
import { MONTHS } from "@/lib/constants";
import { Tagihan } from "@/types";
import { toast } from "@/lib/toast";
import TunggakanGroupCard, { TunggakanGroup, groupTunggakan } from "./TunggakanGroupCard";
import TunggakanSummary from "./TunggakanSummary";

export default function TunggakanView() {
  const { settings, activeBulan, activeTahun, firebaseUser, userRole, showConfirm, members, membersLoaded } =
    useAppStore();

  const isLocked = settings.globalLock;
  const isViewer = userRole?.role === "viewer";

  // Bulan/tahun SUNGGUHAN sekarang (dari jam sistem) — beda dari activeBulan/
  // activeTahun yang di menu ini berarti "batas atas periode yang dipilih
  // pengguna" (lihat label "Tunggakan s/d [Bulan] [Tahun]" di render di bawah).
  // Dipakai sebagai parameter bulanAktif/tahunAktif untuk isMenunggak(), yang
  // butuh titik referensi "sekarang" yang sebenarnya, bukan bulan yang sedang
  // ditampilkan.
  const { bulan: bulanSekarangIni, tahun: tahunSekarangIni } = getBulanTahunAktif();

  const [tunggakan, setTunggakan] = useState<Tagihan[]>([]);
  const [loading, setLoading] = useState(true);
  // Fallback jika membersLoaded tak kunjung true (mis. koneksi bermasalah) —
  // supaya halaman tidak terjebak loading selamanya. Dalam kondisi normal,
  // membersLoaded sudah true dalam hitungan detik dan flag ini tidak terpakai.
  const [forceProceed, setForceProceed] = useState(false);

  useEffect(() => {
    if (!firebaseUser || membersLoaded) return;
    const timer = setTimeout(() => setForceProceed(true), 8000);
    return () => {
      clearTimeout(timer);
      // Reset saat membersLoaded akhirnya true, atau user logout — supaya
      // forceProceed tidak "nyangkut" true untuk sesi login berikutnya.
      setForceProceed(false);
    };
  }, [membersLoaded, firebaseUser]);

  const fetchTunggakan = useCallback(
    async (signal?: AbortSignal) => {
      if (!firebaseUser) return;
      // Jangan hitung tunggakan sebelum data member selesai dimuat — kalau
      // dipaksa jalan dengan members=[] (belum ter-load), filter "member baru
      // tidak dianggap menunggak sebelum terdaftar" gagal total untuk sesaat
      // (loading tetap true, jadi UI tidak sempat tampilkan hasil yang salah).
      // forceProceed adalah jalan keluar terakhir jika load gagal terus-menerus.
      if (!membersLoaded && !forceProceed) return;
      if (!membersLoaded && forceProceed) {
        toast.info("Data pelanggan lambat dimuat — menampilkan hasil sementara.");
      }
      setLoading(true);
      try {
        // 1. Ambil semua tagihan yang sudah pernah di-entry (semua status, semua bulan)
        const entrySet = await getAllTagihanEntrySet();

        // 2. Ambil tagihan belum bayar dari Firestore, dibatasi s/d cutoff
        // yang dipilih pengguna (activeBulan/activeTahun) — lihat docstring
        // getTagihanBelumBayarSebelumBulanIni di db.ts untuk detail perbedaan
        // cutoff vs bulan-sekarang-sungguhan.
        const tagihanBelum = await getTagihanBelumBayarSebelumBulanIni(
          activeBulan, activeTahun, members
        );
        if (signal?.aborted) return;

        // 3. Buat virtual entries untuk member yang belum di-entry sama sekali
        const membersAktif = members.filter((m) => m.status === "aktif");
        const virtual: Tagihan[] = [];
        // FIX v1.4.2: activeBulan di sini adalah batas atas periode yang
        // DIPILIH pengguna ("Tunggakan s/d [Bulan] [Tahun]"), bukan bulan
        // sekarang sungguhan. isMenunggak() butuh bulan SEKARANG SUNGGUHAN
        // sebagai parameter ketiga/keempat — sebelumnya dipanggil dengan
        // activeBulan di situ juga, sehingga jika pengguna memilih cutoff ke
        // bulan lampau (mis. Juni, padahal sekarang sudah Agustus), fungsi
        // ini salah jatuh ke cabang "bulan sama" (bandingkan tanggal-hari-ini
        // terhadap batas Juni) alih-alih cabang "bulan lampau, selalu true".
        const menunggakBulanAktif = isMenunggak(activeBulan, activeTahun, bulanSekarangIni, tahunSekarangIni);

        // Tentukan range bulan yang perlu dicek: dari bulan terdaftar s/d bulan aktif
        membersAktif.forEach((m) => {
          if (!m.id) return;

          // Bulan mulai dari createdAt member (fallback ke bulan aktif jika createdAt
          // tidak ada/tidak valid — konsisten dengan getMemberStartPeriode di helpers.ts)
          const start = getMemberStartPeriode(m);
          const startBulan = start?.bulan ?? activeBulan;
          const startTahun = start?.tahun ?? activeTahun;

          // Iterasi semua bulan dari terdaftar s/d bulan aktif (tanpa batas)
          let y = startTahun;
          let b = startBulan;

          while (y < activeTahun || (y === activeTahun && b <= activeBulan)) {
            // Bulan aktif: hanya masuk tunggakan jika sudah lewat batas aman
            // bulan itu (lihat getBatasMenunggakTanggal di helpers.ts)
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
    [activeBulan, activeTahun, firebaseUser, members, membersLoaded, forceProceed, settings, bulanSekarangIni, tahunSekarangIni]
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
            {isMenunggak(activeBulan, activeTahun, bulanSekarangIni, tahunSekarangIni)
              ? "Tagihan belum lunas melewati batas aman bulan ini"
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
