"use client";
import { useState } from "react";
import { Sun, Moon, Lock, Unlock, Wifi, WifiOff, ChevronDown, LogOut, Droplets } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { toast } from "@/lib/toast";
import { APP_NAME, APP_VERSION, DESA_INFO, YEARS, MONTHS } from "@/lib/constants";
import { doc, updateDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { maskEmail } from "@/lib/masking";

const SAVED_EMAIL_KEY = "airku_saved_email";
const SAVED_PW_KEY = "airku_saved_pw";

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const {
    darkMode, toggleDarkMode, settings, isOnline,
    showConfirm, userRole,
    activeBulan, activeTahun, setActiveBulanTahun,
  } = useAppStore();

  const [showPicker, setShowPicker] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const orgName = settings.namaOrganisasi || DESA_INFO.nama;

  const handleLockToggle = () => {
    const willLock = !settings.globalLock;
    showConfirm(
      willLock ? "Kunci Aplikasi?" : "Buka Kunci Aplikasi?",
      willLock
        ? "Semua pengguna tidak bisa mengubah data selama aplikasi dikunci."
        : "Semua pengguna bisa kembali mengubah data.",
      async () => {
        try {
          await updateDoc(doc(db, "settings", "main"), { globalLock: willLock });
          toast.success(willLock ? "Aplikasi berhasil dikunci." : "Kunci dibuka.");
        } catch {
          toast.error("Gagal mengubah status kunci.");
        }
      }
    );
  };

  const handleLogout = () => {
    setShowUserMenu(false);
    showConfirm(
      "Keluar dari Aplikasi",
      `Yakin ingin keluar dari akun ${userRole?.email || ""}?\nEmail dan kata sandi akan tetap tersimpan.`,
      async () => { await signOut(auth); }
    );
  };

  const handleLogoutForget = () => {
    setShowUserMenu(false);
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
    <header style={{
      background: "var(--color-card)",
      borderBottom: "1px solid var(--color-border)",
      padding: "0 12px",
      position: "sticky", top: 0, zIndex: 40,
    }}>
      {/* Baris 1: app name + ikon aksi */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 48 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Droplets size={18} style={{ color: "var(--color-primary)", flexShrink: 0 }} />
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: "var(--color-primary)" }}>{APP_NAME}</span>
              {/* #33 Fix: version 10px → 13px */}
              <span style={{ fontSize: 13, color: "var(--color-txt3)", fontWeight: 500 }}>v{APP_VERSION}</span>
            </div>
            {/* #2 Fix: orgName 11px → 13px */}
            <div style={{ fontSize: 13, color: "var(--color-txt3)", fontWeight: 500, marginTop: -1 }}>{orgName}</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
          {/* Online indicator */}
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", padding: "4px 6px",
            color: isOnline ? "var(--color-lunas)" : "var(--color-belum)",
          }}>
            {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
            {/* #2 Fix: 9px → 13px */}
            <span style={{ fontSize: 13, fontWeight: 700, marginTop: 1 }}>{isOnline ? "Online" : "Offline"}</span>
          </div>

          {/* Kunci — admin only */}
          {userRole?.role === "admin" && (
            <button onClick={handleLockToggle} aria-label={settings.globalLock ? "Buka kunci aplikasi" : "Kunci aplikasi"} style={{
              display: "flex", flexDirection: "column", alignItems: "center", padding: "4px 6px",
              background: "none", border: "none", cursor: "pointer",
              color: settings.globalLock ? "var(--color-belum)" : "var(--color-txt3)",
            }}>
              {settings.globalLock ? <Lock size={16} /> : <Unlock size={16} />}
              {/* #2 Fix: 9px → 13px */}
              <span style={{ fontSize: 13, fontWeight: 700, marginTop: 1 }}>
                {settings.globalLock ? "Terkunci" : "Kunci"}
              </span>
            </button>
          )}

          {/* Gelap/Terang */}
          <button onClick={toggleDarkMode} aria-label={darkMode ? "Aktifkan mode terang" : "Aktifkan mode gelap"} style={{
            display: "flex", flexDirection: "column", alignItems: "center", padding: "4px 6px",
            background: "none", border: "none", cursor: "pointer", color: "var(--color-txt3)",
          }}>
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            {/* #2 Fix: 9px → 13px */}
            <span style={{ fontSize: 13, fontWeight: 700, marginTop: 1 }}>{darkMode ? "Terang" : "Gelap"}</span>
          </button>

          {/* Keluar — semua role */}
          {userRole && (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowUserMenu((v) => !v)}
                aria-label="Menu akun pengguna"
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", padding: "4px 6px",
                  background: "none", border: "none", cursor: "pointer", color: "var(--color-txt3)",
                }}
              >
                <LogOut size={16} />
                {/* #2 Fix: 9px → 13px */}
                <span style={{ fontSize: 13, fontWeight: 700, marginTop: 1 }}>Keluar</span>
              </button>

              {showUserMenu && (
                <>
                  <div style={{ position: "fixed", inset: 0, zIndex: 100 }} onClick={() => setShowUserMenu(false)} />
                  <div style={{
                    position: "absolute", right: 0, top: "calc(100% + 6px)",
                    background: "var(--color-card)", border: "1px solid var(--color-border)",
                    borderRadius: 16, zIndex: 101, boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
                    padding: 10, minWidth: 220,
                  }}>
                    {/* Info akun */}
                    <div style={{ padding: "6px 10px 10px", borderBottom: "1px solid var(--color-border)", marginBottom: 6 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-txt)" }}>{userRole.nama}</div>
                      {/* #2 Fix: email 11px → 13px | #6 Fix: maskEmail */}
                      <div style={{ fontSize: 13, color: "var(--color-txt3)", marginTop: 2 }}>{maskEmail(userRole.email)}</div>
                      {/* #2 Fix: role badge 10px → 13px */}
                      <div style={{
                        display: "inline-block", marginTop: 4, fontSize: 13, fontWeight: 700,
                        padding: "2px 8px", borderRadius: 20,
                        background: userRole.role === "admin" ? "rgba(3,105,161,0.12)" : "rgba(21,128,61,0.12)",
                        color: userRole.role === "admin" ? "var(--color-primary)" : "var(--color-lunas)",
                      }}>
                        {userRole.role === "admin" ? "Admin" : "Penagih"}
                      </div>
                    </div>
                    <button onClick={handleLogout} style={{
                      width: "100%", padding: "10px 12px", borderRadius: 8, border: "none",
                      background: "none", cursor: "pointer", textAlign: "left",
                      fontSize: 13, fontWeight: 600, color: "var(--color-txt2)",
                      display: "flex", alignItems: "center", gap: 8,
                    }}>
                      <LogOut size={15} /> Keluar
                    </button>
                    <button onClick={handleLogoutForget} style={{
                      width: "100%", padding: "8px 12px", borderRadius: 8, border: "none",
                      background: "none", cursor: "pointer", textAlign: "left",
                      fontSize: 13, fontWeight: 600, color: "var(--color-txt3)",
                      display: "flex", alignItems: "center", gap: 8,
                    }}>
                      <LogOut size={13} /> Keluar &amp; hapus akun tersimpan
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Baris 2: judul halaman + periode picker */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 8, gap: 8 }}>
        <div className="flex-min">
          <div style={{ fontSize: 17, fontWeight: 800, color: "var(--color-txt)" }}>{title}</div>
        </div>

        {/* Periode picker */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <button onClick={() => setShowPicker(!showPicker)} style={{
            display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 20,
            border: "1.5px solid var(--color-primary)", background: "rgba(3,105,161,0.08)",
            color: "var(--color-primary)", fontSize: 13, fontWeight: 700, cursor: "pointer",
          }}>
            <span>{MONTHS[activeBulan - 1].slice(0, 3)} {activeTahun}</span>
            <ChevronDown size={12} />
          </button>

          {showPicker && (
            <>
              <div style={{ position: "fixed", inset: 0, zIndex: 100 }} onClick={() => setShowPicker(false)} />
              <div style={{
                position: "absolute", right: 0, top: "calc(100% + 6px)",
                background: "var(--color-card)", border: "1px solid var(--color-border)",
                borderRadius: 16, zIndex: 101, boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
                padding: 10, minWidth: 210,
              }}>
                {/* #2 Fix: 11px → 13px */}
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-txt3)", padding: "2px 6px 8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Pilih Periode
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 4, marginBottom: 10 }}>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((bln) => (
                    <button key={bln} onClick={() => { setActiveBulanTahun(bln, activeTahun); setShowPicker(false); }}
                      style={{
                        /* #3 Fix: min touch target */
                        padding: "7px 2px", minHeight: 36, borderRadius: 8, fontSize: 13, fontWeight: 600,
                        border: "none", cursor: "pointer",
                        background: bln === activeBulan ? "var(--color-primary)" : "var(--color-bg)",
                        /* #15 Fix: #fff → white */
                        color: bln === activeBulan ? "white" : "var(--color-txt2)",
                      }}>
                      {MONTHS[bln - 1].slice(0, 3)}
                    </button>
                  ))}
                </div>
                <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: 8, display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {YEARS.map((yr) => (
                    <button key={yr} onClick={() => { setActiveBulanTahun(activeBulan, yr); setShowPicker(false); }}
                      style={{
                        flex: 1, minWidth: 48, padding: "7px 4px", borderRadius: 8,
                        fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer",
                        background: yr === activeTahun ? "var(--color-primary)" : "var(--color-bg)",
                        /* #15 Fix: #fff → white */
                        color: yr === activeTahun ? "white" : "var(--color-txt2)",
                      }}>
                      {yr}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
