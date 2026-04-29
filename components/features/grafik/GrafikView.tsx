"use client";

import { useEffect, useState, useCallback } from "react";
import {
  TrendingUp, BarChart2, Droplets, ChevronLeft, ChevronRight, Trophy,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { useAppStore } from "@/store/useAppStore";
import { getTagihanByTahun, getOperasionalByTahun } from "@/lib/db";
import { MONTHS } from "@/lib/constants";
import { TooltipRp, TooltipM3, SectionHeader, TopPelangganList } from "./GrafikCharts";

interface BulanData {
  bulan: string;
  m3: number;
  pendapatan: number;
  operasional: number;
  bersih: number;
  jumlahLunas: number;
  jumlahTotal: number;
}

interface DusunData {
  dusun: string;
  m3: number;
  pelanggan: number;
}

interface TopPelanggan {
  nama: string;
  nomorSambungan: string;
  pemakaian: number;
}

export default function GrafikView() {
  const { activeTahun, activeBulan, addToast, firebaseUser } = useAppStore();
  const [bulanData, setBulanData] = useState<BulanData[]>([]);
  const [dusunData, setDusunData] = useState<DusunData[]>([]);
  const [topPelanggan, setTopPelanggan] = useState<TopPelanggan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTahun, setSelectedTahun] = useState(activeTahun);

  const fetchData = useCallback(async () => {
    if (!firebaseUser) return;
    setLoading(true);
    try {
      const [tagihanRes, opsRes] = await Promise.allSettled([
        getTagihanByTahun(selectedTahun),
        getOperasionalByTahun(selectedTahun),
      ]);
      const tagihanData = tagihanRes.status === "fulfilled" ? tagihanRes.value : [];
      const opsData = opsRes.status === "fulfilled" ? opsRes.value : [];

      const bulanMap = new Map<number, BulanData>();
      for (let i = 1; i <= 12; i++) {
        bulanMap.set(i, { bulan: MONTHS[i - 1].slice(0, 3), m3: 0, pendapatan: 0, operasional: 0, bersih: 0, jumlahLunas: 0, jumlahTotal: 0 });
      }
      for (const t of tagihanData) {
        const d = bulanMap.get(t.bulan)!;
        d.m3 += t.pemakaian;
        d.jumlahTotal++;
        if (t.status === "lunas") { d.pendapatan += t.total; d.jumlahLunas++; }
      }
      for (const o of opsData) {
        const d = bulanMap.get(o.bulan);
        if (d) d.operasional += o.nominal;
      }
      for (const d of bulanMap.values()) d.bersih = d.pendapatan - d.operasional;

      const cutoff = selectedTahun === new Date().getFullYear() ? new Date().getMonth() + 1 : 12;
      setBulanData(Array.from(bulanMap.values()).slice(0, cutoff));

      const tagihanBulanIni = tagihanData.filter((t) => t.bulan === activeBulan && t.tahun === selectedTahun);
      const dusunMap = new Map<string, DusunData>();
      for (const t of tagihanBulanIni) {
        const key = t.memberDusun || "Tanpa Dusun";
        if (!dusunMap.has(key)) dusunMap.set(key, { dusun: key, m3: 0, pelanggan: 0 });
        const d = dusunMap.get(key)!;
        d.m3 += t.pemakaian;
        d.pelanggan++;
      }
      setDusunData(Array.from(dusunMap.values()).sort((a, b) => b.m3 - a.m3));

      setTopPelanggan(
        tagihanBulanIni
          .map((t) => ({ nama: t.memberNama, nomorSambungan: t.memberNomorSambungan, pemakaian: t.pemakaian }))
          .sort((a, b) => b.pemakaian - a.pemakaian)
          .slice(0, 5)
      );
    } catch {
      addToast("error", "Gagal memuat data grafik.");
    } finally {
      setLoading(false);
    }
  }, [selectedTahun, activeBulan, addToast, firebaseUser]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-16">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--color-primary)" }} />
        <p style={{ color: "var(--color-txt3)", fontSize: 14 }}>Memuat data grafik…</p>
      </div>
    );
  }

  const noData = bulanData.every((d) => d.m3 === 0 && d.pendapatan === 0);

  return (
    <div className="col-12 animate-fade-in-up">

      {/* Navigasi Tahun */}
      <div className="flex items-center gap-2 mb-5">
        <button onClick={() => setSelectedTahun((y) => y - 1)} className="btn-ghost" style={{ height: 44, width: 44, padding: 0 }}>
          <ChevronLeft size={20} />
        </button>
        <div className="card flex-1 flex items-center justify-center gap-2 font-bold text-sm" style={{ height: 44, color: "var(--color-primary)" }}>
          <TrendingUp size={16} /> Tren {selectedTahun}
        </div>
        <button onClick={() => setSelectedTahun((y) => y + 1)} className="btn-ghost" style={{ height: 44, width: 44, padding: 0 }}>
          <ChevronRight size={20} />
        </button>
      </div>

      {noData ? (
        <div className="flex flex-col items-center gap-3 py-12">
          <BarChart2 size={36} style={{ color: "var(--color-txt3)" }} />
          <p style={{ color: "var(--color-txt3)", fontSize: 14 }}>Belum ada data untuk tahun {selectedTahun}.</p>
        </div>
      ) : (
        <>
          {/* Chart 1: Tren pemakaian m³ */}
          <div className="card" style={{ padding: "18px 16px" }}>
            <SectionHeader icon={<Droplets size={16} />} title={`Tren Pemakaian Air ${selectedTahun}`} />
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={bulanData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: "var(--color-txt3)" }} />
                <YAxis tick={{ fontSize: 10, fill: "var(--color-txt3)" }} tickFormatter={(v) => `${v}m³`} width={42} />
                <Tooltip content={<TooltipM3 />} />
                <Line type="monotone" dataKey="m3" name="Pemakaian" stroke="#0369A1" strokeWidth={2.5} dot={{ r: 3, fill: "#0369A1" }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 2: Tren Pendapatan */}
          <div className="card" style={{ padding: "18px 16px" }}>
            <SectionHeader icon={<BarChart2 size={16} />} title={`Tren Pendapatan ${selectedTahun}`} />
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={bulanData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }} barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: "var(--color-txt3)" }} />
                <YAxis
                  tick={{ fontSize: 10, fill: "var(--color-txt3)" }}
                  tickFormatter={(v) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}jt` : v >= 1000 ? `${(v / 1000).toFixed(0)}rb` : String(v)}
                  width={46}
                />
                <Tooltip content={<TooltipRp />} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconType="circle" iconSize={8} />
                <Bar dataKey="pendapatan" name="Terkumpul" fill="#0369A1" radius={[3, 3, 0, 0]} />
                {bulanData.some((d) => d.operasional > 0) && (
                  <Bar dataKey="operasional" name="Operasional" fill="#92400E" radius={[3, 3, 0, 0]} />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 3: Per Dusun */}
          {dusunData.length > 1 && (
            <div className="card" style={{ padding: "18px 16px" }}>
              <SectionHeader icon={<BarChart2 size={16} />} title={`Pemakaian per Dusun — ${MONTHS[activeBulan - 1]} ${selectedTahun}`} />
              <ResponsiveContainer width="100%" height={Math.max(160, dusunData.length * 44)}>
                <BarChart data={dusunData} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 8 }} barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "var(--color-txt3)" }} tickFormatter={(v) => `${v}m³`} />
                  <YAxis dataKey="dusun" type="category" tick={{ fontSize: 11, fill: "var(--color-txt2)" }} width={80} />
                  <Tooltip content={<TooltipM3 />} />
                  <Bar dataKey="m3" name="Pemakaian" fill="#0284C7" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* List: Top 5 pemakaian */}
          {topPelanggan.length > 0 && (
            <div className="card" style={{ padding: "18px 16px" }}>
              <SectionHeader icon={<Trophy size={16} />} title={`Top Pemakaian — ${MONTHS[activeBulan - 1]} ${selectedTahun}`} />
              <TopPelangganList data={topPelanggan} />
            </div>
          )}

          <button onClick={fetchData} className="btn-ghost w-full" style={{ height: 40, fontSize: 13 }}>
            Perbarui Data
          </button>
        </>
      )}
    </div>
  );
}
