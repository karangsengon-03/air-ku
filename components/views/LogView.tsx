"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ScrollText, Search, X, ChevronDown, ChevronUp, RefreshCw,
  UserPlus, UserMinus, Pencil, ClipboardList, CheckCircle2,
  Trash2, Banknote, Settings, Lock, Unlock, FileText,
  ClipboardCheck, Trash, RotateCcw,
} from "lucide-react";
import type { LucideProps } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { listenActivityLog, pruneOldActivityLogs } from "@/lib/db";
import { formatTanggalPanjang } from "@/lib/helpers";
import { ActivityLog } from "@/types";
import { Timestamp } from "firebase/firestore";

// Map icon name string → Lucide component
const ICON_MAP: Record<string, React.FC<LucideProps>> = {
  UserPlus, UserMinus, Pencil, ClipboardList, CheckCircle2,
  Trash2, Banknote, Settings, Lock, Unlock, FileText,
  ClipboardCheck, Trash, RotateCcw,
};

function ActionIcon({ name, color }: { name: string; color: string }) {
  const Icon = ICON_MAP[name] ?? FileText;
  return <Icon size={16} style={{ color, flexShrink: 0 }} />;
}

// ── Label & icon mapping per aksi
const ACTION_META: Record<string, { label: string; icon: string; color: string }> = {
  tambah_member: { label: "Tambah Pelanggan", icon: "UserPlus", color: "var(--color-lunas)" },
  edit_member: { label: "Edit Pelanggan", icon: "Pencil", color: "var(--color-primary)" },
  hapus_member: { label: "Hapus Pelanggan", icon: "UserMinus", color: "var(--color-belum)" },
  entry_meter: { label: "Entry Meter", icon: "ClipboardList", color: "var(--color-primary)" },
  lunas: { label: "Tandai Lunas", icon: "CheckCircle2", color: "var(--color-lunas)" },
  batal_lunas: { label: "Batal Lunas", icon: "RotateCcw", color: "var(--color-tunggakan)" },
  hapus_tagihan: { label: "Hapus Tagihan", icon: "Trash2", color: "var(--color-belum)" },
  tambah_operasional: { label: "Catat Pengeluaran", icon: "Banknote", color: "var(--color-tunggakan)" },
  hapus_operasional: { label: "Hapus Pengeluaran", icon: "Trash2", color: "var(--color-belum)" },
  update_harga: { label: "Update Tarif", icon: "Settings", color: "var(--color-primary)" },
  update_settings: { label: "Update Pengaturan", icon: "Settings", color: "var(--color-primary)" },
  global_lock: { label: "Global Lock", icon: "Lock", color: "var(--color-belum)" },
  global_unlock: { label: "Global Unlock", icon: "Unlock", color: "var(--color-lunas)" },
  entry_bayar: { label: "Entry Bayar", icon: "ClipboardCheck", color: "var(--color-lunas)" },
  hapus_entry: { label: "Hapus Entry", icon: "Trash2", color: "var(--color-belum)" },
};

function getActionMeta(action: string) {
  return ACTION_META[action] || { label: action, icon: "FileText", color: "var(--color-txt3)" };
}

