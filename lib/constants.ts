export const APP_NAME = "AirKu";
export const APP_VERSION = "1.0.0";

export const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export const CURRENT_YEAR = new Date().getFullYear();
export const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - 2 + i);

export const PAGE_TITLES: Record<string, string> = {
  dashboard: "Beranda",
  entry: "Entry Meter",
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
