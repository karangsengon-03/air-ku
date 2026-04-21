"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CheckCircle2,
  Clock,
  Trash2,
  Share2,
  Download,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Droplets,
  Filter,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import {
  listenTagihan,
  updateTagihanStatus,
  deleteTagihan,
  saveActivityLog,
} from "@/lib/db";
import { formatRp, formatM3, formatTanggal } from "@/lib/helpers";
import { downloadPdfTagihan, shareTagihan } from "@/lib/export";
import { MONTHS, YEARS } from "@/lib/constants";
import { Tagihan } from "@/types";

// ─── Filter type ──────────────────────────────────────────────────────────────
type FilterStatus = "semua" | "lunas" | "belum";

// ─── Stat card mini ───────────────────────────────────────────────────────────
function StatMini({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      className="card p-3 flex-1 min-w-0"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <div className="section-label mb-1">{label}</div>
      <div
        className="mono font-bold text-base leading-tight"
        style={{ color }}
      >
        {value}
      </div>
    </div>
  );
}

// ─── Tagihan card ─────────────────────────────────────────────────────────────
function TagihanCard({
  item,
  isAdmin,
  isLocked,
  onTandaiLunas,
  onHapus,
  onShare,
  onDownload,
}: {
  item: Tagihan;
  isAdmin: boolean;
  isLocked: boolean;
  onTandaiLunas: (t: Tagihan) => void;
  onHapus: (t: Tagihan) => void;
  onShare: (t: Tagihan) => void;
  onDownload: (t: Tagihan) => void;
}) {
  const lunas = item.status === "lunas";

  return (
    <div
      className="card p-4"
      style={{
        borderLeft: `4px solid ${lunas ? "var(--color-lunas)" : "var(--color-belum)"}`,
        opacity: lunas ? 0.85 : 1,
      }}
    >
      {/* Baris atas: nama + badge */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div
            className="font-bold text-base leading-tight truncate"
            style={{ color: "var(--color-txt)" }}
          >
            {item.memberNama}
          </div>
          <div
            className="text-xs mt-0.5"
            style={{ color: "var(--color-txt3)" }}
          >
            No. {item.memberNomorSambungan} ·{" "}
            {item.memberDusun ? `${item.memberDusun} / ` : ""}RT {item.memberRT}
          </div>
        </div>
        <span className={lunas ? "badge-lunas" : "badge-belum"}>
          {lunas ? <CheckCircle2 size={11} /> : <Clock size={11} />}
          {lunas ? "Lunas" : "Belum"}
        </span>
      </div>

      {/* Meter & pemakaian */}
      <div
        className="flex gap-3 text-sm mb-3 flex-wrap"
        style={{ color: "var(--color-txt2)" }}
      >
        <span>
          <span style={{ color: "var(--color-txt3)" }}>Meter: </span>
          <span className="mono">
            {item.meterAwal} → {item.meterAkhir}
          </span>
        </span>
        <span>
          <span style={{ color: "var(--color-txt3)" }}>Pakai: </span>
          <span className="mono font-semibold">{formatM3(item.pemakaian)}</span>
        </span>
      </div>

      {/* Total & tanggal */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div
            className="mono text-xl font-bold"
            style={{ color: "var(--color-primary)" }}
          >
            {formatRp(item.total)}
          </div>
          <div className="text-xs mt-0.5" style={{ color: "var(--color-txt3)" }}>
            Entry: {formatTanggal(item.tanggalEntry)}
            {lunas && (item.tanggalBayar as boolean) && (
              <> · Bayar: {formatTanggal(item.tanggalBayar)}</>
            )}
          </div>
        </div>
      </div>

      {/* Catatan */}
      {item.catatan && (
        <div
          className="text-xs italic mb-3 px-2 py-1.5 rounded"
          style={{
            background: "var(--color-bg)",
            color: "var(--color-txt3)",
            border: "1px solid var(--color-border)",
          }}
        >
          {item.catatan}
        </div>
      )}

      {/* Tombol aksi */}
      <div className="flex gap-2 flex-wrap">
        {/* Tandai lunas / belum */}
        {!isLocked && (
          <button
            onClick={() => onTandaiLunas(item)}
            className={lunas ? "btn-secondary flex-1" : "btn-primary flex-1"}
            style={{ height: 44, fontSize: 13 }}
          >
            {lunas ? (
              <>
                <Clock size={14} /> Tandai Belum
              </>
            ) : (
              <>
                <CheckCircle2 size={14} /> Tandai Lunas
              </>
            )}
          </button>
        )}

        {/* Share WA */}
        <button
          onClick={() => onShare(item)}
          className="btn-secondary"
          style={{ height: 44, width: 44, padding: 0 }}
          title="Kirim ke WA"
        >
          <Share2 size={16} />
        </button>

        {/* Download PDF */}
        <button
          onClick={() => onDownload(item)}
          className="btn-secondary"
          style={{ height: 44, width: 44, padding: 0 }}
          title="Download PDF"
        >
          <Download size={16} />
        </button>

        {/* Hapus (admin only) */}
        {isAdmin && !isLocked && (
          <button
            onClick={() => onHapus(item)}
            className="btn-danger"
            style={{ height: 44, width: 44, padding: 0, borderRadius: 8 }}
            title="Hapus tagihan"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TagihanView() {
  const {
    settings,
    activeBulan,
    activeTahun,
    setActiveBulanTahun,
    userRole,
    showConfirm,
    addToast,
  } = useAppStore();

  const isAdmin = userRole?.role === "admin";
  const isLocked = settings.globalLock;

  const [tagihan, setTagihan] = useState<Tagihan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>("semua");
  const [search, setSearch] = useState("");
  const [showBulanPicker, setShowBulanPicker] = useState(false);

  // ── Subscribe realtime ──────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    const unsub = listenTagihan(activeBulan, activeTahun, (data) => {
      setTagihan(data);
      setLoading(false);
    });
    return unsub;
  }, [activeBulan, activeTahun]);

  // ── Filter & search ─────────────────────────────────────────────────────────
  const filtered = tagihan.filter((t) => {
    if (filter === "lunas" && t.status !== "lunas") return false;
    if (filter === "belum" && t.status !== "belum") return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        t.memberNama.toLowerCase().includes(q) ||
        t.memberNomorSambungan.toLowerCase().includes(q) ||
        t.memberDusun?.toLowerCase().includes(q) ||
        t.memberRT?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // ── Stats ───────────────────────────────────────────────────────────────────
  const totalTagihan = tagihan.length;
  const jumlahLunas = tagihan.filter((t) => t.status === "lunas").length;
  const jumlahBelum = tagihan.filter((t) => t.status === "belum").length;
  const totalTerkumpul = tagihan
    .filter((t) => t.status === "lunas")
    .reduce((a, t) => a + t.total, 0);

  // ── Aksi tandai lunas/belum ─────────────────────────────────────────────────
  const handleTandaiLunas = useCallback(
    (t: Tagihan) => {
      if (isLocked) {
        addToast("error", "Aplikasi terkunci. Hubungi admin.");
        return;
      }
      const newStatus = t.status === "lunas" ? "belum" : "lunas";
      const label = newStatus === "lunas" ? "lunas" : "belum bayar";
      showConfirm(
        `Tandai ${label}?`,
        `Tagihan ${t.memberNama} (${formatRp(t.total)}) akan ditandai ${label}.`,
        async () => {
          try {
            await updateTagihanStatus(t.id!, newStatus);
            await saveActivityLog(
              "UPDATE_TAGIHAN_STATUS",
              `${t.memberNama} — ${MONTHS[activeBulan - 1]} ${activeTahun} → ${label}`,
              userRole?.email ?? "",
              userRole?.role ?? ""
            );
            addToast("success", `Tagihan ditandai ${label}.`);
          } catch {
            addToast("error", "Gagal memperbarui status.");
          }
        }
      );
    },
    [isLocked, activeBulan, activeTahun, userRole, showConfirm, addToast]
  );

  // ── Aksi hapus (admin) ──────────────────────────────────────────────────────
  const handleHapus = useCallback(
    (t: Tagihan) => {
      if (isLocked) {
        addToast("error", "Aplikasi terkunci. Hubungi admin.");
        return;
      }
      showConfirm(
        "Hapus tagihan?",
        `Tagihan ${t.memberNama} (${formatRp(t.total)}) akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.`,
        async () => {
          try {
            await deleteTagihan(t.id!);
            await saveActivityLog(
              "DELETE_TAGIHAN",
              `${t.memberNama} — ${MONTHS[activeBulan - 1]} ${activeTahun} (${t.nomorTagihan})`,
              userRole?.email ?? "",
              userRole?.role ?? ""
            );
            addToast("success", "Tagihan dihapus.");
          } catch {
            addToast("error", "Gagal menghapus tagihan.");
          }
        },
        true // danger mode
      );
    },
    [isLocked, activeBulan, activeTahun, userRole, showConfirm, addToast]
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

  // ── Download PDF ────────────────────────────────────────────────────────────
  const handleDownload = useCallback(
    async (t: Tagihan) => {
      try {
        addToast("info", "Membuat PDF...");
        await downloadPdfTagihan(t, settings);
        addToast("success", "PDF berhasil diunduh.");
      } catch {
        addToast("error", "Gagal membuat PDF.");
      }
    },
    [settings, addToast]
  );

  // ── Navigasi bulan ──────────────────────────────────────────────────────────
  const prevBulan = () => {
    if (activeBulan === 1) {
      setActiveBulanTahun(12, activeTahun - 1);
    } else {
      setActiveBulanTahun(activeBulan - 1, activeTahun);
    }
  };

  const nextBulan = () => {
    if (activeBulan === 12) {
      setActiveBulanTahun(1, activeTahun + 1);
    } else {
      setActiveBulanTahun(activeBulan + 1, activeTahun);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="pb-safe">
      {/* ── Navigasi bulan ── */}
      <div className="flex items-center justify-between mb-4 gap-2">
        <button
          onClick={prevBulan}
          className="btn-ghost"
          style={{ height: 44, width: 44, padding: 0 }}
        >
          <ChevronLeft size={20} />
        </button>

        <button
          onClick={() => setShowBulanPicker(!showBulanPicker)}
          className="card flex-1 flex items-center justify-center gap-2 font-bold text-sm"
          style={{ height: 44, color: "var(--color-primary)" }}
        >
          <Droplets size={16} />
          {MONTHS[activeBulan - 1]} {activeTahun}
        </button>

        <button
          onClick={nextBulan}
          className="btn-ghost"
          style={{ height: 44, width: 44, padding: 0 }}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* ── Bulan picker dropdown ── */}
      {showBulanPicker && (
        <div className="card p-3 mb-4">
          <div className="section-label mb-2">Pilih Bulan</div>
          {/* Tahun */}
          <div className="flex gap-2 mb-3 flex-wrap">
            {YEARS.map((y) => (
              <button
                key={y}
                onClick={() => {
                  setActiveBulanTahun(activeBulan, y);
                }}
                className={activeTahun === y ? "btn-primary" : "btn-secondary"}
                style={{ height: 36, fontSize: 13, padding: "0 14px" }}
              >
                {y}
              </button>
            ))}
          </div>
          {/* Bulan grid */}
          <div className="grid grid-cols-4 gap-2">
            {MONTHS.map((m, i) => (
              <button
                key={i}
                onClick={() => {
                  setActiveBulanTahun(i + 1, activeTahun);
                  setShowBulanPicker(false);
                }}
                className={
                  activeBulan === i + 1 ? "btn-primary" : "btn-secondary"
                }
                style={{ height: 36, fontSize: 12, padding: 0 }}
              >
                {m.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Stat cards ── */}
      <div className="flex gap-2 mb-4">
        <StatMini
          label="Terkumpul"
          value={formatRp(totalTerkumpul)}
          color="var(--color-primary)"
        />
        <StatMini
          label="Lunas"
          value={`${jumlahLunas}/${totalTagihan}`}
          color="var(--color-lunas)"
        />
        <StatMini
          label="Belum"
          value={String(jumlahBelum)}
          color="var(--color-belum)"
        />
      </div>

      {/* ── Search ── */}
      <div className="relative mb-3">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: "var(--color-txt3)" }}
        />
        <input
          className="input-field"
          style={{ paddingLeft: 38 }}
          placeholder="Cari nama, no. sambungan, dusun…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--color-txt3)" }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* ── Filter tabs ── */}
      <div className="flex gap-2 mb-4">
        {(["semua", "belum", "lunas"] as FilterStatus[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={filter === f ? "btn-primary" : "btn-secondary"}
            style={{ height: 36, fontSize: 13, padding: "0 14px", flex: 1 }}
          >
            {f === "semua" && (
              <>
                <Filter size={13} /> Semua
              </>
            )}
            {f === "belum" && (
              <>
                <Clock size={13} /> Belum
              </>
            )}
            {f === "lunas" && (
              <>
                <CheckCircle2 size={13} /> Lunas
              </>
            )}
          </button>
        ))}
      </div>

      {/* ── List ── */}
      {loading ? (
        <div className="flex flex-col items-center gap-3 py-12">
          <div
            className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "var(--color-primary)" }}
          />
          <p style={{ color: "var(--color-txt3)", fontSize: 14 }}>
            Memuat tagihan…
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12">
          <Droplets size={36} style={{ color: "var(--color-txt3)" }} />
          <p
            className="text-center"
            style={{ color: "var(--color-txt3)", fontSize: 14 }}
          >
            {tagihan.length === 0
              ? `Belum ada tagihan untuk ${MONTHS[activeBulan - 1]} ${activeTahun}.`
              : "Tidak ada tagihan yang sesuai filter."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* Info jumlah hasil filter */}
          {(search || filter !== "semua") && (
            <p
              className="text-xs"
              style={{ color: "var(--color-txt3)" }}
            >
              Menampilkan {filtered.length} dari {tagihan.length} tagihan
            </p>
          )}

          {filtered.map((t) => (
            <TagihanCard
              key={t.id}
              item={t}
              isAdmin={isAdmin}
              isLocked={isLocked}
              onTandaiLunas={handleTandaiLunas}
              onHapus={handleHapus}
              onShare={handleShare}
              onDownload={handleDownload}
            />
          ))}
        </div>
      )}
    </div>
  );
}
