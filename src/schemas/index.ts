/**
 * schemas/index.ts — Zod v4 schemas untuk semua form AirKu
 * Digunakan bersama react-hook-form + @hookform/resolvers/zod
 */
import { z } from "zod";

// ── Member Form ────────────────────────────────────────────────────────────────
export const memberSchema = z.object({
  nama: z.string().min(1, "Nama wajib diisi"),
  nomorSambungan: z.string().min(1, "Nomor sambungan wajib diisi"),
  // alamat, rt, meterAwalPertama boleh kosong tapi tipenya string (bukan undefined)
  // agar kompatibel dengan useForm<MemberFormValues> dan SubmitHandler
  alamat: z.string().default(""),
  rt: z.string().default(""),
  dusun: z.string().min(1, "Pilih dusun"),
  status: z.enum(["aktif", "nonaktif", "pindah"]).default("aktif"),
  // Hanya relevan saat tambah baru (mode add), diabaikan saat edit
  meterAwalPertama: z.string().default(""),
});

export type MemberFormValues = z.infer<typeof memberSchema>;

// ── Login Form ─────────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().min(1, "Email wajib diisi").email("Format email tidak valid"),
  password: z.string().min(1, "Kata sandi wajib diisi"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

// ── Operasional Form ───────────────────────────────────────────────────────────
export const operasionalSchema = z.object({
  label: z.string().min(1, "Label pengeluaran wajib diisi"),
  // Disimpan sebagai string terformat (mis: "150.000") — parsing di submit
  nominal: z.string().min(1, "Nominal wajib diisi"),
  tanggal: z.string().min(1, "Tanggal wajib diisi"),
});

export type OperasionalFormValues = z.infer<typeof operasionalSchema>;

// ── Info Organisasi Form ───────────────────────────────────────────────────────
export const infoOrganisasiSchema = z.object({
  namaOrganisasi: z.string().optional().default(""),
  desa: z.string().optional().default(""),
  kecamatan: z.string().optional().default(""),
});

export type InfoOrganisasiFormValues = z.infer<typeof infoOrganisasiSchema>;
