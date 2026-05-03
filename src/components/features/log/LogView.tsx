"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ScrollText, Search, X, ChevronDown, ChevronUp, RefreshCw,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { listenActivityLog, pruneOldActivityLogs } from "@/lib/db";
import { ActivityLog } from "@/types";
import LogItem, { getActionMeta, getDateString } from "./LogItem";

export default function LogView() {
  const { firebaseUser, userRole } = useAppStore();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Auto-hapus log > 30 hari (admin only, silent)
  useEffect(() => {
    if (userRole?.role !== "admin") return;
    pruneOldActivityLogs().catch(() => {});
  }, [userRole]);

  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState("semua");
  const [filterTanggal, setFilterTanggal] = useState("");
  const [showFilter, setShowFilter] = useState(false);

  // Listener 500 log terbaru
  useEffect(() => {
    setLoading(true);
    const unsub = listenActivityLog((data) => {
      setLogs(data);
      setLoading(false);
    }, 500);
    return unsub;
  }, []);

  const actionTypes = useMemo(() => {
    const set = new Set(logs.map((l) => l.action));
    return Array.from(set).sort();
  }, [logs]);

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
    <div className="col-12 animate-fade-in-up">

      {/* Summary */}
      <div className="card" style={{ padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div className="section-label">Log Tersimpan</div>
          <div className="mono" style={{ fontSize: 20, fontWeight: 700, color: "var(--color-primary)" }}>
            {logs.length} aktivitas
          </div>
          <div style={{ fontSize: 13, color: "var(--color-txt3)", marginTop: 2 }}>
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

      {/* Search + Filter toggle */}
      <div style={{ display: "flex", gap: 8 }}>
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

      {/* Filter Panel */}
      {showFilter && (
        <div className="card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <div className="section-label">Tanggal</div>
            <input
              className="input-field"
              type="date"
              value={filterTanggal}
              onChange={(e) => setFilterTanggal(e.target.value)}
            />
          </div>

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

          {hasActiveFilter && (
            <button className="btn-ghost" style={{ alignSelf: "flex-start", color: "var(--color-belum)" }} onClick={clearFilter}>
              <X size={14} /> Reset Filter
            </button>
          )}
        </div>
      )}

      {/* Log List */}
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
        <div className="card empty-state-lg">
          Tidak ada log sesuai filter.
          {hasActiveFilter && (
            <button className="btn-ghost" style={{ margin: "10px auto 0", color: "var(--color-primary)" }} onClick={clearFilter}>
              Reset filter
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {filtered.map((log, idx) => (
            <LogItem
              key={log.id || idx}
              log={log}
              index={idx}
              currentUserEmail={firebaseUser?.email ?? undefined}
            />
          ))}

          {logs.length >= 500 && (
            <div style={{ padding: "12px 16px", textAlign: "center", fontSize: 13, color: "var(--color-txt3)", borderTop: "1px solid var(--color-border)" }}>
              Menampilkan 500 log terbaru. Log otomatis terhapus setelah 30 hari.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
