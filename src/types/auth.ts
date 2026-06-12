/**
 * auth.ts — Tipe data user & role akses
 */
import type { Role, FirestoreTs } from './common';

export interface UserRole {
  uid: string;
  role: Role;
  nama: string;
  email: string;
  /** Timestamp Firestore saat akun dibuat */
  createdAt?: FirestoreTs;
}
