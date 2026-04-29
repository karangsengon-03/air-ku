"use client";

import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Droplets, Download, Share2, Filter } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { getTagihanRekap, getTotalOperasional } from "@/lib/db";
import { formatRp, formatM3 } from "@/lib/helpers";
import { downloadPdfRekap, buildWaKolektif, RekapRow } from "@/lib/export";
import { MONTHS, YEARS } from "@/lib/constants";
import RekapTable from "./RekapTable";

export default function RekapView() {
  const { settings, activeBulan, activeTahun, setActiveBulanTahun, userRole, addToast, firebaseUser } = useAppStore();
  const isAdmin = userRole?.role === "admin";

  const [rows, setRows] = useState<RekapRow[]>([]);
  const [totalOps, setTotalOps] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterDusun, setFilterDusun] = useState("__semua__");
  const [filterRT, setFilterRT] = useState("__semua__");
  const [showBulanPicker, setShowBulanPicker] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!firebaseUser) return;
    setLoading(true);
    try {
      const [tagihan, ops] = await Promise.all([
        getTagihanRekap(activeBulan, activeTahun),
        getTotalOperasional(activeBulan, activeTahun),
      ]);
      setRows(tagihan.map((t) => ({
        nama: t.memberNama, nomorSambungan: t.memberNomorSambungan,
        dusun: t.memberDusun, rt: t.memberRT,
        pemakaian: t.pemakaian, total: t.total, status: t.status,
      })));
      setTotalOps(ops);
    } catch {
      addToast("error", "Gagal memuat data rekap.");
    } finally {
      setLoading(false);
    }
  }, [activeBulan, activeTahun, addToast, firebaseUser]);

  useEffect(() => { fetchData(); }, [fetchData]);
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
  const jumlahBelum = filtered.filter((r) => r.status === "belum").length;
  const totalTerkumpul = filtered.filter((r) => r.status === "lunas").reduce((a, r) => a + r.total, 0);
  const totalTagihan = filtered.reduce((a, r) => a + r.total, 0);
  const totalM3 = filtered.reduce((a, r) => a + r.pemakaian, 0);
  const pendapatanBersih = totalTerkumpul - totalOps;
  const bulanLabel = `${MONTHS[activeBulan - 1]} ${activeTahun}`;

  const handleExportPdf = useCallback(async () => {
    if (filtered.length === 0) { addToast("info", "Tidak ada data."); return; }
    setPdfLoading(true);
    try {
      await downloadPdfRekap(filtered, bulanLabel, settings, totalOps);
      addToast("success", "PDF berhasil diunduh.");
    } catch { addToast("error", "Gagal membuat PDF."); }
    finally { setPdfLoading(false); }
  }, [filtered, bulanLabel, settings, totalOps, addToast]);

  const handleShareWa = useCallback(() => {
    const text = buildWaKolektif(filtered, bulanLabel, settings.namaOrganisasi);
    if (!text) { addToast("info", "Semua pelanggan sudah lunas!"); return; }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }, [filtered, bulanLabel, settings.namaOrganisasi, addToast]);

  const prevBulan = () => activeBulan === 1 ? setActiveBulanTahun(12, activeTahun - 1) : setActiveBulanTahun(activeBulan - 1, activeTahun);
  const nextBulan = () => activeBulan === 12 ? setActiveBulanTahun(1, activeTahun + 1) : setActiveBulanTahun(activeBulan + 1, activeTahun);

  return (
    <div className="col-12 animate-fade-in-up">

      {/* Navigasi Bulan */}
      <div className="flex items-center gap-2 mb-4">
        <button onClick={prevBulan} className="btn-ghost" style={{ height: 44, width: 44, padding: 0 }}>
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={() => setShowBulanPicker(!showBulanPicker)}
          className="card flex-1 flex items-center justify-center gap-2 font-bold text-sm"
          style={{ height: 44, color: "var(--color-primary)" }}
        >
          <Droplets size={16} /> {bulanLabel}
        </button>
        <button onClick={nextBulan} className="btn-ghost" style={{ height: 44, width: 44, padding: 0 }}>
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Bulan picker */}
      {showBulanPicker && (
        <div className="card" style={{ padding: "14px 14px" }}>
          <div className="section-label mb-2">Pilih Bulan</div>
          <div className="flex gap-2 mb-3 flex-wrap">
            {YEARS.map((y) => (
              <button key={y} onClick={() => setActiveBulanTahun(activeBulan, y)}
                className={activeTahun === y ? "btn-primary" : "btn-secondary"}
                style={{ height: 36, fontSize: 13, padding: "0 14px" }}>{y}</button>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {MONTHS.map((m, i) => (
              <button key={i} onClick={() => { setActiveBulanTahun(i + 1, activeTahun); setShowBulanPicker(false); }}
                className={activeBulan === i + 1 ? "btn-primary" : "btn-secondary"}
                style={{ height: 36, fontSize: 12, padding: 0 }}>
                {m.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filter Dusun / RT */}
      {dusunList.length > 0 && (
        <div className="card" style={{ padding: "14px 14px" }}>
          <div className="flex items-center gap-2 mb-2">
            <Filter size={14} style={{ color: "var(--color-txt3)" }} />
            <span className="section-label" style={{ marginBottom: 0 }}>Filter</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <select className="input-field" style={{ height: 40, flex: 1, minWidth: 120, fontSize: 13 }}
              value={filterDusun} onChange={(e) => { setFilterDusun(e.target.value); setFilterRT("__semua__"); }}>
              <option value="__semua__">Semua Dusun</option>
              {dusunList.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            {filterDusun !== "__semua__" && rtList.length > 0 && (
              <select className="input-field" style={{ height: 40, flex: 1, minWidth: 100, fontSize: 13 }}
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
          <button onClick={handleExportPdf} disabled={pdfLoading} className="btn-primary flex-1" style={{ height: 44, fontSize: 13 }}>
            {pdfLoading
              ? <><div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "rgba(255,255,255,0.8)" }} /> Membuat PDF…</>
              : <><Download size={15} /> Export PDF</>}
          </button>
          <button onClick={handleShareWa} className="btn-secondary flex-1" style={{ height: 44, fontSize: 13 }}>
            <Share2 size={15} /> Kirim ke WA
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center gap-3 py-12">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--color-primary)" }} />
          <p style={{ color: "var(--color-txt3)", fontSize: 14 }}>Memuat rekap…</p>
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-12">
          <Droplets size={36} style={{ color: "var(--color-txt3)" }} />
          <p className="text-center" style={{ color: "var(--color-txt3)", fontSize: 14 }}>
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
              { label: "Total Pemakaian", val: formatM3(totalM3), color: "var(--color-accent)" },
            ].map((s) => (
              <div key={s.label} className="card" style={{ borderLeft: `3px solid ${s.color}`, padding: "14px 12px" }}>
                <div className="section-label mb-1">{s.label}</div>
                <div className="mono font-bold text-sm" style={{ color: s.color }}>{s.val}</div>
              </div>
            ))}
          </div>

          {totalOps > 0 && (
            <div className="card mb-4 flex justify-between items-center"
              style={{ borderLeft: "3px solid var(--color-tunggakan)", padding: "14px 14px" }}>
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
          />

          <button onClick={fetchData} className="btn-ghost w-full" style={{ height: 40, fontSize: 13 }}>
            Perbarui Data
          </button>
        </>
      )}
    </div>
  );
}