function formatTimestamp(ts: unknown): string {
  if (!ts) return "-";
  try {
    let date: Date;
    if (ts instanceof Timestamp) {
      date = ts.toDate();
    } else if (typeof ts === "object" && ts !== null && "seconds" in ts) {
      date = new Timestamp((ts as { seconds: number }).seconds, 0).toDate();
    } else {
      return "-";
    }
    return date.toLocaleString("id-ID", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return "-";
  }
}

function getDateString(ts: unknown): string {
  if (!ts) return "";
  try {
    let date: Date;
    if (ts instanceof Timestamp) {
      date = ts.toDate();
    } else if (typeof ts === "object" && ts !== null && "seconds" in ts) {
      date = new Timestamp((ts as { seconds: number }).seconds, 0).toDate();
    } else {
      return "";
    }
    return date.toISOString().split("T")[0]; // YYYY-MM-DD
  } catch {
    return "";
  }
}

export default function LogView() {
  const { firebaseUser, userRole } = useAppStore();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Auto-hapus log > 30 hari saat mount (admin only, silent)
  useEffect(() => {
    if (userRole?.role !== "admin") return;
    pruneOldActivityLogs().catch(() => {});
  }, [userRole]);

  // ── Filter state
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState("semua");
  const [filterTanggal, setFilterTanggal] = useState("");
  const [showFilter, setShowFilter] = useState(false);

  // ── Listener (500 log terbaru — retensi 30 hari via pruneOldActivityLogs)
  useEffect(() => {
    setLoading(true);
    const unsub = listenActivityLog((data) => {
      setLogs(data);
      setLoading(false);
    }, 500);
    return unsub;
  }, []);

  // ── Unique action types for filter
  const actionTypes = useMemo(() => {
    const set = new Set(logs.map((l) => l.action));
    return Array.from(set).sort();
  }, [logs]);

  // ── Unique users
  const userList = useMemo(() => {
    const set = new Set(logs.map((l) => l.user));
    return Array.from(set).sort();
  }, [logs]);

  // ── Filtered logs
  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (filterAction !== "semua" && l.action !== filterAction) return false;
      if (filterTanggal) {
        const logDate = getDateString(l.ts);
        if (logDate !== filterTanggal) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        return (
          l.detail.toLowerCase().includes(q) ||
          l.user.toLowerCase().includes(q) ||
          getActionMeta(l.action).label.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [logs, filterAction, filterTanggal, search]);

  function clearFilter() {
    setFilterAction("semua");
    setFilterTanggal("");
    setSearch("");
  }

  const hasActiveFilter = filterAction !== "semua" || filterTanggal || search;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

      {/* ── Summary */}
      <div className="card" style={{ padding: "14px 16px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div className="section-label">Log Tersimpan</div>
          <div className="mono" style={{ fontSize: 20, fontWeight: 700, color: "var(--color-primary)" }}>
            {logs.length} aktivitas
          </div>
          <div style={{ fontSize: 11, color: "var(--color-txt3)", marginTop: 2 }}>
            Auto-hapus setelah 30 hari
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="section-label">Ditampilkan</div>
          <div className="mono" style={{ fontSize: 20, fontWeight: 700 }}>
            {filtered.length}
          </div>
        </div>
      </div>

      {/* ── Search + Filter */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Search size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--color-txt3)" }} />
          <input
            className="input-field"
            style={{ paddingLeft: 40 }}
            placeholder="Cari detail, nama user…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 4, color: "var(--color-txt3)" }}
            >
              <X size={16} />
            </button>
          )}
        </div>
        <button
          className="btn-secondary"
          style={{
            paddingInline: 14,
            borderColor: hasActiveFilter ? "var(--color-primary)" : undefined,
            background: hasActiveFilter ? "rgba(3,105,161,0.08)" : undefined,
          }}
          onClick={() => setShowFilter(!showFilter)}
        >
          {showFilter ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* ── Filter Panel */}
      {showFilter && (
        <div className="card" style={{ padding: 16, marginBottom: 12, display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Filter tanggal */}
          <div>
            <div className="section-label">Tanggal</div>
            <input
              className="input-field"
              type="date"
              value={filterTanggal}
              onChange={(e) => setFilterTanggal(e.target.value)}
            />
          </div>

          {/* Filter aksi */}
          {actionTypes.length > 0 && (
            <div>
              <div className="section-label">Jenis Aksi</div>
              <select
                className="input-field"
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                style={{ cursor: "pointer" }}
              >
                <option value="semua">Semua Jenis</option>
                {actionTypes.map((a) => (
                  <option key={a} value={a}>{getActionMeta(a).label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Reset */}
          {hasActiveFilter && (
            <button className="btn-ghost" style={{ alignSelf: "flex-start", color: "var(--color-belum)" }} onClick={clearFilter}>
              <X size={14} /> Reset Filter
            </button>
          )}
        </div>
      )}

      {/* ── Log List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--color-txt3)" }}>
          <RefreshCw size={24} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
          Memuat log…
        </div>
      ) : logs.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: "center" }}>
          <ScrollText size={40} style={{ color: "var(--color-txt3)", margin: "0 auto 12px" }} />
          <div style={{ color: "var(--color-txt3)" }}>Belum ada aktivitas tercatat.</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: 32, textAlign: "center", color: "var(--color-txt3)" }}>
          Tidak ada log sesuai filter.
          {hasActiveFilter && (
            <button className="btn-ghost" style={{ margin: "10px auto 0", color: "var(--color-primary)" }} onClick={clearFilter}>
              Reset filter
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {filtered.map((log, idx) => {
            const meta = getActionMeta(log.action);
            const isMe = log.user === firebaseUser?.email;
            return (
              <div
                key={log.id || idx}
                style={{
                  padding: "14px 16px",
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderLeft: `3px solid ${meta.color}`,
                  borderRadius: 10,
                }}
              >
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <ActionIcon name={meta.icon} color={meta.color} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: meta.color }}>{meta.label}</span>
                      <span style={{ fontSize: 11, color: "var(--color-txt3)", whiteSpace: "nowrap", flexShrink: 0 }}>
                        {formatTimestamp(log.ts)}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: "var(--color-txt2)", marginTop: 3, lineHeight: 1.5 }}>
                      {log.detail}
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 5, alignItems: "center" }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
                        background: isMe ? "rgba(3,105,161,0.1)" : "var(--color-border)",
                        color: isMe ? "var(--color-primary)" : "var(--color-txt3)",
                      }}>
                        {log.user?.split("@")[0]}
                      </span>
                      <span style={{
                        fontSize: 11, padding: "2px 8px", borderRadius: 20,
                        background: log.role === "admin" ? "rgba(3,105,161,0.08)" : "rgba(146,64,14,0.08)",
                        color: log.role === "admin" ? "var(--color-primary)" : "var(--color-tunggakan)",
                        fontWeight: 600,
                      }}>
                        {log.role}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {logs.length >= 500 && (
            <div style={{ padding: "12px 16px", textAlign: "center", fontSize: 12, color: "var(--color-txt3)", borderTop: "1px solid var(--color-border)" }}>
              Menampilkan 500 log terbaru. Log otomatis terhapus setelah 30 hari.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
