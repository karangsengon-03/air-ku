"use client";
import React from "react";
import { useState, useEffect, useRef } from "react";
import {
  Settings, ChevronDown, ChevronUp, Plus, Trash2, Edit2, Check, X,
  Download, Upload, Users, Info, AlertTriangle, Save, History,
  ToggleLeft, ToggleRight, MapPin, DollarSign, UserCog, LogOut,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { APP_NAME, APP_VERSION } from "@/lib/constants";
import { formatRp, formatTanggal } from "@/lib/helpers";
import { updateSettings, saveHargaHistory, getHargaHistoryList,
  getRoles, exportBackup, importBackup, BackupData,
} from "@/lib/db";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { saveActivityLog } from "@/lib/db";
import { AppSettings, HargaHistory, UserRole, BlokTarif } from "@/types";

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  icon, title, children, defaultOpen = false,
}: {
  icon: React.ReactNode; title: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card" style={{ marginBottom: 12, overflow: "hidden" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px", background: "none", border: "none", cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: "var(--color-primary)" }}>{icon}</span>
          <span style={{ fontWeight: 700, fontSize: 15, color: "var(--color-txt)" }}>{title}</span>
        </div>
        <span style={{ color: "var(--color-txt3)" }}>
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </span>
      </button>
      {open && (
        <div style={{ padding: "0 16px 16px", borderTop: "1px solid var(--color-border)" }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function SettingsView() {
  const { settings, userRole, addToast, showConfirm } = useAppStore();
  const isAdmin = userRole?.role === "admin";

  if (!isAdmin) {
    return (
      <div style={{ padding: "40px 16px", textAlign: "center" }}>
        <Settings size={40} style={{ color: "var(--color-txt3)", margin: "0 auto 12px" }} />
        <p style={{ color: "var(--color-txt3)" }}>Hanya admin yang dapat mengakses pengaturan.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <TarifSection settings={settings} userRole={userRole} addToast={addToast} showConfirm={showConfirm} />
      <DusunRTSection settings={settings} addToast={addToast} showConfirm={showConfirm} />
      <ModeTunggakanSection settings={settings} addToast={addToast} />
      <InfoOrganisasiSection settings={settings} addToast={addToast} />
      <AccountsSection />
      <BackupSection addToast={addToast} showConfirm={showConfirm} />
      <InfoAppSection />
      <LogoutSection showConfirm={showConfirm} />
    </div>
  );
}

// ─── Logout Section ───────────────────────────────────────────────────────────

const SAVED_EMAIL_KEY = "airku_saved_email";
const SAVED_PW_KEY = "airku_saved_pw";

function LogoutSection({ showConfirm }: {
  showConfirm: (title: string, message: string, onConfirm: () => void, danger?: boolean) => void;
}) {
  const { userRole } = useAppStore();

  const handleLogout = () => {
    showConfirm(
      "Keluar dari Aplikasi",
      `Yakin ingin keluar dari akun ${userRole?.email || ""}?\n\nEmail dan kata sandi akan tetap tersimpan untuk login berikutnya.`,
      async () => {
        // Simpan credential sebelum signOut agar tersedia saat login ulang
        // (localStorage tidak terhapus oleh signOut Firebase)
        await signOut(auth);
        // Tidak hapus localStorage — credential tetap untuk quick-login
      }
    );
  };

  const handleLogoutAndForget = () => {
    showConfirm(
      "Keluar & Hapus Akun Tersimpan",
      "Email dan kata sandi tersimpan akan dihapus. Login berikutnya harus ketik manual.",
      async () => {
        localStorage.removeItem(SAVED_EMAIL_KEY);
        localStorage.removeItem(SAVED_PW_KEY);
        await signOut(auth);
      },
      true
    );
  };

  return (
    <div style={{ padding: "16px 0 32px" }}>
      {/* Divider */}
      <div style={{ height: 1, background: "var(--color-border)", marginBottom: 20 }} />

      {/* Current user info */}
      <div style={{
        background: "var(--color-bg)", borderRadius: 10,
        padding: "12px 16px", marginBottom: 14,
        display: "flex", alignItems: "center", gap: 12,
        border: "1px solid var(--color-border)",
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          background: "rgba(3,105,161,0.12)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Users size={18} style={{ color: "var(--color-primary)" }} />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--color-txt)" }}>{userRole?.nama || "Admin"}</div>
          <div style={{ fontSize: 12, color: "var(--color-txt3)" }}>{userRole?.email}</div>
        </div>
      </div>

      {/* Keluar — tetap simpan credential */}
      <button
        onClick={handleLogout}
        style={{
          width: "100%", height: 52, borderRadius: 10,
          background: "none", border: "1.5px solid var(--color-border)",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          fontSize: 15, fontWeight: 700, color: "var(--color-txt2)", marginBottom: 10,
        }}
      >
        <LogOut size={18} /> Keluar
      </button>

      {/* Keluar & hapus akun tersimpan */}
      <button
        onClick={handleLogoutAndForget}
        style={{
          width: "100%", height: 44, borderRadius: 10,
          background: "none", border: "none",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          fontSize: 13, fontWeight: 600, color: "var(--color-txt3)",
        }}
      >
        Keluar &amp; hapus akun tersimpan
      </button>
    </div>
  );
}

// ─── Tarif ────────────────────────────────────────────────────────────────────

function TarifSection({ settings, userRole, addToast, showConfirm }: {
  settings: AppSettings;
  userRole: UserRole | null;
  addToast: (t: "success" | "error" | "info", m: string) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void, danger?: boolean) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [abonemen, setAbonemen] = useState(String(settings.abonemen));
  const [catatan, setCatatan] = useState("");
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<HargaHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const initBlok = () => {
    const src = settings.blokTarif && settings.blokTarif.length > 0
      ? settings.blokTarif
      : [{ batasAtas: settings.batasBlok, harga: settings.hargaBlok1 }, { batasAtas: null, harga: settings.hargaBlok2 }];
    return src.map((b) => ({ batasAtas: b.batasAtas !== null ? String(b.batasAtas) : "", harga: String(b.harga) }));
  };

  const [bloks, setBloks] = useState<{ batasAtas: string; harga: string }[]>(initBlok);

  useEffect(() => {
    if (!editing) { setAbonemen(String(settings.abonemen)); setBloks(initBlok()); }
  }, [settings, editing]);

  const updateBlok = (idx: number, field: "batasAtas" | "harga", val: string) => {
    setBloks((prev) => prev.map((b, i) => i === idx ? { ...b, [field]: val } : b));
  };

  const tambahBlok = () => {
    setBloks((prev) => {
      const copy = [...prev];
      const last = copy[copy.length - 1];
      const prevBatas = copy.length >= 2 ? (parseInt(copy[copy.length - 2].batasAtas) || 0) : 0;
      if (!last.batasAtas) copy[copy.length - 1] = { ...last, batasAtas: String(prevBatas + 10) };
      copy.push({ batasAtas: "", harga: "" });
      return copy;
    });
  };

  const hapusBlok = (idx: number) => {
    setBloks((prev) => {
      if (prev.length <= 2) { addToast("error", "Minimal 2 blok tarif"); return prev; }
      const copy = prev.filter((_, i) => i !== idx);
      copy[copy.length - 1] = { ...copy[copy.length - 1], batasAtas: "" };
      return copy;
    });
  };

  const handleSave = () => {
    const a = parseInt(abonemen) || 0;
    if (a <= 0) { addToast("error", "Abonemen harus lebih dari 0"); return; }
    for (let i = 0; i < bloks.length; i++) {
      const h = parseInt(bloks[i].harga) || 0;
      if (h <= 0) { addToast("error", `Harga blok ${i + 1} harus lebih dari 0`); return; }
      if (i < bloks.length - 1) {
        const batas = parseInt(bloks[i].batasAtas) || 0;
        if (batas <= 0) { addToast("error", `Batas atas blok ${i + 1} harus diisi`); return; }
        if (i > 0) {
          const prevBatas = parseInt(bloks[i - 1].batasAtas) || 0;
          if (batas <= prevBatas) { addToast("error", `Batas blok ${i + 1} harus lebih besar dari blok ${i}`); return; }
        }
      }
    }
    const blokTarif: BlokTarif[] = bloks.map((b, i) => ({
      batasAtas: i === bloks.length - 1 ? null : (parseInt(b.batasAtas) || 0),
      harga: parseInt(b.harga) || 0,
    }));
    const h1 = blokTarif[0].harga;
    const batas = (blokTarif[0].batasAtas as number) || 10;
    const h2 = blokTarif[1]?.harga || 0;
    showConfirm("Simpan Tarif Baru",
      "Perubahan tarif TIDAK mempengaruhi tagihan lama. Tagihan baru akan menggunakan tarif ini.",
      async () => {
        setSaving(true);
        try {
          await updateSettings({ abonemen: a, hargaBlok1: h1, batasBlok: batas, hargaBlok2: h2, blokTarif });
          await saveHargaHistory({
            abonemen: a, hargaBlok1: h1, batasBlok: batas, hargaBlok2: h2, blokTarif,
            catatan: catatan.trim() || `Perubahan tarif (${blokTarif.length} blok)`,
            diubahOleh: userRole?.email || "", tanggal: null,
          });
          const logDetail = blokTarif.map((b, i) =>
            `blok${i + 1}=${formatRp(b.harga)}/m\u00b3${b.batasAtas !== null ? `(s/d ${b.batasAtas}m\u00b3)` : "(∞)"}`
          ).join(", ");
          await saveActivityLog("ubah_tarif",
            `Tarif diubah: abonemen=${formatRp(a)}, ${logDetail}`,
            userRole?.email || "", userRole?.role || "");
          addToast("success", `Tarif ${blokTarif.length} blok berhasil disimpan`);
          setEditing(false); setCatatan("");
        } catch { addToast("error", "Gagal menyimpan tarif"); }
        finally { setSaving(false); }
      }
    );
  };

  const loadHistory = async () => {
    if (showHistory) { setShowHistory(false); return; }
    setLoadingHistory(true);
    try { const list = await getHargaHistoryList(); setHistory(list); setShowHistory(true); }
    catch { addToast("error", "Gagal memuat riwayat tarif"); }
    finally { setLoadingHistory(false); }
  };

  const displayBlok = settings.blokTarif && settings.blokTarif.length > 0
    ? settings.blokTarif
    : [{ batasAtas: settings.batasBlok, harga: settings.hargaBlok1 }, { batasAtas: null, harga: settings.hargaBlok2 }];

  return (
    <Section icon={<DollarSign size={18} />} title="Tarif Air" defaultOpen>
      <div style={{ paddingTop: 12 }}>
        {/* Current tariff display */}
        <div style={{ background: "var(--color-bg)", borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--color-txt3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Tarif Aktif</span>
            <span style={{ fontSize: 11, color: "var(--color-txt3)" }}>{displayBlok.length} Blok Pemakaian</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, paddingBottom: 8, borderBottom: "1px solid var(--color-border)" }}>
            <span style={{ fontSize: 13, color: "var(--color-txt2)" }}>Abonemen/bulan</span>
            <span className="mono" style={{ fontSize: 14, fontWeight: 700, color: "var(--color-txt)" }}>{formatRp(settings.abonemen)}</span>
          </div>
          {displayBlok.map((blok, idx) => {
            const prevBatas = idx > 0 ? (displayBlok[idx - 1].batasAtas as number) : 0;
            const rangeLabel = blok.batasAtas !== null ? `${prevBatas}–${blok.batasAtas} m³` : `> ${prevBatas} m³`;
            return (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-primary)" }}>Blok {idx + 1}</span>
                  <span style={{ fontSize: 12, color: "var(--color-txt3)", marginLeft: 8 }}>{rangeLabel}</span>
                </div>
                <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: "var(--color-txt)" }}>{formatRp(blok.harga)}/m³</span>
              </div>
            );
          })}
        </div>

        {/* Edit form */}
        {editing ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label className="section-label">Abonemen (Rp/bulan)</label>
              <input className="input-field mono" inputMode="numeric" value={abonemen}
                onChange={(e) => setAbonemen(e.target.value.replace(/\D/g, ""))} />
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <label className="section-label" style={{ margin: 0 }}>Blok Pemakaian</label>
                <button onClick={tambahBlok}
                  style={{ fontSize: 12, fontWeight: 700, color: "var(--color-primary)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                  <Plus size={14} /> Tambah Blok
                </button>
              </div>
              {bloks.map((blok, idx) => {
                const isLast = idx === bloks.length - 1;
                const prevBatas = idx > 0 ? (parseInt(bloks[idx - 1].batasAtas) || 0) : 0;
                return (
                  <div key={idx} style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", borderRadius: 10, padding: "12px 14px", marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-primary)" }}>Blok {idx + 1}</span>
                      {idx >= 2 && (
                        <button onClick={() => hapusBlok(idx)}
                          style={{ color: "var(--color-belum)", background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <div>
                        <label className="section-label">Dari (m³)</label>
                        <input className="input-field mono" value={idx === 0 ? "0" : String(prevBatas)} disabled
                          style={{ background: "var(--color-border)", fontSize: 14, height: 44 }} />
                      </div>
                      <div>
                        <label className="section-label">{isLast ? "Sampai (∞)" : "Sampai (m³)"}</label>
                        <input className="input-field mono" inputMode="numeric"
                          value={isLast ? "∞" : blok.batasAtas} disabled={isLast}
                          style={isLast ? { background: "var(--color-border)", fontSize: 14, height: 44 } : { fontSize: 14, height: 44 }}
                          onChange={(e) => updateBlok(idx, "batasAtas", e.target.value.replace(/\D/g, ""))}
                          placeholder="cth: 10" />
                      </div>
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <label className="section-label">Harga (Rp/m³)</label>
                      <input className="input-field mono" inputMode="numeric" value={blok.harga}
                        onChange={(e) => updateBlok(idx, "harga", e.target.value.replace(/\D/g, ""))}
                        placeholder="cth: 2000" />
                    </div>
                  </div>
                );
              })}
            </div>
            <div>
              <label className="section-label">Catatan Perubahan (opsional)</label>
              <input className="input-field" placeholder="cth: penyesuaian tarif 2026" value={catatan} onChange={(e) => setCatatan(e.target.value)} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-secondary" style={{ flex: 1, height: 48 }} onClick={() => setEditing(false)} disabled={saving}>Batal</button>
              <button className="btn-primary" style={{ flex: 2, height: 48 }} onClick={handleSave} disabled={saving}>
                {saving ? "Menyimpan..." : "Simpan Tarif"}
              </button>
            </div>
          </div>
        ) : (
          <button className="btn-secondary" style={{ width: "100%", height: 48 }} onClick={() => setEditing(true)}>
            <Edit2 size={15} /> Ubah Tarif
          </button>
        )}

        {/* History toggle */}
        <button
          onClick={loadHistory}
          style={{
            marginTop: 10, width: "100%", padding: "10px", background: "none",
            border: "none", cursor: "pointer", color: "var(--color-primary)",
            fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}
        >
          <History size={14} />
          {loadingHistory ? "Memuat..." : showHistory ? "Sembunyikan Riwayat" : "Lihat Riwayat Perubahan Tarif"}
        </button>

        {showHistory && (
          <div style={{ marginTop: 8, borderTop: "1px solid var(--color-border)", paddingTop: 10 }}>
            {history.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--color-txt3)", textAlign: "center" }}>Belum ada riwayat perubahan.</p>
            ) : history.map((h, i) => (
              <div key={h.id || i} style={{ padding: "10px 12px", borderRadius: 8, marginBottom: 6, background: "var(--color-bg)", border: "1px solid var(--color-border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: "var(--color-txt3)" }}>{formatTanggal(h.tanggal)}</span>
                  <span style={{ fontSize: 12, color: "var(--color-txt3)" }}>{h.diubahOleh}</span>
                </div>
                {h.blokTarif && h.blokTarif.length > 0 ? (
                  h.blokTarif.map((b, bi) => {
                    const prevB = bi > 0 ? h.blokTarif![bi-1].batasAtas : 0;
                    return (
                      <div key={bi} className="mono" style={{ fontSize: 12, color: "var(--color-txt2)" }}>
                        Blok {bi+1}: {formatRp(b.harga)}/m³ {b.batasAtas !== null ? `(${prevB}–${b.batasAtas}m³)` : `(>${prevB}m³)`}
                      </div>
                    );
                  })
                ) : (
                  <>
                    <div className="mono" style={{ fontSize: 13, color: "var(--color-txt)" }}>Abonemen: {formatRp(h.abonemen)} · Blok1: {formatRp(h.hargaBlok1)}/m³</div>
                    <div className="mono" style={{ fontSize: 13, color: "var(--color-txt2)" }}>Batas: {h.batasBlok}m³ · Blok2: {formatRp(h.hargaBlok2)}/m³</div>
                  </>
                )}
                {h.catatan && <div style={{ fontSize: 12, color: "var(--color-txt3)", marginTop: 4, fontStyle: "italic" }}>{h.catatan}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}

// ─── Dusun & RT ───────────────────────────────────────────────────────────────

// Modal dialog untuk tambah/edit Dusun atau RT
function ModalInput({
  title, placeholder, initialValue = "", onSave, onClose,
}: {
  title: string; placeholder: string; initialValue?: string;
  onSave: (val: string) => void; onClose: () => void;
}) {
  const [val, setVal] = React.useState(initialValue);

  const handleSave = () => {
    const trimmed = val.trim();
    if (!trimmed) return;
    onSave(trimmed);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(0,0,0,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "24px 20px",
        }}
      >
        {/* Card dialog — stopPropagation agar klik di dalam tidak tutup modal */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "var(--color-card)", borderRadius: 16, padding: 24,
            width: "100%", maxWidth: 360,
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            display: "flex", flexDirection: "column", gap: 16,
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 17, color: "var(--color-txt)" }}>{title}</div>
          <input
            className="input-field"
            type="text"
            inputMode="text"
            autoComplete="off"
            placeholder={placeholder}
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") onClose(); }}
            autoFocus
            style={{ fontSize: 16, height: 48 }}
          />
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn-secondary" style={{ flex: 1, height: 44 }} onClick={onClose}>
              Batal
            </button>
            <button
              className="btn-primary"
              style={{ flex: 2, height: 44 }}
              onClick={handleSave}
              disabled={!val.trim()}
            >
              Simpan
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function DusunRTSection({ settings, addToast, showConfirm }: {
  settings: AppSettings;
  addToast: (t: "success" | "error" | "info", m: string) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void, danger?: boolean) => void;
}) {
  // Modal state
  const [modal, setModal] = React.useState<{
    type: "tambah-dusun" | "edit-dusun" | "tambah-rt" | null;
    dusun?: string;
    initialValue?: string;
  }>({ type: null });

  const [expandedDusun, setExpandedDusun] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const dusunList = settings.dusunList || [];
  const rtPerDusun = settings.rtPerDusun || {};

  const save = async (data: Partial<typeof settings>) => {
    setSaving(true);
    try {
      await updateSettings(data);
      addToast("success", "Tersimpan");
    } catch {
      addToast("error", "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  const closeModal = () => setModal({ type: null });

  // ── Dusun handlers ──
  const tambahDusun = async (name: string) => {
    if (dusunList.includes(name)) { addToast("error", "Nama dusun sudah ada"); return; }
    const newList = [...dusunList, name].sort();
    await save({ dusunList: newList, rtPerDusun: { ...rtPerDusun, [name]: [] } });
    closeModal();
  };

  const editDusun = async (oldName: string, newName: string) => {
    if (newName === oldName) { closeModal(); return; }
    if (dusunList.includes(newName)) { addToast("error", "Nama dusun sudah ada"); return; }
    const newList = dusunList.map((d) => d === oldName ? newName : d).sort();
    const newRtPerDusun = { ...rtPerDusun };
    newRtPerDusun[newName] = newRtPerDusun[oldName] || [];
    delete newRtPerDusun[oldName];
    await save({ dusunList: newList, rtPerDusun: newRtPerDusun });
    if (expandedDusun === oldName) setExpandedDusun(newName);
    closeModal();
  };

  const hapusDusun = (name: string) => {
    showConfirm(
      "Hapus Dusun",
      `Hapus dusun "${name}" beserta semua RT-nya? Data pelanggan tidak terhapus.`,
      async () => {
        const newList = dusunList.filter((d) => d !== name);
        const newRtPerDusun = { ...rtPerDusun };
        delete newRtPerDusun[name];
        await save({ dusunList: newList, rtPerDusun: newRtPerDusun });
        if (expandedDusun === name) setExpandedDusun(null);
      },
      true
    );
  };

  // ── RT handlers ──
  const tambahRT = async (dusun: string, rt: string) => {
    const current = rtPerDusun[dusun] || [];
    if (current.includes(rt)) { addToast("error", "RT sudah ada"); return; }
    const newList = [...current, rt].sort((a, b) => a.localeCompare(b, "id", { numeric: true }));
    await save({ rtPerDusun: { ...rtPerDusun, [dusun]: newList } });
    closeModal();
  };

  const hapusRT = (dusun: string, rt: string) => {
    showConfirm("Hapus RT", `Hapus ${rt} dari ${dusun}?`, async () => {
      const newList = (rtPerDusun[dusun] || []).filter((r) => r !== rt);
      await save({ rtPerDusun: { ...rtPerDusun, [dusun]: newList } });
    }, true);
  };

  return (
    <>
      {/* Modal */}
      {modal.type === "tambah-dusun" && (
        <ModalInput
          title="Tambah Dusun Baru"
          placeholder="cth: Dusun Krajan, Dusun Timur..."
          onSave={tambahDusun}
          onClose={closeModal}
        />
      )}
      {modal.type === "edit-dusun" && modal.dusun && (
        <ModalInput
          title={`Edit Nama Dusun`}
          placeholder="Nama dusun baru..."
          initialValue={modal.initialValue || ""}
          onSave={(val) => editDusun(modal.dusun!, val)}
          onClose={closeModal}
        />
      )}
      {modal.type === "tambah-rt" && modal.dusun && (
        <ModalInput
          title={`Tambah RT — ${modal.dusun}`}
          placeholder="cth: 001, 002, RT 01..."
          onSave={(val) => tambahRT(modal.dusun!, val)}
          onClose={closeModal}
        />
      )}

      <Section icon={<MapPin size={18} />} title="Dusun & RT">
        <div style={{ paddingTop: 12 }}>
          {/* Tombol tambah dusun */}
          <button
            className="btn-primary"
            style={{ width: "100%", marginBottom: 14, height: 44, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            onClick={() => setModal({ type: "tambah-dusun" })}
            disabled={saving}
          >
            <Plus size={16} /> Tambah Dusun Baru
          </button>

          {dusunList.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--color-txt3)", textAlign: "center", padding: "8px 0" }}>
              Belum ada dusun. Klik tombol di atas untuk menambah.
            </p>
          ) : dusunList.map((dusun) => (
            <div key={dusun} style={{ marginBottom: 8, border: "1px solid var(--color-border)", borderRadius: 10, overflow: "hidden" }}>
              {/* Dusun row */}
              <div style={{ display: "flex", alignItems: "center", padding: "12px 14px", background: "var(--color-bg)", gap: 6 }}>
                <button
                  onClick={() => setExpandedDusun(expandedDusun === dusun ? null : dusun)}
                  style={{
                    flex: 1, textAlign: "left", background: "none", border: "none", cursor: "pointer",
                    fontSize: 14, fontWeight: 700, color: "var(--color-txt)",
                    display: "flex", alignItems: "center", gap: 8,
                  }}
                >
                  <MapPin size={14} style={{ color: "var(--color-primary)", flexShrink: 0 }} />
                  <span>{dusun}</span>
                  <span style={{ fontSize: 12, color: "var(--color-txt3)", fontWeight: 400 }}>
                    ({(rtPerDusun[dusun] || []).length} RT)
                  </span>
                  {expandedDusun === dusun
                    ? <ChevronUp size={14} style={{ marginLeft: "auto", color: "var(--color-txt3)" }} />
                    : <ChevronDown size={14} style={{ marginLeft: "auto", color: "var(--color-txt3)" }} />}
                </button>
                <button
                  onClick={() => setModal({ type: "edit-dusun", dusun, initialValue: dusun })}
                  style={{ color: "var(--color-primary)", background: "none", border: "none", cursor: "pointer", padding: "6px 8px" }}
                  title="Edit nama dusun"
                >
                  <Edit2 size={15} />
                </button>
                <button
                  onClick={() => hapusDusun(dusun)}
                  style={{ color: "var(--color-belum)", background: "none", border: "none", cursor: "pointer", padding: "6px 8px" }}
                  title="Hapus dusun"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              {/* RT list */}
              {expandedDusun === dusun && (
                <div style={{ padding: "14px 14px", background: "var(--color-card)", borderTop: "1px solid var(--color-border)" }}>
                  {(rtPerDusun[dusun] || []).length === 0 ? (
                    <p style={{ fontSize: 12, color: "var(--color-txt3)", marginBottom: 12, textAlign: "center" }}>
                      Belum ada RT di dusun ini.
                    </p>
                  ) : (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                      {(rtPerDusun[dusun] || []).map((rt) => (
                        <div key={rt} style={{
                          display: "flex", alignItems: "center", gap: 6,
                          padding: "6px 12px", borderRadius: 20,
                          background: "var(--color-bg)", border: "1px solid var(--color-border)",
                          fontSize: 13, fontWeight: 600,
                        }}>
                          <span style={{ color: "var(--color-txt)" }}>{rt}</span>
                          <button
                            onClick={() => hapusRT(dusun, rt)}
                            style={{ color: "var(--color-belum)", background: "none", border: "none", cursor: "pointer", padding: 2, lineHeight: 0, display: "flex", alignItems: "center" }}
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    className="btn-secondary"
                    style={{ width: "100%", height: 40, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 13 }}
                    onClick={() => setModal({ type: "tambah-rt", dusun })}
                    disabled={saving}
                  >
                    <Plus size={14} /> Tambah RT di {dusun}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}

// ─── Mode Tunggakan ───────────────────────────────────────────────────────────

function ModeTunggakanSection({ settings, addToast }: {
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
    } catch {
      addToast("error", "Gagal mengubah mode");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Section icon={<AlertTriangle size={18} />} title="Mode Tunggakan">
      <div style={{ paddingTop: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "var(--color-txt)" }}>
              {isMandiri ? "Berdiri Sendiri" : "Carry-over"}
            </div>
            <div style={{ fontSize: 13, color: "var(--color-txt3)", marginTop: 2 }}>
              {isMandiri
                ? "Setiap bulan dihitung terpisah"
                : "Tunggakan dijumlahkan ke tagihan berikutnya"}
            </div>
          </div>
          <button
            onClick={toggle}
            disabled={saving}
            style={{ background: "none", border: "none", cursor: "pointer", color: isMandiri ? "var(--color-txt3)" : "var(--color-primary)" }}
          >
            {isMandiri
              ? <ToggleLeft size={40} strokeWidth={1.5} />
              : <ToggleRight size={40} strokeWidth={1.5} />}
          </button>
        </div>

        <div style={{ background: "var(--color-bg)", borderRadius: 8, padding: 12, fontSize: 13, color: "var(--color-txt3)" }}>
          <div style={{ marginBottom: 6, fontWeight: 600, color: "var(--color-txt2)" }}>Penjelasan mode:</div>
          <div style={{ marginBottom: 4 }}>
            <strong>Berdiri Sendiri:</strong> Tunggakan tiap bulan ditampilkan terpisah. Pelanggan bisa bayar per bulan yang dipilih.
          </div>
          <div>
            <strong>Carry-over:</strong> Total semua tunggakan diakumulasikan dan ditagihkan sekaligus di bulan berikutnya.
          </div>
        </div>
      </div>
    </Section>
  );
}

// ─── Info Organisasi ──────────────────────────────────────────────────────────

function InfoOrganisasiSection({ settings, addToast }: {
  settings: AppSettings;
  addToast: (t: "success" | "error" | "info", m: string) => void;
}) {
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
      await updateSettings({
        namaOrganisasi: namaOrg.trim(),
        desa: desa.trim(),
        kecamatan: kecamatan.trim(),
      });
      addToast("success", "Info organisasi tersimpan");
      setEditing(false);
    } catch {
      addToast("error", "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Section icon={<Settings size={18} />} title="Info Organisasi">
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
            <div style={{ display: "flex", gap: 8 }}>
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
    </Section>
  );
}

// ─── Manajemen Akun ───────────────────────────────────────────────────────────

function AccountsSection() {
  const { userRole } = useAppStore();
  const [accounts, setAccounts] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRoles()
      .then(setAccounts)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Section icon={<UserCog size={18} />} title="Manajemen Akun">
      <div style={{ paddingTop: 12 }}>
        {/* Daftar akun */}
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-txt2)", marginBottom: 8 }}>
          Daftar Akun Terdaftar
        </div>
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
              background: acc.role === "admin" ? "rgba(3,105,161,0.12)" : "rgba(146,64,14,0.1)",
              flexShrink: 0,
            }}>
              <Users size={16} style={{ color: acc.role === "admin" ? "var(--color-primary)" : "var(--color-tunggakan)" }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
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
    </Section>
  );
}

// ─── Backup & Restore ─────────────────────────────────────────────────────────

function BackupSection({ addToast, showConfirm }: {
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
      const date = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `airku-backup-${date}.json`;
      a.click();
      URL.revokeObjectURL(url);
      addToast("success", "Backup berhasil diunduh");
    } catch {
      addToast("error", "Gagal membuat backup");
    } finally {
      setExporting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as BackupData;
        if (!data.version || !data.members || !data.tagihan) {
          addToast("error", "File backup tidak valid");
          return;
        }
        const totalDocs = data.members.length + data.tagihan.length +
          data.operasional.length + data.activityLog.length + data.hargaHistory.length;

        showConfirm(
          "Konfirmasi Import Backup",
          `File backup berisi:\n• ${data.members.length} pelanggan\n• ${data.tagihan.length} tagihan\n• ${data.operasional.length} operasional\n• ${data.activityLog.length} log\n• ${data.hargaHistory.length} riwayat harga\n\nTotal ${totalDocs} dokumen.\n\nData yang sudah ada akan di-overwrite jika ID-nya sama. Lanjutkan?`,
          async () => {
            setImporting(true);
            try {
              await importBackup(data);
              addToast("success", `Import selesai — ${totalDocs} dokumen dipulihkan`);
            } catch {
              addToast("error", "Gagal mengimpor backup");
            } finally {
              setImporting(false);
            }
          },
          true
        );
      } catch {
        addToast("error", "File tidak dapat dibaca. Pastikan file backup yang benar.");
      }
    };
    reader.readAsText(file);
    // reset input
    e.target.value = "";
  };

  return (
    <Section icon={<Download size={18} />} title="Backup & Restore Data">
      <div style={{ paddingTop: 14 }}>
        <div style={{ fontSize: 13, color: "var(--color-txt3)", marginBottom: 14, lineHeight: 1.6 }}>
          Backup mengunduh <strong>semua data</strong> (pelanggan, tagihan, operasional, log, riwayat harga, pengaturan) dalam satu file JSON. Simpan di tempat aman.
        </div>

        <button className="btn-primary" style={{ width: "100%", marginBottom: 10 }} onClick={handleExport} disabled={exporting}>
          <Download size={16} style={{ marginRight: 8 }} />
          {exporting ? "Mengekspor..." : "Download Backup Sekarang"}
        </button>

        <button
          className="btn-secondary"
          style={{ width: "100%" }}
          onClick={() => fileRef.current?.click()}
          disabled={importing}
        >
          <Upload size={16} style={{ marginRight: 8 }} />
          {importing ? "Mengimpor..." : "Import dari File Backup"}
        </button>
        <input ref={fileRef} type="file" accept=".json" style={{ display: "none" }} onChange={handleFileSelect} />

        <div style={{
          marginTop: 12, padding: 10, borderRadius: 8,
          background: "rgba(185,28,28,0.06)", border: "1px solid rgba(185,28,28,0.15)",
        }}>
          <div style={{ fontSize: 12, color: "var(--color-belum)", fontWeight: 700, marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}><span>Perhatian</span></div>
          <div style={{ fontSize: 12, color: "var(--color-txt3)", lineHeight: 1.6 }}>
            Import tidak menghapus data yang ada terlebih dahulu. Dokumen dengan ID yang sama akan ditimpa.
            Lakukan backup sebelum import untuk keamanan.
          </div>
        </div>
      </div>
    </Section>
  );
}

// ─── Info App ─────────────────────────────────────────────────────────────────

function InfoAppSection() {
  const { settings } = useAppStore();
  const items = [
    { label: "Nama Aplikasi", val: APP_NAME },
    { label: "Versi Aplikasi", val: APP_VERSION },
    { label: "Versi Data", val: settings.versi || "1.0.0" },
    { label: "Firebase Project", val: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "-" },
    { label: "Auth Domain", val: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "-" },
  ];

  return (
    <Section icon={<Info size={18} />} title="Informasi Aplikasi">
      <div style={{ paddingTop: 12 }}>
        {items.map((item) => (
          <div key={item.label} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "8px 0", borderBottom: "1px solid var(--color-border)",
          }}>
            <span style={{ fontSize: 13, color: "var(--color-txt3)" }}>{item.label}</span>
            <span style={{ fontSize: 13, color: "var(--color-txt)", fontWeight: 600, fontFamily: "monospace", maxWidth: "60%", wordBreak: "break-all", textAlign: "right" }}>{item.val}</span>
          </div>
        ))}
        <div style={{ marginTop: 16, textAlign: "center" }}>
          
          <div style={{ fontSize: 13, color: "var(--color-txt3)" }}>
            {APP_NAME} — Sistem Iuran Air Desa
          </div>
          <div style={{ fontSize: 12, color: "var(--color-txt3)", marginTop: 4 }}>
            Dibuat untuk kemudahan pengelolaan PAM Desa
          </div>
        </div>
      </div>
    </Section>
  );
}