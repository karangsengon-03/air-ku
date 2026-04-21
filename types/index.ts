export type Role = "admin" | "penagih";
export type MemberStatus = "aktif" | "nonaktif" | "pindah";
export type TagihanStatus = "lunas" | "belum";
export type ModeTunggakan = "carryover" | "mandiri";

export interface UserRole {
  uid: string;
  role: Role;
  nama: string;
  email: string;
  createdAt?: unknown;
}

export interface AppSettings {
  globalLock: boolean;
  abonemen: number;
  hargaBlok1: number;
  batasBlok: number;
  hargaBlok2: number;
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
  modeTunggakan: "mandiri",
  dusunList: [],
  rtPerDusun: {},
  namaOrganisasi: "PAM Desa",
  desa: "",
  kecamatan: "",
  versi: "1.0.0",
};

export interface HargaHistory {
  id?: string;
  tanggal: unknown;
  abonemen: number;
  hargaBlok1: number;
  batasBlok: number;
  hargaBlok2: number;
  catatan: string;
  diubahOleh: string;
}

export interface Member {
  id?: string;
  nama: string;
  nomorSambungan: string;
  alamat: string;
  rt: string;
  dusun: string;
  status: MemberStatus;
  meterAwalPertama: number;
  createdAt?: unknown;
  createdBy?: string;
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
  hargaBlok1Snapshot: number;
  batasBlokSnapshot: number;
  hargaBlok2Snapshot: number;
  subtotalBlok1: number;
  subtotalBlok2: number;
  subtotalPemakaian: number;
  total: number;
  status: TagihanStatus;
  tanggalBayar: unknown | null;
  tanggalEntry: unknown;
  entryOleh: string;
  catatan: string;
}

export interface Operasional {
  id?: string;
  label: string;
  nominal: number;
  tanggal: unknown;
  bulan: number;
  tahun: number;
  dicatatOleh: string;
}

export interface ActivityLog {
  id?: string;
  action: string;
  detail: string;
  ts: unknown;
  user: string;
  role: string;
}
