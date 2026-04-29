"use client";
// ─── ModeTunggakanSection ─────────────────────────────────────────────────────
import { useState, useEffect, useRef } from "react";
import {
  AlertTriangle, ToggleLeft, ToggleRight, Settings, UserCog,
  Info, Download, Upload, LogOut, Users, Save, Edit2,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { updateSettings, getRoles, exportBackup, importBackup, BackupData, saveActivityLog } from "@/lib/db";
import { formatTanggal } from "@/lib/helpers";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { APP_NAME, APP_VERSION } from "@/lib/constants";
import { AppSettings, UserRole } from "@/types";
import SettingsSection from "./SettingsSection";

// ── ModeTunggakan ──────────────────────────────────────────────────────────────

export function ModeTunggakanSection({ settings, addToast }: {
  settings: AppSettings;
  addToast: (t: "success" | "error" | "info", m: string) => void;
}) {
  const [saving, setSaving] = useState(false);
  const isMandiri = settings.modeTunggakan === "mandiri";

  const toggle = async () => {
    const newMode = isMandiri ? "carryover" : "mandiri";
    setSaving(true);
    try {
      await updateSettings({ modeTunggakan: newMode });
      addToast("success", `Mode tunggakan: ${newMode === "mandiri" ? "Berdiri Sendiri" : "Carry-over"}`);
    } catch { addToast("error", "Gagal mengubah mode"); }
    finally { setSaving(false); }
  };

  return (
    <SettingsSection icon={<AlertTriangle size={18} />} title="Mode Tunggakan">
      <div style={{ paddingTop: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "var(--color-txt)" }}>
              {isMandiri ? "Berdiri Sendiri" : "Carry-over"}
            </div>
            <div style={{ fontSize: 13, color: "var(--color-txt3)", marginTop: 2 }}>
              {isMandiri ? "Setiap bulan dihitung terpisah" : "Tunggakan dijumlahkan ke tagihan berikutnya"}
            </div>
          </div>
          <button onClick={toggle} disabled={saving}
            style={{ background: "none", border: "none", cursor: "pointer", color: isMandiri ? "var(--color-txt3)" : "var(--color-primary)" }}>
            {isMandiri ? <ToggleLeft size={40} strokeWidth={1.5} /> : <ToggleRight size={40} strokeWidth={1.5} />}
          </button>
        </div>
        <div style={{ background: "var(--color-bg)", borderRadius: 8, padding: 12, fontSize: 13, color: "var(--color-txt3)" }}>
          <div style={{ marginBottom: 6, fontWeight: 600, color: "var(--color-txt2)" }}>Penjelasan mode:</div>
          <div style={{ marginBottom: 4 }}><strong>Berdiri Sendiri:</strong> Tunggakan tiap bulan ditampilkan terpisah.</div>
          <div><strong>Carry-over:</strong> Total semua tunggakan diakumulasikan dan ditagihkan sekaligus.</div>
        </div>
      </div>
    </SettingsSection>
  );
}

// ── InfoOrganisasi ────────────────────────────────────────────────────────────

export function InfoOrganisasiSection({ settings, addToast }: {
  settings: AppSettings;
  addToast: (t: "success" | "error" | "info", m: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [namaOrg, setNamaOrg] = useState(settings.namaOrganisasi);
  const [desa, setDesa] = useState(settings.desa);
  const [kecamatan, setKecamatan] = useState(settings.kecamatan);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editing) { setNamaOrg(settings.namaOrganisasi); setDesa(settings.desa); setKecamatan(settings.kecamatan); }
  }, [settings, editing]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings({ namaOrganisasi: namaOrg.trim(), desa: desa.trim(), kecamatan: kecamatan.trim() });
      addToast("success", "Info organisasi tersimpan");
      setEditing(false);
    } catch { addToast("error", "Gagal menyimpan"); }
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
                <div style={{ fontSize: 12, color: "var(--color-txt3)" }}>{item.label}</div>
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

// ── AccountsSection ───────────────────────────────────────────────────────────

export function AccountsSection() {
  const { userRole } = useAppStore();
  const [accounts, setAccounts] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRoles().then(setAccounts).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <SettingsSection icon={<UserCog size={18} />} title="Manajemen Akun">
      <div style={{ paddingTop: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-txt2)", marginBottom: 8 }}>Daftar Akun Terdaftar</div>
        {loading ? (
          <p style={{ fontSize: 13, color: "var(--color-txt3)" }}>Memuat...</p>
        ) : accounts.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--color-txt3)" }}>Belum ada akun.</p>
        ) : accounts.map((acc) => (
          <div key={acc.uid} style={{
            display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
            borderRadius: 8, background: "var(--color-bg)", marginBottom: 6,
            border: acc.uid === userRole?.uid ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
              background: acc.role === "admin" ? "rgba(3,105,161,0.12)" : "rgba(146,64,14,0.1)", flexShrink: 0,
            }}>
              <Users size={16} style={{ color: acc.role === "admin" ? "var(--color-primary)" : "var(--color-tunggakan)" }} />
            </div>
            <div className="flex-min">
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: "var(--color-txt)" }}>{acc.nama}</span>
                {acc.uid === userRole?.uid && (
                  <span style={{ fontSize: 10, background: "var(--color-primary)", color: "#fff", padding: "1px 6px", borderRadius: 10 }}>Anda</span>
                )}
              </div>
              <div style={{ fontSize: 12, color: "var(--color-txt3)", marginTop: 2 }}>{acc.email}</div>
            </div>
            <div style={{
              fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 20,
              background: acc.role === "admin" ? "rgba(3,105,161,0.12)" : "rgba(146,64,14,0.1)",
              color: acc.role === "admin" ? "var(--color-primary)" : "var(--color-tunggakan)",
            }}>
              {acc.role === "admin" ? "Admin" : "Penagih"}
            </div>
          </div>
        ))}
      </div>
    </SettingsSection>
  );
}

