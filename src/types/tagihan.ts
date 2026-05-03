/**
 * tagihan.ts — Tipe data tagihan & snapshot kalkulasi
 */
import type { TagihanStatus, FirestoreTs } from './common';

export interface BlokSnapshot {
  batasAtas: number | null;
  harga: number;
  subtotal: number;
}

export interface Tagihan {
  id?: string;
  nomorTagihan: string;
  memberId: string;
  memberNama: string;
  memberNomorSambungan: string;
  memberDusun: string;
  memberRT: string;
  bulan: number;
  tahun: number;
  meterAwal: number;
  meterAkhir: number;
  pemakaian: number;
  hargaHistoryId: string;
  abonemenSnapshot: number;
  // Legacy 2-blok snapshot (tetap untuk backward compat)
  hargaBlok1Snapshot: number;
  batasBlokSnapshot: number;
  hargaBlok2Snapshot: number;
  // Multi-blok snapshot (jika ada)
  blokSnapshotList?: BlokSnapshot[];
  subtotalBlok1: number;
  subtotalBlok2: number;
  subtotalPemakaian: number;
  total: number;
  status: TagihanStatus;
  /** Timestamp Firestore saat tagihan dibayar, null jika belum lunas */
  tanggalBayar: FirestoreTs;
  /** Timestamp Firestore saat tagihan di-entry */
  tanggalEntry: FirestoreTs;
  entryOleh: string;
  catatan: string;
}
