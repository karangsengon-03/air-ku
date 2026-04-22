"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, X, Wrench } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { listenOperasional, saveOperasional, deleteOperasional, saveActivityLog, Timestamp } from "@/lib/db";
import { formatRp, formatTanggal } from "@/lib/helpers";
import { Operasional } from "@/types";
import { MONTHS, YEARS } from "@/lib/constants";

export default function OperasionalView() {
  const { activeBulan, activeTahun, setActiveBulanTahun, firebaseUser, userRole, addToast, showConfirm } = useAppStore();
  const isAdmin = userRole?.role === "admin";

  const [list, setList] = useState<Operasional[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Form state
  const [showForm, setShowForm] = useState(false);
  const [formLabel, setFormLabel] = useState("");
  const [formNominal, setFormNominal] = useState("");
  const [formTanggal, setFormTanggal] = useState(() => {
    const now = new Date();
    return now.toISOString().split("T")[0];
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // ── Total
  const total = useMemo(() => list.reduce((s, o) => s + (o.nominal || 0), 0), [list]);

  // ── Listener
  useEffect(() => {
    setLoading(true);
    const unsub = listenOperasional(activeBulan, activeTahun, (data) => {
      setList(data);
      setLoading(false);
    });
    return unsub;
  }, [activeBulan, activeTahun]);

  // ── Save
  async function handleSave() {
    setFormError("");
    if (!formLabel.trim()) return setFormError("Label pengeluaran wajib diisi.");
    const nominal = parseInt(formNominal.replace(/\D/g, ""));
    if (isNaN(nominal) || nominal <= 0) return setFormError("Nominal harus berupa angka lebih dari 0.");
    if (!formTanggal) return setFormError("Tanggal wajib diisi.");

    setSaving(true);
    try {
      const [tahunDate, bulanDate] = formTanggal.split("-").map(Number);
      const tanggal = Timestamp.fromDate(new Date(formTanggal));
      await saveOperasional({
        label: formLabel.trim(),
        nominal,
        tanggal,
        bulan: bulanDate,
        tahun: tahunDate,
        dicatatOleh: firebaseUser!.email!,
      });
      await saveActivityLog(
        "tambah_operasional",
        `Catat pengeluaran: ${formLabel.trim()} — ${formatRp(nominal)}`,
        firebaseUser!.email!,
        userRole!.role
      );
      addToast("success", "Pengeluaran dicatat.");
      setFormLabel("");
      setFormNominal("");
      setFormTanggal(new Date().toISOString().split("T")[0]);
      setShowForm(false);
    } catch (e) {
      console.error(e);
      setFormError("Gagal menyimpan. Coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  // ── Delete
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

  // ── Format nominal input (tambah titik ribuan saat mengetik)
  function handleNominalChange(raw: string) {
    const digits = raw.replace(/\D/g, "");
    setFormNominal(digits ? parseInt(digits).toLocaleString("id-ID") : "");
  }

  return (
    <div style={{ padding: "0 16px 24px" }}>

      {/* ── Bulan Picker */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
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

      {/* ── Summary Card */}
      <div className="card" style={{ padding: "16px 20px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div className="section-label">Total Pengeluaran</div>
          <div className="mono" style={{ fontSize: 22, fontWeight: 700, color: "var(--color-belum)" }}>
            {formatRp(total)}
          </div>
        </div>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: "rgba(185,28,28,0.1)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Wrench size={22} style={{ color: "var(--color-belum)" }} />
        </div>
      </div>

      {/* ── Tombol Tambah */}
      {isAdmin && (
        <button
          className="btn-primary"
          style={{ width: "100%", marginBottom: 16 }}
          onClick={() => setShowForm(true)}
        >
          <Plus size={18} /> Catat Pengeluaran
        </button>
      )}

      {/* ── List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--color-txt3)" }}>Memuat…</div>
      ) : list.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: "center" }}>
          <Wrench size={36} style={{ color: "var(--color-txt3)", margin: "0 auto 12px" }} />
          <div style={{ color: "var(--color-txt3)" }}>Belum ada pengeluaran dicatat bulan ini.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {list.map((o) => (
            <div key={o.id} className="card" style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
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

      {/* ── Modal Form */}
      {showForm && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 50,
          display: "flex", alignItems: "flex-end", justifyContent: "center",
        }}>
          <div className="card" style={{
            width: "100%", maxWidth: 520,
            borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
            borderTopLeftRadius: 20, borderTopRightRadius: 20,
            padding: "20px 20px 32px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontWeight: 800, fontSize: 17 }}>Catat Pengeluaran</div>
              <button className="btn-ghost" style={{ padding: 8 }} onClick={() => { setShowForm(false); setFormError(""); }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Label */}
              <div>
                <div className="section-label">Keterangan / Label *</div>
                <input
                  className="input-field"
                  placeholder="Contoh: Gaji petugas, Perbaikan pipa, dll"
                  value={formLabel}
                  onChange={(e) => setFormLabel(e.target.value)}
                />
              </div>

              {/* Nominal */}
              <div>
                <div className="section-label">Nominal (Rp) *</div>
                <div style={{ position: "relative" }}>
                  <span style={{
                    position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                    fontWeight: 600, color: "var(--color-txt3)", fontSize: 14,
                  }}>Rp</span>
                  <input
                    className="input-field mono"
                    inputMode="numeric"
                    placeholder="0"
                    style={{ paddingLeft: 40 }}
                    value={formNominal}
                    onChange={(e) => handleNominalChange(e.target.value)}
                  />
                </div>
              </div>

              {/* Tanggal */}
              <div>
                <div className="section-label">Tanggal *</div>
                <input
                  className="input-field"
                  type="date"
                  value={formTanggal}
                  onChange={(e) => setFormTanggal(e.target.value)}
                />
              </div>

              {/* Error */}
              {formError && (
                <div style={{
                  background: "rgba(185,28,28,0.1)", border: "1px solid var(--color-belum)",
                  borderRadius: 8, padding: "10px 14px", fontSize: 14, color: "var(--color-belum)",
                }}>
                  {formError}
                </div>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button className="btn-secondary" style={{ flex: 1 }} onClick={() => { setShowForm(false); setFormError(""); }}>
                  Batal
                </button>
                <button
                  className="btn-primary"
                  style={{ flex: 2 }}
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "Menyimpan…" : "Simpan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
