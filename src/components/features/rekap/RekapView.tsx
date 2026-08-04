"use client";

import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Droplets, Download, Share2, Filter, Printer, FileSpreadsheet, CalendarRange, X } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { getTagihanRekap, getTotalOperasional, getTagihanRekapRange, getAvailableRekapYears } from "@/lib/db";
import { formatRp, getBulanTahunAktif, buildRekapRows } from "@/lib/helpers";
import { downloadPdfRekap, downloadPdfRekapRange, downloadExcelRekap, buildWaKolektif, ExportScope } from "@/lib/export";
import { RekapRow } from "@/types";
import { MONTHS, YEARS, EXPORT_KESELURUHAN_TAHUN_TERAKHIR } from "@/lib/constants";
import RekapTable from "./RekapTable";
import { toast } from "@/lib/toast";

export default function RekapView() {
  const { settings, activeBulan, activeTahun, setActiveBulanTahun, userRole, firebaseUser, members, membersLoaded } = useAppStore();
  const isAdmin = userRole?.role === "admin";

  const [rows, setRows] = useState<RekapRow[]>([]);
  const [totalOps, setTotalOps] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterDusun, setFilterDusun] = useState("__semua__");
  const [filterRT, setFilterRT] = useState("__semua__");
  const [showBulanPicker, setShowBulanPicker] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  // ── Export multi-cakupan (v1.5.0): Bulan Ini / Tahunan / Keseluruhan ──────
  const [showExportPicker, setShowExportPicker] = useState(false);
  const [exportScopeKind, setExportScopeKind] = useState<"bulan" | "tahunan" | "keseluruhan">("bulan");
  const [exportTahunPilihan, setExportTahunPilihan] = useState<number | null>(null);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [availableYearsLoading, setAvailableYearsLoading] = useState(false);
  const [exportRangeLoading, setExportRangeLoading] = useState(false);
  // Fallback jika membersLoaded tak kunjung true (mis. koneksi bermasalah) —
  // supaya halaman tidak terjebak loading selamanya.
  const [forceProceed, setForceProceed] = useState(false);

  useEffect(() => {
    if (!firebaseUser || membersLoaded) return;
    const timer = setTimeout(() => setForceProceed(true), 8000);
    return () => {
      clearTimeout(timer);
      setForceProceed(false);
    };
  }, [membersLoaded, firebaseUser]);

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    if (!firebaseUser) return;
    // Jangan gabung member+tagihan sebelum data member selesai dimuat — kalau
    // dipaksa jalan dengan members=[] (belum ter-load), rekap akan tampil
    // kosong/salah untuk sesaat sebelum data yang benar menimpanya.
    if (!membersLoaded && !forceProceed) return;
    setLoading(true);
    try {
      const [tagihan, ops] = await Promise.all([
        getTagihanRekap(activeBulan, activeTahun),
        getTotalOperasional(activeBulan, activeTahun),
      ]);
      if (signal?.aborted) return;

      // Bulan/tahun SUNGGUHAN sekarang — titik referensi untuk isMenunggak(),
      // independen dari activeBulan/activeTahun (bulan yang sedang DILIHAT di
      // Rekap, yang bisa saja bulan lampau). FIX v1.4.2: sebelumnya kedua
      // panggilan isMenunggak() di bawah salah memakai activeBulan sebagai
      // parameter "bulan sekarang" juga, sehingga melihat rekap bulan lampau
      // (mis. Juni saat sekarang Agustus) salah membandingkan tanggal hari
      // ini terhadap batas Juni, bukan mengenali Juni sebagai bulan lampau.
      const { bulan: bulanSekarang, tahun: tahunSekarang } = getBulanTahunAktif();

      // Join member+tagihan → RekapRow[] — logika diekstrak ke buildRekapRows
      // (helpers.ts) supaya bisa dipakai ulang oleh export multi-bulan
      // (Tahunan/Keseluruhan) tanpa duplikasi.
      const rows: RekapRow[] = buildRekapRows(
        tagihan, members, activeBulan, activeTahun, bulanSekarang, tahunSekarang
      );

      // Sort: lunas dulu, lalu belum, lalu menunggak — dalam tiap grup sort by nama
      rows.sort((a, b) => {
        const order = (r: RekapRow) => r.status === "lunas" ? 0 : r.menunggak ? 2 : 1;
        if (order(a) !== order(b)) return order(a) - order(b);
        return a.nama.localeCompare(b.nama, "id");
      });

      setRows(rows);
      setTotalOps(ops);
    } catch {
      if (signal?.aborted) return;
      toast.error("Gagal memuat data rekap.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [activeBulan, activeTahun, firebaseUser, members, membersLoaded, forceProceed]);

  // #20 Fix: AbortController cleanup untuk mencegah state update setelah unmount
  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setFilterDusun("__semua__"); setFilterRT("__semua__"); }, [activeBulan, activeTahun]);

  const dusunList = Array.from(new Set(rows.map((r) => r.dusun).filter(Boolean))).sort();
  const rtList = Array.from(new Set(
    rows.filter((r) => filterDusun === "__semua__" || r.dusun === filterDusun).map((r) => r.rt).filter(Boolean)
  )).sort();

  const filtered = rows.filter((r) => {
    if (filterDusun !== "__semua__" && r.dusun !== filterDusun) return false;
    if (filterRT !== "__semua__" && r.rt !== filterRT) return false;
    return true;
  });

  const jumlahLunas = filtered.filter((r) => r.status === "lunas").length;
  const jumlahMenunggak = filtered.filter((r) => r.menunggak).length;
  const jumlahDitagih = filtered.filter((r) => r.status === "belum" && !r.menunggak).length;
  const jumlahBelum = jumlahDitagih + jumlahMenunggak;
  const totalTerkumpul = filtered.filter((r) => r.status === "lunas").reduce((a, r) => a + r.total, 0);
  const totalTagihan = filtered.reduce((a, r) => a + r.total, 0);
  const totalM3 = filtered.reduce((a, r) => a + r.pemakaian, 0);
  const pendapatanBersih = totalTerkumpul - totalOps;
  const bulanLabel = `${MONTHS[activeBulan - 1]} ${activeTahun}`;

  const handleExportPdf = async () => {
    if (filtered.length === 0) { toast.info("Tidak ada data."); return; }
    setPdfLoading(true);
    try {
      await downloadPdfRekap(filtered, bulanLabel, settings, totalOps);
      toast.success("PDF berhasil diunduh.");
    } catch { toast.error("Gagal membuat PDF."); }
    finally { setPdfLoading(false); }
  };

  const handleShareWa = () => {
    const text = buildWaKolektif(filtered, bulanLabel, settings.namaOrganisasi);
    if (!text) { toast.info("Semua pelanggan sudah lunas!"); return; }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  // Buka picker export cakupan (Bulan Ini/Tahunan/Keseluruhan) — muat daftar
  // tahun yang benar-benar punya data untuk pilihan Tahunan, hanya sekali
  // saat picker pertama dibuka (bukan tiap render).
  const handleOpenExportPicker = async () => {
    setShowExportPicker(true);
    if (availableYears.length > 0) return;
    setAvailableYearsLoading(true);
    try {
      const years = await getAvailableRekapYears();
      setAvailableYears(years);
      if (years.length > 0 && exportTahunPilihan === null) setExportTahunPilihan(years[0]);
    } catch {
      toast.error("Gagal memuat daftar tahun.");
    } finally {
      setAvailableYearsLoading(false);
    }
  };

  // Eksekusi export untuk cakupan Tahunan/Keseluruhan (multi-bulan). Cakupan
  // "bulan" (satu bulan aktif) tetap pakai handleExportPdf/downloadPdfRekap
  // yang sudah ada — fungsi ini khusus untuk rentang.
  const handleExportRange = async (format: "pdf" | "excel") => {
    let scope: ExportScope;
    if (exportScopeKind === "tahunan") {
      if (exportTahunPilihan === null) { toast.info("Pilih tahun terlebih dahulu."); return; }
      scope = { kind: "tahunan", tahun: exportTahunPilihan };
    } else {
      const tahunAkhir = getBulanTahunAktif().tahun;
      scope = { kind: "keseluruhan", tahunMulai: tahunAkhir - EXPORT_KESELURUHAN_TAHUN_TERAKHIR + 1, tahunAkhir };
    }

    setExportRangeLoading(true);
    try {
      const tahunMulai = scope.kind === "tahunan" ? scope.tahun : scope.tahunMulai;
      const tahunAkhirQuery = scope.kind === "tahunan" ? scope.tahun : scope.tahunAkhir;
      const tagihanRange = await getTagihanRekapRange(tahunMulai, tahunAkhirQuery);

      const { bulan: bulanSekarang, tahun: tahunSekarang } = getBulanTahunAktif();

      // Kelompokkan tagihanRange per "bulan-tahun" SEKALI di awal (bukan
      // filter() berulang di dalam loop bersarang di bawah) — untuk cakupan
      // Keseluruhan (bisa ribuan dokumen tagihan lintas 3 tahun × 32+ bulan),
      // ini mengubah kompleksitas dari O(bulan × total_tagihan) jadi
      // O(total_tagihan + bulan), penting seiring data terus bertambah.
      const tagihanPerBulan = new Map<string, typeof tagihanRange>();
      for (const t of tagihanRange) {
        const key = `${t.tahun}-${t.bulan}`;
        const arr = tagihanPerBulan.get(key);
        if (arr) arr.push(t); else tagihanPerBulan.set(key, [t]);
      }

      // Bangun RekapRow[] untuk SETIAP bulan dalam rentang (bukan cuma bulan
      // aktif), supaya member yang belum di-entry sama sekali untuk bulan
      // tertentu tetap muncul sebagai baris "belum bayar" — konsisten dengan
      // perilaku menu Rekap satu-bulan (lihat buildRekapRows di helpers.ts).
      const semuaRows: RekapRow[] = [];
      for (let tahun = tahunMulai; tahun <= tahunAkhirQuery; tahun++) {
        const bulanAkhirTahunIni = tahun === tahunSekarang ? bulanSekarang : 12;
        for (let bulan = 1; bulan <= bulanAkhirTahunIni; bulan++) {
          const tagihanBulanIni = tagihanPerBulan.get(`${tahun}-${bulan}`) ?? [];
          semuaRows.push(...buildRekapRows(tagihanBulanIni, members, bulan, tahun, bulanSekarang, tahunSekarang));
        }
      }

      if (semuaRows.length === 0) { toast.info("Tidak ada data untuk cakupan ini."); return; }

      if (format === "pdf") {
        await downloadPdfRekapRange(semuaRows, scope, settings);
      } else {
        await downloadExcelRekap(semuaRows, scope, settings);
      }
      toast.success(`${format === "pdf" ? "PDF" : "Excel"} berhasil diunduh.`);
      setShowExportPicker(false);
    } catch {
      toast.error(`Gagal membuat ${format === "pdf" ? "PDF" : "Excel"}.`);
    } finally {
      setExportRangeLoading(false);
    }
  };

  const prevBulan = () => activeBulan === 1 ? setActiveBulanTahun(12, activeTahun - 1) : setActiveBulanTahun(activeBulan - 1, activeTahun);
  const nextBulan = () => activeBulan === 12 ? setActiveBulanTahun(1, activeTahun + 1) : setActiveBulanTahun(activeBulan + 1, activeTahun);

  return (
    <div className="col-12 animate-fade-in-up">

      {/* Navigasi Bulan */}
      <div className="flex items-center gap-2 mb-4">
        <button onClick={prevBulan} aria-label="Bulan sebelumnya" className="btn-ghost" style={{ height: 48, width: 48, padding: 0 }}>
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={() => setShowBulanPicker(!showBulanPicker)}
          className="card flex-1 flex items-center justify-center gap-2 font-bold text-sm"
          style={{ height: 48, color: "var(--color-primary)" }}
        >
          <Droplets size={16} /> {bulanLabel}
        </button>
        <button onClick={nextBulan} aria-label="Bulan berikutnya" className="btn-ghost" style={{ height: 48, width: 48, padding: 0 }}>
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Bulan picker */}
      {showBulanPicker && (
        <div className="card" style={{ padding: "14px 16px" }}>
          <div className="section-label mb-2">Pilih Bulan</div>
          <div className="flex gap-2 mb-3 flex-wrap">
            {YEARS.map((y) => (
              <button key={y} onClick={() => setActiveBulanTahun(activeBulan, y)}
                className={activeTahun === y ? "btn-primary" : "btn-secondary"}
                style={{ height: 48, fontSize: 13, padding: "0 14px" }}>{y}</button>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {MONTHS.map((m, i) => (
              <button key={i} onClick={() => { setActiveBulanTahun(i + 1, activeTahun); setShowBulanPicker(false); }}
                className={activeBulan === i + 1 ? "btn-primary" : "btn-secondary"}
                style={{ height: 48, fontSize: 13, padding: 0 }}>
                {m.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filter Dusun / RT */}
      {dusunList.length > 0 && (
        <div className="card" style={{ padding: "14px 16px" }}>
          <div className="flex items-center gap-2 mb-2">
            <Filter size={14} style={{ color: "var(--color-txt3)" }} />
            <span className="section-label" style={{ marginBottom: 0 }}>Filter</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <select className="input-field" style={{ height: 48, flex: 1, minWidth: 120, fontSize: 13 }}
              value={filterDusun} onChange={(e) => { setFilterDusun(e.target.value); setFilterRT("__semua__"); }}>
              <option value="__semua__">Semua Dusun</option>
              {dusunList.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            {filterDusun !== "__semua__" && rtList.length > 0 && (
              <select className="input-field" style={{ height: 48, flex: 1, minWidth: 100, fontSize: 13 }}
                value={filterRT} onChange={(e) => setFilterRT(e.target.value)}>
                <option value="__semua__">Semua RT</option>
                {rtList.map((r) => <option key={r} value={r}>RT {r}</option>)}
              </select>
            )}
          </div>
        </div>
      )}

      {/* Aksi (admin only) */}
      {isAdmin && !loading && rows.length > 0 && (
        <div className="flex gap-2 mb-4">
          <button onClick={handleExportPdf} disabled={pdfLoading} className="btn-primary flex-1" style={{ height: 48, fontSize: 13 }}>
            {pdfLoading
              ? <><div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "rgba(255,255,255,0.8)" }} /> Membuat PDF…</>
              : <><Download size={15} /> Export PDF</>}
          </button>
          <button onClick={handleOpenExportPicker} className="btn-secondary flex-1" style={{ height: 48, fontSize: 13 }}>
            <CalendarRange size={15} /> Export Lainnya
          </button>
          <button onClick={handleShareWa} className="btn-secondary flex-1" style={{ height: 48, fontSize: 13 }}>
            <Share2 size={15} /> Kirim ke WA
          </button>
          {/* #4 Fix: tombol Cetak untuk @media print */}
          <button
            onClick={() => window.print()}
            className="btn-secondary"
            aria-label="Cetak rekap"
            style={{ height: 48, width: 48, padding: 0, flexShrink: 0 }}
          >
            <Printer size={18} />
          </button>
        </div>
      )}

      {/* Export Picker — cakupan Bulan Ini / Tahunan / Keseluruhan, + format PDF/Excel */}
      {showExportPicker && (
        <div
          className="flex items-center justify-center"
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 50, padding: 16 }}
          onClick={() => !exportRangeLoading && setShowExportPicker(false)}
        >
          <div className="card" style={{ padding: "20px", maxWidth: 420, width: "100%" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="font-bold text-sm">Export Laporan Rekap</div>
              <button onClick={() => setShowExportPicker(false)} className="btn-ghost" style={{ height: 32, width: 32, padding: 0 }} aria-label="Tutup">
                <X size={16} />
              </button>
            </div>

            <div className="section-label mb-2">Cakupan</div>
            <div className="flex flex-col gap-2 mb-4">
              <button
                onClick={() => setExportScopeKind("bulan")}
                className={exportScopeKind === "bulan" ? "btn-primary" : "btn-secondary"}
                style={{ height: 44, fontSize: 13, justifyContent: "flex-start", padding: "0 14px" }}
              >
                Bulan Ini ({bulanLabel})
              </button>
              <button
                onClick={() => setExportScopeKind("tahunan")}
                className={exportScopeKind === "tahunan" ? "btn-primary" : "btn-secondary"}
                style={{ height: 44, fontSize: 13, justifyContent: "flex-start", padding: "0 14px" }}
              >
                Tahunan
              </button>
              <button
                onClick={() => setExportScopeKind("keseluruhan")}
                className={exportScopeKind === "keseluruhan" ? "btn-primary" : "btn-secondary"}
                style={{ height: 44, fontSize: 13, justifyContent: "flex-start", padding: "0 14px" }}
              >
                Keseluruhan ({getBulanTahunAktif().tahun - EXPORT_KESELURUHAN_TAHUN_TERAKHIR + 1}–{getBulanTahunAktif().tahun})
              </button>
            </div>

            {exportScopeKind === "tahunan" && (
              <div className="mb-4">
                <div className="section-label mb-2">Pilih Tahun</div>
                {availableYearsLoading ? (
                  <div className="text-sm" style={{ color: "var(--color-txt3)" }}>Memuat daftar tahun…</div>
                ) : availableYears.length === 0 ? (
                  <div className="text-sm" style={{ color: "var(--color-txt3)" }}>Belum ada data tagihan tersimpan.</div>
                ) : (
                  <div className="flex gap-2 flex-wrap">
                    {availableYears.map((y) => (
                      <button key={y} onClick={() => setExportTahunPilihan(y)}
                        className={exportTahunPilihan === y ? "btn-primary" : "btn-secondary"}
                        style={{ height: 40, fontSize: 13, padding: "0 14px" }}>{y}</button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {exportScopeKind === "bulan" ? (
              <div className="text-sm" style={{ color: "var(--color-txt3)", marginBottom: 4 }}>
                Gunakan tombol <strong>Export PDF</strong> di atas untuk laporan bulan aktif. Excel untuk satu bulan belum tersedia — pilih Tahunan atau Keseluruhan.
              </div>
            ) : (
              <>
                <div className="section-label mb-2">Format</div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleExportRange("pdf")}
                    disabled={exportRangeLoading || (exportScopeKind === "tahunan" && exportTahunPilihan === null)}
                    className="btn-primary flex-1"
                    style={{ height: 48, fontSize: 13 }}
                  >
                    {exportRangeLoading
                      ? <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "rgba(255,255,255,0.8)" }} />
                      : <><Download size={15} /> PDF</>}
                  </button>
                  <button
                    onClick={() => handleExportRange("excel")}
                    disabled={exportRangeLoading || (exportScopeKind === "tahunan" && exportTahunPilihan === null)}
                    className="btn-secondary flex-1"
                    style={{ height: 48, fontSize: 13 }}
                  >
                    {exportRangeLoading
                      ? <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" />
                      : <><FileSpreadsheet size={15} /> Excel</>}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center gap-3 py-12">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--color-primary)" }} />
          <p style={{ color: "var(--color-txt3)", fontSize: 13 }}>Memuat rekap…</p>
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-12">
          <Droplets size={36} style={{ color: "var(--color-txt3)" }} />
          <p className="text-center" style={{ color: "var(--color-txt3)", fontSize: 13 }}>
            {rows.length === 0 ? `Belum ada tagihan untuk ${bulanLabel}.` : "Tidak ada data sesuai filter."}
          </p>
        </div>
      )}

      {/* Tabel + Summary */}
      {!loading && filtered.length > 0 && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label: "Terkumpul", val: formatRp(totalTerkumpul), color: "var(--color-primary)" },
              { label: "Total Tagihan", val: formatRp(totalTagihan), color: "var(--color-txt2)" },
              { label: "Lunas / Total", val: `${jumlahLunas} / ${filtered.length}`, color: "var(--color-lunas)" },
              { label: "Menunggak", val: `${jumlahMenunggak} pelanggan`, color: jumlahMenunggak > 0 ? "var(--color-belum)" : "var(--color-txt3)" },
              { label: "Ditagih", val: `${jumlahDitagih} pelanggan`, color: jumlahDitagih > 0 ? "var(--color-tunggakan)" : "var(--color-txt3)" },
            ].map((s) => (
              <div key={s.label} className="card" style={{ borderLeft: `3px solid ${s.color}`, padding: "14px 16px" }}>
                <div className="section-label mb-1">{s.label}</div>
                <div className="mono font-bold text-sm" style={{ color: s.color }}>{s.val}</div>
              </div>
            ))}
          </div>

          {totalOps > 0 && (
            <div className="card mb-4 flex justify-between items-center"
              style={{ borderLeft: "3px solid var(--color-tunggakan)", padding: "14px 16px" }}>
              <div>
                <div className="section-label mb-0.5">Operasional</div>
                <div className="mono text-sm" style={{ color: "var(--color-tunggakan)" }}>{formatRp(totalOps)}</div>
              </div>
              <div className="text-right">
                <div className="section-label mb-0.5">Pendapatan Bersih</div>
                <div className="mono font-bold text-sm" style={{ color: pendapatanBersih >= 0 ? "var(--color-lunas)" : "var(--color-belum)" }}>
                  {formatRp(pendapatanBersih)}
                </div>
              </div>
            </div>
          )}

          <RekapTable
            rows={filtered}
            totalM3={totalM3}
            totalTerkumpul={totalTerkumpul}
            totalTagihan={totalTagihan}
            jumlahLunas={jumlahLunas}
            jumlahBelum={jumlahBelum}
            jumlahDitagih={jumlahDitagih}
            jumlahMenunggak={jumlahMenunggak}
          />

          <button onClick={() => fetchData()} className="btn-ghost w-full" style={{ height: 48, fontSize: 13 }}>
            Perbarui Data
          </button>
        </>
      )}
    </div>
  );
}
