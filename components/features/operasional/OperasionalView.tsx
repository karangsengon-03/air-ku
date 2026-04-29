"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, Wrench } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { listenOperasional, deleteOperasional, saveActivityLog } from "@/lib/db";
import { formatRp, formatTanggal } from "@/lib/helpers";
import { Operasional } from "@/types";
import { MONTHS, YEARS } from "@/lib/constants";
import OperasionalForm from "./OperasionalForm";

export default function OperasionalView() {
  const { activeBulan, activeTahun, setActiveBulanTahun, firebaseUser, userRole, addToast, showConfirm } = useAppStore();
  const isAdmin = userRole?.role === "admin";

  const [list, setList] = useState<Operasional[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const total = useMemo(() => list.reduce((s, o) => s + (o.nominal || 0), 0), [list]);

  useEffect(() => {
    setLoading(true);
    const unsub = listenOperasional(activeBulan, activeTahun, (data) => {
      setList(data);
      setLoading(false);
    });
    return unsub;
  }, [activeBulan, activeTahun]);

  function handleDelete(o: Operasional) {
    showConfirm(
      "Hapus Pengeluaran",
      `Yakin hapus "${o.label}" sebesar ${formatRp(o.nominal)}?`,
      async () => {
        try {
          await deleteOperasional(o.id!);
          await saveActivityLog(
            "hapus_operasional",
            `Hapus pengeluaran: ${o.label} — ${formatRp(o.nominal)}`,
            firebaseUser!.email!,
            userRole!.role
          );
          addToast("success", "Pengeluaran dihapus.");
        } catch {
          addToast("error", "Gagal menghapus.");
        }
      },
      true
    );
  }

  return (
    <div className="col-12 animate-fade-in-up">

      {/* Bulan Picker */}
      <div style={{ display: "flex", gap: 8 }}>
        <select
          className="input-field"
          style={{ flex: 2 }}
          value={activeBulan}
          onChange={(e) => setActiveBulanTahun(Number(e.target.value), activeTahun)}
        >
          {MONTHS.map((m, i) => (
            <option key={i + 1} value={i + 1}>{m}</option>
          ))}
        </select>
        <select
          className="input-field"
          style={{ flex: 1 }}
          value={activeTahun}
          onChange={(e) => setActiveBulanTahun(activeBulan, Number(e.target.value))}
        >
          {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Summary Card */}
      <div className="card" style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div className="section-label">Total Pengeluaran</div>
          <div className="mono" style={{ fontSize: 22, fontWeight: 700, color: "var(--color-belum)" }}>
            {formatRp(total)}
          </div>
        </div>
        <div style={{
          width: 48, height: 48, borderRadius: 10,
          background: "rgba(185,28,28,0.1)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Wrench size={22} style={{ color: "var(--color-belum)" }} />
        </div>
      </div>

      {/* Tombol Tambah */}
      {isAdmin && (
        <button
          className="btn-primary"
          style={{ width: "100%" }}
          onClick={() => setShowForm(true)}
        >
          <Plus size={18} /> Catat Pengeluaran
        </button>
      )}

      {/* List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--color-txt3)" }}>Memuat…</div>
      ) : list.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: "center" }}>
          <Wrench size={36} style={{ color: "var(--color-txt3)", margin: "0 auto 12px" }} />
          <div style={{ color: "var(--color-txt3)" }}>Belum ada pengeluaran dicatat bulan ini.</div>
        </div>
      ) : (
        <div className="col-10">
          {list.map((o) => (
            <div key={o.id} className="card" style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
              <div className="flex-min">
                <div style={{ fontWeight: 600, fontSize: 15 }}>{o.label}</div>
                <div style={{ fontSize: 13, color: "var(--color-txt3)", marginTop: 3 }}>
                  {formatTanggal(o.tanggal)}
                  {o.dicatatOleh && (
                    <span style={{ marginLeft: 8 }}>· {o.dicatatOleh.split("@")[0]}</span>
                  )}
                </div>
              </div>
              <div className="mono" style={{ fontWeight: 700, fontSize: 15, color: "var(--color-belum)", whiteSpace: "nowrap" }}>
                {formatRp(o.nominal)}
              </div>
              {isAdmin && (
                <button
                  className="btn-ghost"
                  style={{ padding: 8, minHeight: 40, color: "var(--color-belum)", flexShrink: 0 }}
                  onClick={() => handleDelete(o)}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}

          {/* Total row */}
          <div style={{
            padding: "12px 16px", borderRadius: 10, marginTop: 4,
            background: "rgba(185,28,28,0.07)", border: "1.5px solid rgba(185,28,28,0.2)",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>Total {list.length} pengeluaran</span>
            <span className="mono" style={{ fontWeight: 800, fontSize: 16, color: "var(--color-belum)" }}>
              {formatRp(total)}
            </span>
          </div>
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <OperasionalForm onClose={() => setShowForm(false)} />
      )}
    </div>
  );
}
