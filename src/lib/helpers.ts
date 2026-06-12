import { AppSettings, BlokTarif, BlokSnapshot } from "@/types";
import { Timestamp } from "firebase/firestore";

// ─── Kalkulasi Tagihan ───────────────────────────────────────────────────────

export interface KalkulasiTagihan {
  pemakaian: number;
  subtotalBlok1: number;  // legacy compat (blok pertama)
  subtotalBlok2: number;  // legacy compat (blok kedua)
  subtotalPemakaian: number;
  total: number;
  blokDetail: BlokSnapshot[]; // detail per blok (multi-blok)
}

/** Ambil blokTarif dari settings — fallback ke legacy 2-blok jika tidak ada */
export function getBlokTarif(settings: Pick<AppSettings, "hargaBlok1" | "batasBlok" | "hargaBlok2" | "blokTarif">): BlokTarif[] {
  if (settings.blokTarif && settings.blokTarif.length >= 1) {
    return settings.blokTarif;
  }
  // Legacy fallback — tipe per_m3 (perilaku lama)
  return [
    { batasAtas: settings.batasBlok, harga: settings.hargaBlok1, tipe: 'per_m3' as const },
    { batasAtas: null, harga: settings.hargaBlok2, tipe: 'per_m3' as const },
  ];
}

export function hitungTagihan(
  meterAwal: number,
  meterAkhir: number,
  settings: Pick<AppSettings, "abonemen" | "hargaBlok1" | "batasBlok" | "hargaBlok2" | "blokTarif">
): KalkulasiTagihan {
  const pemakaian = Math.max(0, meterAkhir - meterAwal);
  const blokTarif = getBlokTarif(settings);
  const { abonemen } = settings;

  const blokDetail: BlokSnapshot[] = [];
  let sisaPemakaian = pemakaian;
  let batasSebelumnya = 0;

  for (let i = 0; i < blokTarif.length; i++) {
    const blok = blokTarif[i];
    const isLast = i === blokTarif.length - 1;
    const tipe = blok.tipe ?? 'per_m3';

    if (tipe === 'flat') {
      // Blok flat: selalu kena harga tetap, tidak peduli pemakaian aktual
      // (selama pemakaian masuk range blok ini atau blok ini adalah satu-satunya)
      const kapasitasBlok = blok.batasAtas !== null ? blok.batasAtas - batasSebelumnya : Infinity;
      const pemakaianBlok = Math.min(sisaPemakaian, kapasitasBlok);
      // Flat: subtotal = harga tetap (tidak dikali pemakaian)
      // Hanya dikenakan jika pelanggan masuk ke blok ini (pemakaian > batasSebelumnya atau blok pertama)
      const masukBlok = i === 0 || sisaPemakaian > 0;
      const subtotal = masukBlok ? blok.harga : 0;
      blokDetail.push({ batasAtas: blok.batasAtas, harga: blok.harga, tipe, subtotal });
      sisaPemakaian -= pemakaianBlok > 0 ? pemakaianBlok : 0;
      if (blok.batasAtas !== null) batasSebelumnya = blok.batasAtas;
      continue;
    }

    // Tipe per_m3 (default)
    if (sisaPemakaian <= 0) {
      blokDetail.push({ batasAtas: blok.batasAtas, harga: blok.harga, tipe, subtotal: 0 });
      continue;
    }

    let pemakaianBlok: number;
    if (isLast || blok.batasAtas === null) {
      pemakaianBlok = sisaPemakaian;
    } else {
      const kapasitasBlok = blok.batasAtas - batasSebelumnya;
      pemakaianBlok = Math.min(sisaPemakaian, kapasitasBlok);
    }

    const subtotal = pemakaianBlok * blok.harga;
    blokDetail.push({ batasAtas: blok.batasAtas, harga: blok.harga, tipe, subtotal });
    sisaPemakaian -= pemakaianBlok;
    if (blok.batasAtas !== null) batasSebelumnya = blok.batasAtas;
  }

  const subtotalPemakaian = blokDetail.reduce((s, b) => s + b.subtotal, 0);
  const subtotalBlok1 = blokDetail[0]?.subtotal ?? 0;
  const subtotalBlok2 = blokDetail[1]?.subtotal ?? 0;
  const total = abonemen + subtotalPemakaian;

  return { pemakaian, subtotalBlok1, subtotalBlok2, subtotalPemakaian, total, blokDetail };
}

