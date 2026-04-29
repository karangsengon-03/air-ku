"use client";
import { useState } from "react";
import { X } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { saveOperasional, saveActivityLog, Timestamp } from "@/lib/db";
import { formatRp } from "@/lib/helpers";

interface OperasionalFormProps {
  onClose: () => void;
}

export default function OperasionalForm({ onClose }: OperasionalFormProps) {
  const { activeBulan, activeTahun, firebaseUser, userRole, addToast } = useAppStore();

  const [formLabel, setFormLabel] = useState("");
  const [formNominal, setFormNominal] = useState("");
  const [formTanggal, setFormTanggal] = useState(() => new Date().toISOString().split("T")[0]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  function handleNominalChange(raw: string) {
    const digits = raw.replace(/\D/g, "");
    setFormNominal(digits ? parseInt(digits).toLocaleString("id-ID") : "");
  }

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
      onClose();
    } catch (e) {
      console.error(e);
      setFormError("Gagal menyimpan. Coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      onClick={() => onClose()}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 50,
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        overflowY: "auto", padding: "40px 16px 40px",
      }}
    >
      <div
        className="card animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 520, borderRadius: 20, padding: "20px 20px 28px" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 17 }}>Catat Pengeluaran</div>
          <button className="btn-ghost" style={{ padding: 8 }} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
            <button className="btn-secondary" style={{ flex: 1 }} onClick={onClose}>
              Batal
            </button>
            <button className="btn-primary" style={{ flex: 2 }} onClick={handleSave} disabled={saving}>
              {saving ? "Menyimpan…" : "Simpan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
