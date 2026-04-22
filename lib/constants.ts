export const APP_NAME = "AirKu";
export const APP_VERSION = "1.0.0";
export const APP_SUBTITLE = "Sistem Iuran Air Desa";

export const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export const CURRENT_YEAR = new Date().getFullYear();
// Tahun dari 2024 sampai tahun sekarang +2 (misal 2026 → 2024, 2025, 2026, 2027, 2028)
export const YEARS = Array.from(
  { length: CURRENT_YEAR - 2024 + 3 },
  (_, i) => 2024 + i
);

export const DESA_INFO = {
  nama: "Desa Karang Sengon",
  kecamatan: "Kecamatan Klabang",
  kabupaten: "Kabupaten Bondowoso",
};

export const PAGE_TITLES: Record<string, string> = {
  dashboard: "Beranda",
  entry: "Entry / Bayar",
  tagihan: "Tagihan",
  rekap: "Rekap",
  tunggakan: "Tunggakan",
  grafik: "Grafik",
  members: "Pelanggan",
  operasional: "Operasional",
  log: "Log Aktivitas",
  settings: "Pengaturan",
  accounts: "Manajemen Akun",
};

export const PAGE_ICONS: Record<string, string> = {
  dashboard: "home",
  entry: "clipboard-list",
  tagihan: "droplets",
  rekap: "folder-open",
  tunggakan: "alert-triangle",
  grafik: "bar-chart-2",
  members: "users",
  operasional: "wrench",
  log: "scroll-text",
  settings: "settings",
  accounts: "user-cog",
};

export const MAX_LOG_ENTRIES = 500;

// QuickPay nominal presets (dalam ribuan rupiah)
export const QUICKPAY_PRESETS = [25, 27, 28, 30, 35, 40, 50];
