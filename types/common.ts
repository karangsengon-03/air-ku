/**
 * common.ts — Tipe primitif, enum, dan konstanta bersama
 */
import type { Timestamp } from "firebase/firestore";

export type Role           = 'admin' | 'penagih';
export type MemberStatus   = 'aktif' | 'nonaktif' | 'pindah';
export type TagihanStatus  = 'lunas' | 'belum';
export type ModeTunggakan  = 'carryover' | 'mandiri';

/**
 * Semua kemungkinan bentuk nilai timestamp dari Firestore.
 * Digunakan di semua tipe domain yang menyimpan tanggal/waktu.
 */
export interface FirestoreTimestampLike {
  seconds: number;
  nanoseconds?: number;
}
export type FirestoreTs = Timestamp | FirestoreTimestampLike | null | undefined;
