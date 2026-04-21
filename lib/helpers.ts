import { AppSettings } from "@/types";
import { Timestamp } from "firebase/firestore";

// ─── Kalkulasi Tagihan ───────────────────────────────────────────────────────

export interface KalkulasiTagihan {
  pemakaian: number;
  subtotalBlok1: number;
  subtotalBlok2: number;
  subtotalPemakaian: number;
  total: number;
}

export function hitungTagihan(
  meterAwal: number,
  meterAkhir: number,
  settings: Pick<AppSettings, "abonemen" | "hargaBlok1" | "batasBlok" | "hargaBlok2">
): KalkulasiTagihan {
  const pemakaian = Math.max(0, meterAkhir - meterAwal);
  const { abonemen, hargaBlok1, batasBlok, hargaBlok2 } = settings;

  let subtotalBlok1 = 0;
  let subtotalBlok2 = 0;

  if (pemakaian <= batasBlok) {
    subtotalBlok1 = pemakaian * hargaBlok1;
  } else {
    subtotalBlok1 = batasBlok * hargaBlok1;
    subtotalBlok2 = (pemakaian - batasBlok) * hargaBlok2;
  }

  const subtotalPemakaian = subtotalBlok1 + subtotalBlok2;
  const total = abonemen + subtotalPemakaian;

  return { pemakaian, subtotalBlok1, subtotalBlok2, subtotalPemakaian, total };
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
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
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

// ─── Bulan & Tahun Aktif ─────────────────────────────────────────────────────

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