// ─── Format Helpers ──────────────────────────────────────────────────────────

export function formatRp(amount: number): string {
  return "Rp " + amount.toLocaleString("id-ID");
}

export function formatM3(value: number): string {
  return value.toLocaleString("id-ID") + " m³";
}

export function formatTanggal(ts: unknown): string {
  if (!ts) return "-";
  try {
    let date: Date;
    if (ts instanceof Timestamp) {
      date = ts.toDate();
    } else if (ts instanceof Date) {
      date = ts;
    } else if (typeof ts === "object" && ts !== null && "seconds" in ts) {
      date = new Timestamp((ts as { seconds: number }).seconds, 0).toDate();
    } else {
      return "-";
    }
    // #23 Fix: month 'short' → 'long' agar output "15 Januari 2025"
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "-";
  }
}

/** Format tanggal resmi lengkap: "Senin, 15 Januari 2025" */
export function formatTanggalResmi(ts: unknown): string {
  if (!ts) return "-";
  try {
    let date: Date;
    if (ts instanceof Timestamp) {
      date = ts.toDate();
    } else if (ts instanceof Date) {
      date = ts;
    } else if (typeof ts === "object" && ts !== null && "seconds" in ts) {
      date = new Timestamp((ts as { seconds: number }).seconds, 0).toDate();
    } else {
      return "-";
    }
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "-";
  }
}

/** Format waktu relatif: "3 hari yang lalu", "2 jam yang lalu" */
export function formatWaktuRelatif(ts: unknown): string {
  if (!ts) return "-";
  try {
    let date: Date;
    if (ts instanceof Timestamp) {
      date = ts.toDate();
    } else if (ts instanceof Date) {
      date = ts;
    } else if (typeof ts === "object" && ts !== null && "seconds" in ts) {
      date = new Timestamp((ts as { seconds: number }).seconds, 0).toDate();
    } else {
      return "-";
    }
    const rtf = new Intl.RelativeTimeFormat("id-ID", { numeric: "auto" });
    const diffMs = date.getTime() - Date.now();
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHour / 24);
    const diffWeek = Math.round(diffDay / 7);
    const diffMonth = Math.round(diffDay / 30);
    const diffYear = Math.round(diffDay / 365);

    if (Math.abs(diffSec) < 60)   return rtf.format(diffSec, "second");
    if (Math.abs(diffMin) < 60)   return rtf.format(diffMin, "minute");
    if (Math.abs(diffHour) < 24)  return rtf.format(diffHour, "hour");
    if (Math.abs(diffDay) < 7)    return rtf.format(diffDay, "day");
    if (Math.abs(diffWeek) < 5)   return rtf.format(diffWeek, "week");
    if (Math.abs(diffMonth) < 12) return rtf.format(diffMonth, "month");
    return rtf.format(diffYear, "year");
  } catch {
    return "-";
  }
}

/** Format bulan dan tahun saja: "Januari 2025" */
export function formatTahunBulan(ts: unknown): string {
  if (!ts) return "-";
  try {
    let date: Date;
    if (ts instanceof Timestamp) {
      date = ts.toDate();
    } else if (ts instanceof Date) {
      date = ts;
    } else if (typeof ts === "object" && ts !== null && "seconds" in ts) {
      date = new Timestamp((ts as { seconds: number }).seconds, 0).toDate();
    } else {
      return "-";
    }
    return date.toLocaleDateString("id-ID", {
      month: "long",
      year: "numeric",
    });
  } catch {
    return "-";
  }
}

export function formatTanggalPanjang(ts: unknown): string {
  if (!ts) return "-";
  try {
    let date: Date;
    if (ts instanceof Timestamp) {
      date = ts.toDate();
    } else if (ts instanceof Date) {
      date = ts;
    } else if (typeof ts === "object" && ts !== null && "seconds" in ts) {
      date = new Timestamp((ts as { seconds: number }).seconds, 0).toDate();
    } else {
      return "-";
    }
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "-";
  }
}