// ── BackupSection ────────────────────────────────────────────────────────────

export function BackupSection({ addToast, showConfirm }: {
  addToast: (t: "success" | "error" | "info", m: string) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void, danger?: boolean) => void;
}) {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await exportBackup();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `airku-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      addToast("success", "Backup berhasil diunduh");
    } catch { addToast("error", "Gagal membuat backup"); }
    finally { setExporting(false); }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as BackupData;
        if (!data.version || !data.members || !data.tagihan) { addToast("error", "File backup tidak valid"); return; }
        const totalDocs = data.members.length + data.tagihan.length +
          data.operasional.length + data.activityLog.length + data.hargaHistory.length;
        showConfirm("Konfirmasi Import Backup",
          `File backup berisi:\n• ${data.members.length} pelanggan\n• ${data.tagihan.length} tagihan\n• ${data.operasional.length} operasional\n• ${data.activityLog.length} log\n• ${data.hargaHistory.length} riwayat harga\n\nTotal ${totalDocs} dokumen.\n\nData yang sudah ada akan di-overwrite jika ID-nya sama. Lanjutkan?`,
          async () => {
            setImporting(true);
            try { await importBackup(data); addToast("success", `Import selesai — ${totalDocs} dokumen dipulihkan`); }
            catch { addToast("error", "Gagal mengimpor backup"); }
            finally { setImporting(false); }
          }, true);
      } catch { addToast("error", "File tidak dapat dibaca. Pastikan file backup yang benar."); }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <SettingsSection icon={<Download size={18} />} title="Backup & Restore Data">
      <div style={{ paddingTop: 14 }}>
        <div style={{ fontSize: 13, color: "var(--color-txt3)", marginBottom: 14, lineHeight: 1.6 }}>
          Backup mengunduh <strong>semua data</strong> dalam satu file JSON. Simpan di tempat aman.
        </div>
        <button className="btn-primary" style={{ width: "100%", marginBottom: 10 }} onClick={handleExport} disabled={exporting}>
          <Download size={16} style={{ marginRight: 8 }} />
          {exporting ? "Mengekspor..." : "Download Backup Sekarang"}
        </button>
        <button className="btn-secondary" style={{ width: "100%" }} onClick={() => fileRef.current?.click()} disabled={importing}>
          <Upload size={16} style={{ marginRight: 8 }} />
          {importing ? "Mengimpor..." : "Import dari File Backup"}
        </button>
        <input ref={fileRef} type="file" accept=".json" style={{ display: "none" }} onChange={handleFileSelect} />
        <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: "rgba(185,28,28,0.06)", border: "1px solid rgba(185,28,28,0.15)" }}>
          <div style={{ fontSize: 12, color: "var(--color-belum)", fontWeight: 700, marginBottom: 4 }}>Perhatian</div>
          <div style={{ fontSize: 12, color: "var(--color-txt3)", lineHeight: 1.6 }}>
            Import tidak menghapus data yang ada. Dokumen dengan ID sama akan ditimpa.
          </div>
        </div>
      </div>
    </SettingsSection>
  );
}

// ── InfoAppSection ─────────────────────────────────────────────────────────────

export function InfoAppSection() {
  const { settings } = useAppStore();
  const items = [
    { label: "Nama Aplikasi", val: APP_NAME },
    { label: "Versi Aplikasi", val: APP_VERSION },
    { label: "Versi Data", val: settings.versi || "1.0.0" },
    { label: "Firebase Project", val: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "-" },
    { label: "Auth Domain", val: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "-" },
  ];
  return (
    <SettingsSection icon={<Info size={18} />} title="Informasi Aplikasi">
      <div style={{ paddingTop: 12 }}>
        {items.map((item) => (
          <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--color-border)" }}>
            <span style={{ fontSize: 13, color: "var(--color-txt3)" }}>{item.label}</span>
            <span style={{ fontSize: 13, color: "var(--color-txt)", fontWeight: 600, fontFamily: "monospace", maxWidth: "60%", wordBreak: "break-all", textAlign: "right" }}>{item.val}</span>
          </div>
        ))}
        <div style={{ marginTop: 16, textAlign: "center" }}>
          <div style={{ fontSize: 13, color: "var(--color-txt3)" }}>{APP_NAME} — Sistem Iuran Air Desa</div>
          <div style={{ fontSize: 12, color: "var(--color-txt3)", marginTop: 4 }}>Dibuat untuk kemudahan pengelolaan PAM Desa</div>
        </div>
      </div>
    </SettingsSection>
  );
}

// ── LogoutSection ─────────────────────────────────────────────────────────────

const SAVED_EMAIL_KEY = "airku_saved_email";
const SAVED_PW_KEY = "airku_saved_pw";

export function LogoutSection({ showConfirm }: {
  showConfirm: (title: string, message: string, onConfirm: () => void, danger?: boolean) => void;
}) {
  const { userRole } = useAppStore();

  const handleLogout = () => {
    showConfirm("Keluar dari Aplikasi",
      `Yakin ingin keluar dari akun ${userRole?.email || ""}?\n\nEmail dan kata sandi akan tetap tersimpan untuk login berikutnya.`,
      async () => { await signOut(auth); });
  };

  const handleLogoutAndForget = () => {
    showConfirm("Keluar & Hapus Akun Tersimpan",
      "Email dan kata sandi tersimpan akan dihapus. Login berikutnya harus ketik manual.",
      async () => {
        localStorage.removeItem(SAVED_EMAIL_KEY);
        localStorage.removeItem(SAVED_PW_KEY);
        await signOut(auth);
      }, true);
  };

  return (
    <div style={{ padding: "16px 0 32px" }}>
      <div style={{ height: 1, background: "var(--color-border)", marginBottom: 20 }} />
      <div style={{ background: "var(--color-bg)", borderRadius: 10, padding: "12px 16px", marginBottom: 14, display: "flex", alignItems: "center", gap: 12, border: "1px solid var(--color-border)" }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(3,105,161,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Users size={18} style={{ color: "var(--color-primary)" }} />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--color-txt)" }}>{userRole?.nama || "Admin"}</div>
          <div style={{ fontSize: 12, color: "var(--color-txt3)" }}>{userRole?.email}</div>
        </div>
      </div>
      <button onClick={handleLogout}
        style={{ width: "100%", height: 52, borderRadius: 10, background: "none", border: "1.5px solid var(--color-border)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 15, fontWeight: 700, color: "var(--color-txt2)", marginBottom: 10 }}>
        <LogOut size={18} /> Keluar
      </button>
      <button onClick={handleLogoutAndForget}
        style={{ width: "100%", height: 44, borderRadius: 10, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "var(--color-txt3)" }}>
        Keluar &amp; hapus akun tersimpan
      </button>
    </div>
  );
}
