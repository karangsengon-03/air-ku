"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Droplets,
  CheckCircle2,
  Clock,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  WifiOff,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { listenTagihan, listenMembers, getTotalOperasional } from "@/lib/db";
import { formatRp, formatM3 } from "@/lib/helpers";
import { MONTHS } from "@/lib/constants";
import { Tagihan, Member } from "@/types";

// ─── Donut Chart ──────────────────────────────────────────────────────────────

function DonutChart({ lunas, belum }: { lunas: number; belum: number }) {
  const total = lunas + belum;
  if (total === 0) {
    return (
      <div className="flex items-center justify-center w-20 h-20">
        <svg viewBox="0 0 40 40" className="w-20 h-20">
          <circle cx="20" cy="20" r="15" fill="none" stroke="var(--color-border)" strokeWidth="5" />
          <text x="20" y="24" textAnchor="middle" fontSize="8" fill="var(--color-txt3)" fontFamily="Plus Jakarta Sans">
            -
          </text>
        </svg>
      </div>
    );
  }

  const pct = lunas / total;
  const circumference = 2 * Math.PI * 15;
  const dashArray = pct * circumference;

  return (
    <div className="relative w-20 h-20 flex items-center justify-center">
      <svg viewBox="0 0 40 40" className="w-20 h-20 -rotate-90">
        {/* track */}
        <circle
          cx="20" cy="20" r="15"
          fill="none"
          stroke="var(--color-belum)"
          strokeWidth="5"
          opacity="0.2"
        />
        {/* progress */}
        <circle
          cx="20" cy="20" r="15"
          fill="none"
          stroke="var(--color-lunas)"
          strokeWidth="5"
          strokeDasharray={`${dashArray} ${circumference}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-base font-bold mono" style={{ color: "var(--color-lunas)" }}>
          {Math.round(pct * 100)}%
        </span>
        <span className="text-[10px]" style={{ color: "var(--color-txt3)" }}>lunas</span>
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <div className="card p-4 flex items-start gap-3">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}20` }}
      >
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="section-label">{label}</p>
        <p className="text-lg font-bold mono truncate" style={{ color: "var(--color-txt)" }}>
          {value}
        </p>
        {sub && (
          <p className="text-xs mt-0.5" style={{ color: "var(--color-txt3)" }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DashboardView() {
  const router = useRouter();
  const { activeBulan, activeTahun, setActiveBulanTahun, userRole, isOnline } = useAppStore();

  const [tagihan, setTagihan] = useState<Tagihan[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [totalOps, setTotalOps] = useState(0);
  const [loading, setLoading] = useState(true);

  // subscribe tagihan bulan aktif
  useEffect(() => {
    setLoading(true);
    const unsub = listenTagihan(activeBulan, activeTahun, (data) => {
      setTagihan(data);
      setLoading(false);
    });
    return unsub;
  }, [activeBulan, activeTahun]);

  // subscribe members (untuk total pelanggan aktif)
  useEffect(() => {
    const unsub = listenMembers((data) => setMembers(data));
    return unsub;
  }, []);

  // operasional bulan ini
  useEffect(() => {
    getTotalOperasional(activeBulan, activeTahun).then(setTotalOps);
  }, [activeBulan, activeTahun]);

  // kalkulasi ringkasan
  const lunas = tagihan.filter((t) => t.status === "lunas");
  const belum = tagihan.filter((t) => t.status === "belum");
  const totalTerkumpul = lunas.reduce((s, t) => s + t.total, 0);
  const totalM3 = tagihan.reduce((s, t) => s + t.pemakaian, 0);
  const pendapatanBersih = totalTerkumpul - totalOps;
  const membersAktif = members.filter((m) => m.status === "aktif");

  const bulanLabel = `${MONTHS[activeBulan - 1]} ${activeTahun}`;

  // bulan selector
  const now = new Date();
  const currentBulan = now.getMonth() + 1;
  const currentTahun = now.getFullYear();
  const isCurrentMonth = activeBulan === currentBulan && activeTahun === currentTahun;

  const goToPrevMonth = useCallback(() => {
    if (activeBulan === 1) {
      setActiveBulanTahun(12, activeTahun - 1);
    } else {
      setActiveBulanTahun(activeBulan - 1, activeTahun);
    }
  }, [activeBulan, activeTahun, setActiveBulanTahun]);

  const goToNextMonth = useCallback(() => {
    if (activeBulan === 12) {
      setActiveBulanTahun(1, activeTahun + 1);
    } else {
      setActiveBulanTahun(activeBulan + 1, activeTahun);
    }
  }, [activeBulan, activeTahun, setActiveBulanTahun]);

  return (
    <div className="pb-safe px-4 pt-4 space-y-4">
      {/* Offline banner */}
      {!isOnline && (
        <div
          className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium"
          style={{ background: "var(--color-tunggakan)20", color: "var(--color-tunggakan)" }}
        >
          <WifiOff size={16} />
          <span>Mode offline — data mungkin tidak terkini</span>
        </div>
      )}

      {/* Header bulan aktif */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={goToPrevMonth}
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "var(--color-border)" }}
            aria-label="Bulan sebelumnya"
          >
            <span style={{ color: "var(--color-txt2)" }}>‹</span>
          </button>

          <div className="text-center">
            <p className="font-bold text-base" style={{ color: "var(--color-txt)" }}>
              {bulanLabel}
            </p>
            {isCurrentMonth && (
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: "var(--color-primary)20", color: "var(--color-primary)" }}>
                Bulan ini
              </span>
            )}
          </div>

          <button
            onClick={goToNextMonth}
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "var(--color-border)" }}
            aria-label="Bulan berikutnya"
          >
            <span style={{ color: "var(--color-txt2)" }}>›</span>
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex items-center justify-center py-12 gap-3"
          style={{ color: "var(--color-txt3)" }}>
          <RefreshCw size={20} className="animate-spin" />
          <span>Memuat data...</span>
        </div>
      ) : (
        <>
          {/* Ringkasan + Donut */}
          <div className="card p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="section-label mb-1">Total Terkumpul</p>
                <p className="text-2xl font-extrabold mono"
                  style={{ color: "var(--color-lunas)" }}>
                  {formatRp(totalTerkumpul)}
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--color-txt3)" }}>
                  {lunas.length} lunas · {belum.length} belum bayar
                </p>
                {totalOps > 0 && (
                  <p className="text-xs mt-1" style={{ color: "var(--color-txt3)" }}>
                    Bersih: <span className="mono font-medium"
                      style={{ color: pendapatanBersih >= 0 ? "var(--color-lunas)" : "var(--color-belum)" }}>
                      {formatRp(pendapatanBersih)}
                    </span>
                  </p>
                )}
              </div>
              <DonutChart lunas={lunas.length} belum={belum.length} />
            </div>
          </div>

          {/* 3 stat cards */}
          <div className="grid grid-cols-1 gap-3">
            <StatCard
              icon={<CheckCircle2 size={20} />}
              label="Sudah Lunas"
              value={`${lunas.length} pelanggan`}
              sub={formatRp(totalTerkumpul)}
              color="var(--color-lunas)"
            />
            <StatCard
              icon={<Clock size={20} />}
              label="Belum Bayar"
              value={`${belum.length} pelanggan`}
              sub={
                belum.length > 0
                  ? `Tunggakan: ${formatRp(belum.reduce((s, t) => s + t.total, 0))}`
                  : "Semua sudah lunas 🎉"
              }
              color="var(--color-belum)"
            />
            <StatCard
              icon={<Droplets size={20} />}
              label="Total Pemakaian"
              value={formatM3(totalM3)}
              sub={
                tagihan.length > 0
                  ? `Rata-rata ${formatM3(Math.round(totalM3 / tagihan.length))}/pelanggan`
                  : undefined
              }
              color="var(--color-accent)"
            />
          </div>

          {/* Info pelanggan aktif (admin only) */}
          {userRole?.role === "admin" && (
            <div className="card p-4 flex items-center justify-between">
              <div>
                <p className="section-label">Pelanggan Aktif</p>
                <p className="text-base font-bold mono" style={{ color: "var(--color-txt)" }}>
                  {membersAktif.length} orang
                </p>
                <p className="text-xs" style={{ color: "var(--color-txt3)" }}>
                  {tagihan.length > 0
                    ? `${tagihan.length} sudah diinput bulan ini`
                    : "Belum ada entry bulan ini"}
                </p>
              </div>
              <TrendingUp size={28} style={{ color: "var(--color-txt3)" }} />
            </div>
          )}

          {/* Shortcut Entry Meter */}
          {isCurrentMonth && (
            <button
              onClick={() => router.push("/entry")}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <span>Entry Meter Bulan Ini</span>
              <ArrowRight size={18} />
            </button>
          )}

          {/* Empty state */}
          {tagihan.length === 0 && (
            <div className="text-center py-8 space-y-2">
              <Droplets size={40} className="mx-auto opacity-30" />
              <p className="text-sm" style={{ color: "var(--color-txt3)" }}>
                Belum ada tagihan untuk {bulanLabel}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
