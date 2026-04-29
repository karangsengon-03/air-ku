/**
 * settings.ts — Tipe konfigurasi aplikasi & tarif
 */
import type { ModeTunggakan, FirestoreTs } from './common';

/** Blok tarif individual dalam sistem multi-blok */
export interface BlokTarif {
  batasAtas: number | null; // null = tidak terbatas (blok terakhir)
  harga: number;            // Rp/m³
}

export interface AppSettings {
  globalLock: boolean;
  abonemen: number;
  // Legacy 2-blok (tetap untuk backward compat)
  hargaBlok1: number;
  batasBlok: number;
  hargaBlok2: number;
  // Multi-blok baru (override legacy jika ada)
  blokTarif?: BlokTarif[];
  modeTunggakan: ModeTunggakan;
  dusunList: string[];
  rtPerDusun: Record<string, string[]>;
  namaOrganisasi: string;
  desa: string;
  kecamatan: string;
  versi: string;
}

export const defaultSettings: AppSettings = {
  globalLock: false,
  abonemen: 5000,
  hargaBlok1: 2000,
  batasBlok: 10,
  hargaBlok2: 3000,
  blokTarif: [
    { batasAtas: 10, harga: 2000 },
    { batasAtas: null, harga: 3000 },
  ],
  modeTunggakan: 'mandiri',
  dusunList: [],
  rtPerDusun: {},
  namaOrganisasi: 'PAM Desa',
  desa: '',
  kecamatan: '',
  versi: '1.0.0',
};

export interface HargaHistory {
  id?: string;
  /** Timestamp Firestore saat perubahan tarif dicatat */
  tanggal: FirestoreTs;
  abonemen: number;
  hargaBlok1: number;
  batasBlok: number;
  hargaBlok2: number;
  blokTarif?: BlokTarif[];
  catatan: string;
  diubahOleh: string;
}
