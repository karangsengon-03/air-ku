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
  // Legacy fallback
  return [
    { batasAtas: settings.batasBlok, harga: settings.hargaBlok1 },
    { batasAtas: null, harga: settings.hargaBlok2 },
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

    if (sisaPemakaian <= 0) {
      blokDetail.push({ batasAtas: blok.batasAtas, harga: blok.harga, subtotal: 0 });
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
    blokDetail.push({ batasAtas: blok.batasAtas, harga: blok.harga, subtotal });
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
