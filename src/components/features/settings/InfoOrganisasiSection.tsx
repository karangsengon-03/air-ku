"use client";
// #16c — Dipecah dari SettingsSections.tsx
import { useState, useEffect } from "react";
import { Settings, Save, Edit2 } from "lucide-react";
import { updateSettings } from "@/lib/db";
import { AppSettings } from "@/types";
import { toast } from "@/lib/toast";
import SettingsSection from "./SettingsSection";

export default function InfoOrganisasiSection({ settings }: { settings: AppSettings }) {
  const [editing, setEditing] = useState(false);
  const [namaOrg, setNamaOrg] = useState(settings.namaOrganisasi);
  const [desa, setDesa] = useState(settings.desa);
  const [kecamatan, setKecamatan] = useState(settings.kecamatan);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editing) {
      setNamaOrg(settings.namaOrganisasi);
      setDesa(settings.desa);
      setKecamatan(settings.kecamatan);
    }
  }, [settings, editing]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings({ namaOrganisasi: namaOrg.trim(), desa: desa.trim(), kecamatan: kecamatan.trim() });
      toast.success("Info organisasi tersimpan");
      setEditing(false);
    } catch { toast.error("Gagal menyimpan"); }
    finally { setSaving(false); }
  };

  return (
    <SettingsSection icon={<Settings size={18} />} title="Info Organisasi">
      <div style={{ paddingTop: 12 }}>
        {editing ? (
          <>
            {[
              { label: "Nama Organisasi", val: namaOrg, set: setNamaOrg, placeholder: "cth: PAM Desa Karang Sengon" },
              { label: "Nama Desa", val: desa, set: setDesa, placeholder: "cth: Karang Sengon" },
              { label: "Kecamatan", val: kecamatan, set: setKecamatan, placeholder: "cth: Banyuputih" },
            ].map((f) => (
              <div key={f.label} style={{ marginBottom: 10 }}>
                <label className="section-label">{f.label}</label>
                <input className="input-field" value={f.val} onChange={(e) => f.set(e.target.value)} placeholder={f.placeholder} />
              </div>
            ))}
            <div className="row-8">
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setEditing(false)} disabled={saving}>Batal</button>
              <button className="btn-primary" style={{ flex: 2 }} onClick={handleSave} disabled={saving}>
                <Save size={15} style={{ marginRight: 6 }} />
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </>
        ) : (
          <>
            {[
              { label: "Nama Organisasi", val: settings.namaOrganisasi || "-" },
              { label: "Desa", val: settings.desa || "-" },
              { label: "Kecamatan", val: settings.kecamatan || "-" },
            ].map((item) => (
              <div key={item.label} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 13, color: "var(--color-txt3)" }}>{item.label}</div>
                <div style={{ fontSize: 15, color: "var(--color-txt)", fontWeight: 500 }}>{item.val}</div>
              </div>
            ))}
            <button className="btn-secondary" style={{ width: "100%" }} onClick={() => setEditing(true)}>
              <Edit2 size={15} style={{ marginRight: 6 }} /> Ubah Info
            </button>
          </>
        )}
      </div>
    </SettingsSection>
  );
}
