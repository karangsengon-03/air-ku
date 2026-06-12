"use client";
import { useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAppStore } from "@/store/useAppStore";
import { AppSettings, defaultSettings } from "@/types";

export function useSettings() {
  const { setSettings } = useAppStore();

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "settings", "main"),
      (snap) => {
        if (snap.exists()) {
          setSettings({ ...defaultSettings, ...snap.data() } as AppSettings);
        } else {
          // Dokumen belum dibuat — pakai default agar app tidak hang
          setSettings(defaultSettings);
        }
      },
      (error) => {
        // Error permission/network — pakai default agar app tetap bisa dipakai
        console.warn("useSettings error:", error.code, error.message);
        setSettings(defaultSettings);
      }
    );
    return () => unsub();
  }, [setSettings]);
}
