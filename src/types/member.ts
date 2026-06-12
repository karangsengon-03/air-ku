/**
 * member.ts — Tipe data pelanggan
 */
import type { MemberStatus, FirestoreTs } from './common';

export interface Member {
  id?: string;
  nama: string;
  nomorSambungan: string;
  alamat: string;
  rt: string;
  dusun: string;
  status: MemberStatus;
  meterAwalPertama: number;
  /** Timestamp Firestore saat pelanggan didaftarkan */
  createdAt?: FirestoreTs;
  createdBy?: string;
}
