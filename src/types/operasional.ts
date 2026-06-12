/**
 * operasional.ts — Tipe data catatan pengeluaran operasional
 */
import type { FirestoreTs } from "./common";

export interface Operasional {
  id?: string;
  label: string;
  nominal: number;
  /** Timestamp Firestore saat pengeluaran dicatat */
  tanggal: FirestoreTs;
  bulan: number;
  tahun: number;
  dicatatOleh: string;
}
