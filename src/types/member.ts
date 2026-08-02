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
  /** Timestamp Firestore saat DOKUMEN dibuat — arsip teknis murni, JANGAN dipakai untuk logika bisnis */
  createdAt?: FirestoreTs;
  createdBy?: string;
  /**
   * Tanggal mulai periode aktif SAAT INI. Default sama dengan createdAt saat
   * pelanggan pertama dibuat, tapi bisa diedit manual oleh admin (mis. data
   * historis yang baru diinput belakangan). Jika pelanggan pernah nonaktif
   * lalu diaktifkan lagi, field ini diperbarui ke tanggal reaktivasi.
   * INI SATU-SATUNYA field yang dipakai untuk logika bisnis "sejak kapan
   * pelanggan wajib bayar" (lihat isMemberTerdaftarSaatPeriode di helpers.ts).
   */
  tanggalTerdaftar?: FirestoreTs;
  /**
   * Tanggal pendaftaran PERTAMA KALI pelanggan ini pernah terdaftar — diisi
   * sekali saat dokumen pertama dibuat, TIDAK PERNAH berubah lagi meski
   * direaktivasi berkali-kali. Murni riwayat/histori, tidak dipakai untuk
   * perhitungan tunggakan apa pun.
   */
  tanggalPendaftaranPertama?: FirestoreTs;
  /**
   * Tanggal saat status diubah menjadi nonaktif/pindah. Dipakai untuk
   * menghentikan perhitungan tunggakan setelah tanggal ini. Di-reset ke
   * null otomatis jika status diubah kembali ke aktif (reaktivasi).
   */
  tanggalNonaktif?: FirestoreTs;
}
