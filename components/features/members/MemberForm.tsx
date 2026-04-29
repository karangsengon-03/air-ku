"use client";
import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import {
  saveMember, updateMember, cekNomorSambunganTerpakai, saveActivityLog,
} from "@/lib/db";
import { Member, MemberStatus } from "@/types";
import { STATUS_LABEL, STATUS_COLOR, STATUS_BG } from "./MemberCard";

interface FormData {
  nama: string;
  nomorSambungan: string;
  alamat: string;
  rt: string;
  dusun: string;
  status: MemberStatus;
  meterAwalPertama: string;
}

const EMPTY_FORM: FormData = {
  nama: "", nomorSambungan: "", alamat: "", rt: "", dusun: "",
  status: "aktif", meterAwalPertama: "",
};

interface MemberFormProps {
  editTarget: Member | null;
  onClose: () => void;
}

export default function MemberForm({ editTarget, onClose }: MemberFormProps) {
  const { settings, firebaseUser, userRole, addToast } = useAppStore();

  const [form, setForm] = useState<FormData>(() => {
    if (editTarget) {
      return {
        nama: editTarget.nama,
        nomorSambungan: editTarget.nomorSambungan,
        alamat: editTarget.alamat,
        rt: editTarget.rt,
        dusun: editTarget.dusun,
        status: editTarget.status,
        meterAwalPertama: String(editTarget.meterAwalPertama),
      };
    }
    return EMPTY_FORM;
  });

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const dusunList = useMemo(() => settings.dusunList || [], [settings.dusunList]);
  const rtList = useMemo(() => {
    if (!form.dusun) return [];
    return settings.rtPerDusun?.[form.dusun] || [];
  }, [form.dusun, settings.rtPerDusun]);

  useEffect(() => {
    const rts = settings.rtPerDusun?.[form.dusun] || [];
    if (form.rt && !rts.includes(form.rt)) {
      setForm((f) => ({ ...f, rt: "" }));
    }
  }, [form.dusun]);

  async function handleSave() {
    setFormError("");
    if (!form.nama.trim()) return setFormError("Nama wajib diisi.");
    if (!form.nomorSambungan.trim()) return setFormError("Nomor sambungan wajib diisi.");
    if (!form.dusun) return setFormError("Pilih dusun.");
    const meterVal = parseInt(form.meterAwalPertama);
    if (!editTarget && (isNaN(meterVal) || meterVal < 0)) {
      return setFormError("Meter awal pertama wajib diisi (angka ≥ 0).");
    }

    setSaving(true);
    try {
      const sudahAda = await cekNomorSambunganTerpakai(form.nomorSambungan.trim(), editTarget?.id);
      if (sudahAda) {
        return setFormError(`Nomor sambungan "${form.nomorSambungan}" sudah digunakan pelanggan lain.`);
      }

      if (editTarget) {
        await updateMember(editTarget.id!, {
          nama: form.nama.trim(), nomorSambungan: form.nomorSambungan.trim(),
          alamat: form.alamat.trim(), rt: form.rt, dusun: form.dusun, status: form.status,
        });
        await saveActivityLog("edit_member",
          `Edit pelanggan: ${form.nama.trim()} (${form.nomorSambungan})`,
          firebaseUser!.email!, userRole!.role);
        addToast("success", "Data pelanggan diperbarui.");
      } else {
        await saveMember({
          nama: form.nama.trim(), nomorSambungan: form.nomorSambungan.trim(),
          alamat: form.alamat.trim(), rt: form.rt, dusun: form.dusun,
          status: form.status, meterAwalPertama: meterVal,
          createdBy: firebaseUser!.email!,
        });
        await saveActivityLog("tambah_member",
          `Tambah pelanggan baru: ${form.nama.trim()} (${form.nomorSambungan})`,
          firebaseUser!.email!, userRole!.role);
        addToast("success", "Pelanggan baru berhasil ditambahkan.");
      }
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
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 200,
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        overflowY: "auto", padding: "40px 16px 40px",
      }}
    >
      <div
        className="card animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 480, borderRadius: 20, padding: "20px 20px 28px" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 17 }}>
            {editTarget ? "Edit Pelanggan" : "Tambah Pelanggan Baru"}
          </div>
          <button className="btn-ghost" style={{ padding: 8 }} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Nama */}
          <div>
            <div className="section-label">Nama Lengkap *</div>
            <input className="input-field" placeholder="Nama pelanggan"
              value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} />
          </div>

          {/* Nomor Sambungan */}
          <div>
            <div className="section-label">Nomor Sambungan *</div>
            <input className="input-field mono" placeholder="Contoh: 001, A-12"
              value={form.nomorSambungan}
              onChange={(e) => setForm({ ...form, nomorSambungan: e.target.value })} />
          </div>

          {/* Dusun */}
          <div>
            <div className="section-label">Dusun *</div>
            {dusunList.length > 0 ? (
              <select className="input-field" value={form.dusun}
                onChange={(e) => setForm({ ...form, dusun: e.target.value, rt: "" })}
                style={{ cursor: "pointer" }}>
                <option value="">-- Pilih Dusun --</option>
                {dusunList.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            ) : (
              <input className="input-field" placeholder="Nama dusun"
                value={form.dusun} onChange={(e) => setForm({ ...form, dusun: e.target.value })} />
            )}
          </div>

          {/* RT */}
          <div>
            <div className="section-label">RT</div>
            {rtList.length > 0 ? (
              <select className="input-field" value={form.rt}
                onChange={(e) => setForm({ ...form, rt: e.target.value })}
                style={{ cursor: "pointer" }}>
                <option value="">-- Pilih RT --</option>
                {rtList.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            ) : (
              <input className="input-field" placeholder="Nomor RT (opsional)"
                value={form.rt} onChange={(e) => setForm({ ...form, rt: e.target.value })} />
            )}
          </div>

          {/* Alamat */}
          <div>
            <div className="section-label">Alamat</div>
            <textarea className="input-field"
              style={{ height: "auto", paddingTop: 14, paddingBottom: 14, resize: "none", minHeight: 80 }}
              placeholder="Alamat lengkap (opsional)"
              value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} rows={2} />
          </div>

          {/* Meter Awal (hanya saat tambah) */}
          {!editTarget && (
            <div>
              <div className="section-label">Meter Awal Pertama (m³) *</div>
              <input className="input-field mono" inputMode="numeric"
                placeholder="Angka meter saat pemasangan"
                value={form.meterAwalPertama}
                onChange={(e) => setForm({ ...form, meterAwalPertama: e.target.value })} />
              <div style={{ fontSize: 12, color: "var(--color-txt3)", marginTop: 4 }}>
                Digunakan sebagai meter awal bulan pertama entry.
              </div>
            </div>
          )}

          {/* Status (hanya saat edit) */}
          {editTarget && (
            <div>
              <div className="section-label">Status</div>
              <div className="row-10">
                {(["aktif", "nonaktif", "pindah"] as MemberStatus[]).map((s) => (
                  <button key={s} onClick={() => setForm({ ...form, status: s }) } style={{
                    flex: 1, height: 48, borderRadius: 8, fontWeight: 600, fontSize: 13,
                    cursor: "pointer", border: "1.5px solid",
                    borderColor: form.status === s ? STATUS_COLOR[s] : "var(--color-border)",
                    background: form.status === s ? STATUS_BG[s] : "transparent",
                    color: form.status === s ? STATUS_COLOR[s] : "var(--color-txt3)",
                  }}>
                    {STATUS_LABEL[s]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {formError && (
            <div style={{
              background: "rgba(185,28,28,0.1)", border: "1px solid var(--color-belum)",
              borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "var(--color-belum)",
            }}>
              {formError}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button className="btn-secondary" style={{ flex: 1, height: 48 }} onClick={onClose}>
              Batal
            </button>
            <button className="btn-primary" style={{ flex: 2, height: 48 }} onClick={handleSave} disabled={saving}>
              {saving ? "Menyimpan…" : editTarget ? "Simpan Perubahan" : "Tambah Pelanggan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
