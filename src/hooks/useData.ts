"use client";
import { useEffect } from "react";
import { listenMembers, listenTagihan } from "@/lib/db";
import { useAppStore } from "@/store/useAppStore";

/**
 * Global data provider — dipasang SEKALI di AppShell.
 * Members: listen semua, simpan ke store.
 * Tagihan: listen bulan aktif, re-subscribe saat bulan/tahun berubah.
 * Semua view baca dari store → tidak ada delay/loading per-halaman.
 */
export function useData() {
  const { activeBulan, activeTahun, setMembers, setTagihan, firebaseUser } = useAppStore();

  // Members — subscribe sekali saat login, unsubscribe saat logout
  useEffect(() => {
    if (!firebaseUser) return;
    const unsub = listenMembers((data) => setMembers(data));
    return () => unsub();
  }, [firebaseUser, setMembers]);

  // Tagihan — re-subscribe saat bulan/tahun aktif berubah
  useEffect(() => {
    if (!firebaseUser) return;
    // Reset dulu ke kosong supaya UI tidak tampilkan data bulan lama
    setTagihan([]);
    const unsub = listenTagihan(activeBulan, activeTahun, (data) => setTagihan(data));
    return () => unsub();
  }, [firebaseUser, activeBulan, activeTahun, setTagihan]);
}