// ─── Status Tagihan 3 Tier ────────────────────────────────────────────────────

export type StatusTier = 'lunas' | 'ditagih' | 'menunggak';

/**
 * Tentukan status tagihan 3 tier secara konsisten di semua menu.
 * - lunas: sudah bayar
 * - ditagih: ada dokumen Firestore, status belum (sudah dientry tapi belum bayar)
 * - menunggak: tidak ada dokumen / virtual (belum dientry sama sekali)
 */
export function getStatusTagihan(
  status: 'lunas' | 'belum',
  isVirtual: boolean,
): StatusTier {
  if (status === 'lunas') return 'lunas';
  if (isVirtual) return 'menunggak';
  return 'ditagih';
}

export const STATUS_TIER_LABEL: Record<StatusTier, string> = {
  lunas: 'Lunas',
  ditagih: 'Ditagih',
  menunggak: 'Menunggak',
};

export const STATUS_TIER_COLOR: Record<StatusTier, string> = {
  lunas: 'var(--color-lunas)',
  ditagih: 'var(--color-tunggakan)',
  menunggak: 'var(--color-belum)',
};

export const STATUS_TIER_BG: Record<StatusTier, string> = {
  lunas: 'rgba(21,128,61,0.12)',
  ditagih: 'rgba(202,138,4,0.12)',
  menunggak: 'rgba(185,28,28,0.12)',
};



/**
 * Cek apakah tagihan yang belum bayar sudah melewati batas tanggal 25.
 * Dipakai konsisten di semua menu: Tagihan, Rekap, Tunggakan, Dashboard.
 *
 * Logika:
 * - Bulan sebelum bulan aktif → selalu menunggak
 * - Bulan aktif → menunggak jika hari ini ≥ 25
 */
export function isMenunggak(
  tagihanBulan: number,
  tagihanTahun: number,
  bulanAktif: number,
  tahunAktif: number
): boolean {
  if (tagihanTahun < tahunAktif) return true;
  if (tagihanTahun === tahunAktif && tagihanBulan < bulanAktif) return true;
  if (tagihanTahun === tahunAktif && tagihanBulan === bulanAktif) {
    return new Date().getDate() >= 25;
  }
  return false;
}



// ─── Nomor Sambungan ─────────────────────────────────────────────────────────

/**
 * Format nomor sambungan dengan leading zero auto-adjust.
 * Digit ditentukan oleh nomorAkhir (batas alokasi) agar konsisten.
 * Minimal 3 digit. Contoh: nomorAkhir=100 → "001","010","100"
 * nomorAkhir=1000 → "0001","0010","1000"
 */
export function formatNomorSambungan(n: number, nomorAkhir: number): string {
  const digits = Math.max(String(nomorAkhir).length, 3);
  return String(n).padStart(digits, "0");
}

/**
 * Generate daftar semua nomor sambungan dari 1 s/d nomorAkhir.
 */
export function generateNomorList(nomorAkhir: number): string[] {
  const result: string[] = [];
  for (let i = 1; i <= nomorAkhir; i++) {
    result.push(formatNomorSambungan(i, nomorAkhir));
  }
  return result;
}

export function getBulanTahunAktif(): { bulan: number; tahun: number } {
  const now = new Date();
  return { bulan: now.getMonth() + 1, tahun: now.getFullYear() };
}

// ─── Nomor Tagihan ───────────────────────────────────────────────────────────

export function buildNomorTagihan(
  tahun: number,
  bulan: number,
  urutan: number,
  namaMember: string
): string {
  const bulanStr = String(bulan).padStart(2, "0");
  const urutanStr = String(urutan).padStart(3, "0");
  // ambil nama tanpa spasi, max 10 karakter, uppercase
  const namaSlug = namaMember
    .replace(/\s+/g, "")
    .toUpperCase()
    .slice(0, 10);
  return `TAG-${tahun}-${bulanStr}-${urutanStr}-${namaSlug}`;
}
