/**
 * settings.ts — Tipe konfigurasi aplikasi & tarif
 */
import type { ModeTunggakan, FirestoreTs } from './common';

/** Tipe perhitungan per blok */
export type TipeBlok = 'per_m3' | 'flat';

/** Mode entry tarif */
export type ModeTarif = 'per_pelanggan' | 'global';

/** Mode pembayaran saat entry tagihan */
export type ModePembayaran = 'per_member' | 'global_lunas' | 'global_tagihan';

/** Blok tarif individual dalam sistem multi-blok */
export interface BlokTarif {
  batasAtas: number | null; // null = tidak terbatas (blok terakhir)
  harga: number;            // Rp/m³ jika per_m3, atau Rp flat jika flat
  tipe: TipeBlok;           // 'per_m3' | 'flat'
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
  // Mode tarif entry
  modeTarif: ModeTarif;           // 'per_pelanggan' | 'global'
  modeTarifGlobal: 'meter' | 'rata'; // aktif jika modeTarif === 'global'
  modePembayaran: ModePembayaran; // 'per_member' | 'global_lunas' | 'global_tagihan'
  nomorSambunganAkhir: number;   // batas atas alokasi nomor sambungan, default 100
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
  hargaBlok1: 25000,
  batasBlok: 10,
  hargaBlok2: 3000,
  blokTarif: [
    { batasAtas: 10, harga: 25000, tipe: 'flat' },
    { batasAtas: null, harga: 3000, tipe: 'per_m3' },
  ],
  modeTarif: 'per_pelanggan',
  modeTarifGlobal: 'meter',
  modePembayaran: 'per_member',
  nomorSambunganAkhir: 100,
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
  tanggal: FirestoreTs;
  abonemen: number;
  hargaBlok1: number;
  batasBlok: number;
  hargaBlok2: number;
  blokTarif?: BlokTarif[];
  catatan: string;
  diubahOleh: string;
}
