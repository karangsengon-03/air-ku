"use client";
/**
 * SettingsSections.tsx — Sections tersisa setelah #16c refactor:
 *   AccountsSection, BackupSection, InfoAppSection, LogoutSection
 * ModeTunggakanSection → ModeTunggakanSection.tsx
 * InfoOrganisasiSection → InfoOrganisasiSection.tsx
 */
import { useState, useEffect, useRef } from "react";
import { UserCog, Info, Download, Upload, LogOut, Hash } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { getRoles, exportBackup, importBackup, BackupData, saveActivityLog, updateSettings } from "@/lib/db";
import { formatTanggal, formatNomorSambungan } from "@/lib/helpers";
import { maskEmail } from "@/lib/masking";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { APP_NAME, APP_VERSION } from "@/lib/constants";
import { UserRole } from "@/types";
import { toast } from "@/lib/toast";
import SettingsSection from "./SettingsSection";

// Re-export dari file baru agar import lama (SettingsView) tetap valid
export { default as ModeTunggakanSection } from "./ModeTunggakanSection";
export { default as InfoOrganisasiSection } from "./InfoOrganisasiSection";

// ── AccountsSection ───────────────────────────────────────────────────────────

export function AccountsSection() {
  const { userRole } = useAppStore();
  const [accounts, setAccounts] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRoles().then(setAccounts).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <SettingsSection icon={<UserCog size={18} />} title="Akun Pengguna">
      <div style={{ paddingTop: 12 }}>
        {loading ? (
          <p style={{ fontSize: 13, color: "var(--color-txt3)" }}>Memuat...</p>
        ) : accounts.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--color-txt3)" }}>Belum ada akun terdaftar.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {accounts.map((a) => (
              <div key={a.email} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 12px", borderRadius: 8, background: "var(--color-bg)",
                border: a.email === userRole?.email ? "1.5px solid var(--color-primary)" : "1px solid var(--color-border)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <UserCog size={15} style={{ color: "var(--color-txt3)", flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-txt)" }}>
                      {maskEmail(a.email)}
                      {a.email === userRole?.email && (
                        <span style={{ marginLeft: 6, fontSize: 13, color: "var(--color-primary)", fontWeight: 700 }}>KAMU</span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--color-txt3)", marginTop: 1 }}>
                      {a.role} · Bergabung: {formatTanggal(a.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div style={{ marginTop: 12, fontSize: 13, color: "var(--color-txt3)" }}>
          Untuk tambah/hapus akun, hubungi pengembang atau edit langsung di Firebase Console.
        </div>
      </div>
    </SettingsSection>
  );
}

// ── BackupSection ─────────────────────────────────────────────────────────────

export function BackupSection({ showConfirm }: {
  showConfirm: (title: string, msg: string, onConfirm: () => void, destructive?: boolean) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const data = await exportBackup();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const tanggal = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      a.href = url;
      a.download = `airku-backup-${tanggal}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Backup berhasil diunduh.");
    } catch { toast.error("Gagal membuat backup"); }
    finally { setExportLoading(false); }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as BackupData;
        if (!data.version || !data.members || !data.tagihan) { toast.error("File backup tidak valid"); return; }
        const totalDocs = (data.members?.length ?? 0) + (data.tagihan?.length ?? 0) + (data.operasional?.length ?? 0);
        showConfirm(
          "Konfirmasi Import Backup",
          `Import ${totalDocs} dokumen?\nData yang sudah ada akan ditimpa jika ID sama.`,
          async () => {
            setImportLoading(true);
            try { await importBackup(data); toast.success(`Import selesai — ${totalDocs} dokumen dipulihkan`); }
            catch { toast.error("Gagal mengimpor backup"); }
            finally { setImportLoading(false); }
          }
        );
      } catch { toast.error("File tidak dapat dibaca. Pastikan file backup yang benar."); }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <SettingsSection icon={<Download size={18} />} title="Backup & Restore">
      <div style={{ paddingTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
        <button className="btn-secondary" onClick={handleExport} disabled={exportLoading} style={{ width: "100%" }}>
          <Download size={15} style={{ marginRight: 6 }} />
          {exportLoading ? "Mengekspor..." : "Export Backup"}
        </button>
        <button className="btn-secondary" onClick={() => fileRef.current?.click()} disabled={importLoading} style={{ width: "100%" }}>
          <Upload size={15} style={{ marginRight: 6 }} />
          {importLoading ? "Mengimpor..." : "Import Backup"}
        </button>
        <input ref={fileRef} type="file" accept=".json" style={{ display: "none" }} onChange={handleImport} />
        <div style={{ fontSize: 13, color: "var(--color-txt3)", marginTop: 4 }}>
          File backup tersimpan sebagai JSON. Simpan di tempat aman.
        </div>
      </div>
    </SettingsSection>
  );
}

// ── InfoAppSection ────────────────────────────────────────────────────────────

export function InfoAppSection() {
  return (
    <SettingsSection icon={<Info size={18} />} title="Tentang Aplikasi">
      <div style={{ paddingTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
        {[
          { label: "Nama Aplikasi", val: APP_NAME },
          { label: "Versi", val: APP_VERSION },
          { label: "Platform", val: "Progressive Web App (PWA)" },
          { label: "Database", val: "Firebase Firestore" },
        ].map((item) => (
          <div key={item.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: "var(--color-txt3)" }}>{item.label}</span>
            <span style={{ color: "var(--color-txt)", fontWeight: 500 }}>{item.val}</span>
          </div>
        ))}
      </div>
    </SettingsSection>
  );
}

// ── LogoutSection ─────────────────────────────────────────────────────────────

export function AlokasiNomorSection({ showConfirm }: { showConfirm: (title: string, msg: string, fn: () => void, danger?: boolean) => void }) {
  const { settings, members, userRole } = useAppStore();
  const nomorAkhirCurrent = settings.nomorSambunganAkhir ?? 100;
  const [inputAkhir, setInputAkhir] = useState(String(nomorAkhirCurrent));
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInputAkhir(String(nomorAkhirCurrent));
    }
  }, [nomorAkhirCurrent, editing]);

  const nomorTerpakai = members.map((m) => m.nomorSambungan);
  const nomorAktifTerbesar = nomorTerpakai.reduce((max, n) => {
    const num = parseInt(n.replace(/\D/g, "")) || 0;
    return Math.max(max, num);
  }, 0);

  const handleSave = () => {
    const val = parseInt(inputAkhir);
    if (isNaN(val) || val < 1) { toast.error("Masukkan angka yang valid"); return; }
    if (val < nomorAktifTerbesar) {
      toast.error(`Tidak bisa dikurangi — nomor ${formatNomorSambungan(nomorAktifTerbesar, val)} sudah terpakai. Nilai minimal: ${nomorAktifTerbesar}`);
      return;
    }
    showConfirm(
      "Ubah Alokasi Nomor",
      `Alokasi nomor sambungan akan diubah menjadi 001–${formatNomorSambungan(val, val)}.\nData pelanggan yang sudah ada tidak terpengaruh.`,
      async () => {
        setSaving(true);
        try {
          await updateSettings({ nomorSambunganAkhir: val });
          await saveActivityLog("ubah_alokasi_nomor",
            `Alokasi nomor sambungan diubah: 001–${formatNomorSambungan(val, val)}`,
            userRole?.email ?? "", userRole?.role ?? "");
          toast.success(`Alokasi nomor diperbarui: 001–${formatNomorSambungan(val, val)}`);
          setEditing(false);
        } catch { toast.error("Gagal menyimpan"); }
        finally { setSaving(false); }
      }
    );
  };

  return (
    <SettingsSection icon={<Hash size={18} />} title="Alokasi Nomor Sambungan">
      <div style={{ paddingTop: 12 }}>
        {/* Info saat ini */}
        <div style={{ background: "var(--color-bg)", borderRadius: 10, padding: "14px 16px", marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: "var(--color-txt2)" }}>Range aktif</span>
            <span className="mono" style={{ fontSize: 15, fontWeight: 700, color: "var(--color-txt)" }}>
              001 – {formatNomorSambungan(nomorAkhirCurrent, nomorAkhirCurrent)}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: "var(--color-txt2)" }}>Total slot</span>
            <span className="mono" style={{ fontSize: 13, fontWeight: 600, color: "var(--color-txt3)" }}>
              {nomorAkhirCurrent} nomor
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, color: "var(--color-txt2)" }}>Sudah terpakai</span>
            <span className="mono" style={{ fontSize: 13, fontWeight: 600, color: "var(--color-primary)" }}>
              {nomorTerpakai.length} nomor
            </span>
          </div>
        </div>

        {editing ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <label className="section-label">Nomor Akhir</label>
              <input
                className="input-field mono"
                type="number"
                inputMode="numeric"
                value={inputAkhir}
                min={nomorAktifTerbesar}
                onChange={(e) => setInputAkhir(e.target.value)}
                placeholder={`Min: ${nomorAktifTerbesar}`}
              />
              <p style={{ fontSize: 13, color: "var(--color-txt3)", marginTop: 4, lineHeight: 1.5 }}>
                Nomor terbesar yang sudah terpakai: <span className="mono" style={{ fontWeight: 700 }}>
                  {nomorAktifTerbesar > 0 ? formatNomorSambungan(nomorAktifTerbesar, parseInt(inputAkhir) || nomorAkhirCurrent) : "—"}
                </span>. Nilai minimal harus ≥ {nomorAktifTerbesar || 1}.
              </p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-secondary" style={{ flex: 1, height: 48 }}
                onClick={() => setEditing(false)} disabled={saving}>Batal</button>
              <button className="btn-primary" style={{ flex: 2, height: 48 }}
                onClick={handleSave} disabled={saving}>
                {saving ? "Menyimpan..." : "Simpan Alokasi"}
              </button>
            </div>
          </div>
        ) : (
          <button className="btn-secondary" style={{ width: "100%", height: 48 }}
            onClick={() => setEditing(true)}>
            <Hash size={15} /> Ubah Alokasi Nomor
          </button>
        )}
      </div>
    </SettingsSection>
  );
}

export function LogoutSection({ showConfirm }: {
  showConfirm: (title: string, msg: string, onConfirm: () => void, destructive?: boolean) => void;
}) {
  const { userRole } = useAppStore();

  const handleLogout = () => {
    showConfirm(
      "Keluar",
      "Yakin ingin keluar? Kamu harus login lagi untuk mengakses aplikasi.",
      async () => {
        try {
          if (userRole?.email) {
            await saveActivityLog("logout", `Logout: ${userRole.email}`, userRole.email, userRole.role);
          }
          await signOut(auth);
        } catch (e) { console.error(e); }
      },
      true
    );
  };

  return (
    <div style={{ padding: "12px 16px 28px" }}>
      <button
        onClick={handleLogout}
        style={{
          width: "100%", height: 52, borderRadius: 10,
          border: "1.5px solid var(--color-belum)",
          background: "rgba(185,28,28,0.06)",
          color: "var(--color-belum)", cursor: "pointer",
          fontSize: 15, fontWeight: 700,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}
      >
        <LogOut size={18} />
        Keluar
      </button>
    </div>
  );
}
