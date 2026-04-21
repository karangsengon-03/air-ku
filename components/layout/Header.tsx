"use client";
import { Sun, Moon, Lock, Unlock, Wifi, WifiOff } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { APP_NAME } from "@/lib/constants";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const { darkMode, toggleDarkMode, settings, isOnline, showConfirm, addToast, userRole } = useAppStore();

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
          addToast("success", willLock ? "Aplikasi berhasil dikunci." : "Kunci dibuka.");
        } catch {
          addToast("error", "Gagal mengubah status kunci.");
        }
      }
    );
  };

  return (
    <header style={{
      background: "var(--color-card)",
      borderBottom: "1px solid var(--color-border)",
      padding: "0 16px",
      height: 56,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      position: "sticky",
      top: 0,
      zIndex: 40,
    }}>
      <div>
        <p style={{ fontSize: 11, fontWeight: 600, color: "var(--color-txt3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {APP_NAME}
        </p>
        <p style={{ fontSize: 17, fontWeight: 800, color: "var(--color-txt)", marginTop: -2 }}>
          {title}
        </p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {/* Online indicator */}
        <div style={{ color: isOnline ? "var(--color-lunas)" : "var(--color-belum)", padding: "8px" }}>
          {isOnline ? <Wifi size={18} /> : <WifiOff size={18} />}
        </div>

        {/* Lock button — both roles */}
        {userRole && (
          <button
            onClick={handleLockToggle}
            className="btn-ghost"
            style={{
              color: settings.globalLock ? "var(--color-belum)" : "var(--color-txt3)",
              padding: "8px",
            }}
            title={settings.globalLock ? "Buka kunci" : "Kunci aplikasi"}
          >
            {settings.globalLock ? <Lock size={20} /> : <Unlock size={20} />}
          </button>
        )}

        {/* Dark mode toggle */}
        <button onClick={toggleDarkMode} className="btn-ghost" style={{ padding: "8px" }} title="Ganti tema">
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </header>
  );
}
