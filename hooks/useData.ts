"use client";
import { useEffect, useRef } from "react";
import { listenMembers, listenTagihan } from "@/lib/db";
import { useAppStore } from "@/store/useAppStore";

/**
 * Global data provider — dipasang SEKALI di AppShell.
 * Listen members (semua status) dan tagihan bulan aktif.
 * Data disimpan ke Zustand store → semua view baca langsung dari store, instan.
 */
export function useData() {
  const { activeBulan, activeTahun, setMembers, setTagihan } = useAppStore();
  const unsubMembersRef = useRef<(() => void) | null>(null);
  const unsubTagihanRef = useRef<(() => void) | null>(null);

  // Listen members — sekali saja, tidak perlu re-subscribe saat bulan ganti
  useEffect(() => {
    if (unsubMembersRef.current) unsubMembersRef.current();
    const unsub = listenMembers((data) => {
      setMembers(data);
    });
    unsubMembersRef.current = unsub;
    return () => {
      unsub();
      unsubMembersRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // hanya satu kali mount

  // Listen tagihan — re-subscribe saat bulan/tahun aktif berubah
  useEffect(() => {
    if (unsubTagihanRef.current) unsubTagihanRef.current();
    const unsub = listenTagihan(activeBulan, activeTahun, (data) => {
      setTagihan(data);
    });
    unsubTagihanRef.current = unsub;
    return () => {
      unsub();
      unsubTagihanRef.current = null;
    };
  }, [activeBulan, activeTahun, setTagihan]);
}
