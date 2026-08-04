// src/lib/__tests__/helpers.test.ts
// Unit test untuk semua fungsi di lib/helpers.ts
// Jalankan: npm test

import { describe, it, expect, vi, beforeEach } from "vitest";
import { Timestamp } from "firebase/firestore";
import {
  formatRp,
  formatM3,
  formatTanggal,
  formatTanggalResmi,
  formatTahunBulan,
  formatWaktuRelatif,
  hitungTagihan,
  buildNomorTagihan,
  getBulanTahunAktif,
  isMenunggak,
  getBatasMenunggakTanggal,
  getJumlahHariDalamBulan,
  getMemberStartPeriode,
  getMemberEndPeriode,
  isMemberTerdaftarSaatPeriode,
  buildRekapRows,
  toDateInputValue,
} from "../helpers";
import type { Member, Tagihan } from "../../types";

// ─── Mock firebase/firestore ─────────────────────────────────────────────────
// helpers.ts import Timestamp dari firebase/firestore — kita mock agar test
// tidak butuh koneksi Firebase sama sekali.
vi.mock("firebase/firestore", () => {
  class Timestamp {
    seconds: number;
    nanoseconds: number;
    constructor(seconds: number, nanoseconds: number) {
      this.seconds = seconds;
      this.nanoseconds = nanoseconds;
    }
    toDate() {
      return new Date(this.seconds * 1000);
    }
    static fromDate(date: Date) {
      return new Timestamp(Math.floor(date.getTime() / 1000), 0);
    }
  }
  return { Timestamp };
});

// ─── Re-import setelah mock aktif ────────────────────────────────────────────
// Import ulang harus dilakukan setelah vi.mock() agar mock sudah terdaftar.
// Vitest secara otomatis hoist vi.mock() ke atas, jadi import di atas sudah aman.

// ─── Helpers untuk buat Timestamp-like object ────────────────────────────────
function makeTimestampLike(date: Date) {
  return { seconds: Math.floor(date.getTime() / 1000) };
}

// ─── formatRp ────────────────────────────────────────────────────────────────
describe("formatRp", () => {
  it("memformat angka bulat", () => {
    expect(formatRp(150000)).toBe("Rp 150.000");
  });

  it("memformat nol", () => {
    expect(formatRp(0)).toBe("Rp 0");
  });

  it("memformat angka besar", () => {
    expect(formatRp(1000000)).toBe("Rp 1.000.000");
  });

  it("memformat angka kecil", () => {
    expect(formatRp(5000)).toBe("Rp 5.000");
  });
});

// ─── formatM3 ────────────────────────────────────────────────────────────────
describe("formatM3", () => {
  it("memformat nilai m³ dengan benar", () => {
    expect(formatM3(15)).toBe("15 m³");
  });

  it("memformat nol", () => {
    expect(formatM3(0)).toBe("0 m³");
  });

  it("memformat nilai besar dengan separator", () => {
    // 1000 → "1.000 m³" (id-ID locale)
    expect(formatM3(1000)).toBe("1.000 m³");
  });
});

// ─── formatTanggal ───────────────────────────────────────────────────────────
describe("formatTanggal", () => {
  it("memformat Date object ke format Indonesia", () => {
    // 15 Januari 2025
    const date = new Date(2025, 0, 15); // bulan 0-indexed
    const result = formatTanggal(date);
    expect(result).toContain("Januari");
    expect(result).toContain("2025");
    expect(result).toContain("15");
  });

  it("memformat Timestamp-like object", () => {
    const date = new Date(2025, 0, 15);
    const ts = makeTimestampLike(date);
    const result = formatTanggal(ts);
    expect(result).toContain("Januari");
    expect(result).toContain("2025");
  });

  it("mengembalikan '-' untuk nilai null", () => {
    expect(formatTanggal(null)).toBe("-");
  });

  it("mengembalikan '-' untuk nilai undefined", () => {
    expect(formatTanggal(undefined)).toBe("-");
  });

  it("mengembalikan '-' untuk string (tipe tidak valid)", () => {
    expect(formatTanggal("2025-01-15")).toBe("-");
  });

  it("menggunakan nama bulan panjang (bukan singkatan)", () => {
    const date = new Date(2025, 2, 1); // Maret
    const result = formatTanggal(date);
    // Harus "Maret" bukan "Mar"
    expect(result).toContain("Maret");
    expect(result).not.toContain("Mar ");
  });
});

// ─── formatTanggalResmi ──────────────────────────────────────────────────────
describe("formatTanggalResmi", () => {
  it("menyertakan nama hari", () => {
    // 15 Januari 2025 adalah Rabu
    const date = new Date(2025, 0, 15);
    const result = formatTanggalResmi(date);
    expect(result).toContain("Rabu");
    expect(result).toContain("Januari");
    expect(result).toContain("2025");
  });

  it("mengembalikan '-' untuk nilai null", () => {
    expect(formatTanggalResmi(null)).toBe("-");
  });
});

// ─── formatTahunBulan ────────────────────────────────────────────────────────
describe("formatTahunBulan", () => {
  it("menghasilkan format 'Bulan Tahun'", () => {
    const date = new Date(2025, 0, 15); // Januari 2025
    const result = formatTahunBulan(date);
    expect(result).toContain("Januari");
    expect(result).toContain("2025");
    // Tidak menyertakan tanggal
    expect(result).not.toContain("15");
  });

  it("mengembalikan '-' untuk nilai null", () => {
    expect(formatTahunBulan(null)).toBe("-");
  });
});

// ─── formatWaktuRelatif ──────────────────────────────────────────────────────
describe("formatWaktuRelatif", () => {
  beforeEach(() => {
    // Freeze waktu ke 2025-06-01 12:00:00 UTC
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-01T12:00:00Z"));
  });

  it("mengembalikan waktu relatif untuk kemarin", () => {
    const kemarin = new Date("2025-05-31T12:00:00Z");
    const result = formatWaktuRelatif(kemarin);
    // "kemarin" atau "1 hari yang lalu"
    expect(result).toMatch(/kemarin|hari/i);
  });

  it("mengembalikan waktu relatif untuk 3 hari lalu", () => {
    const date = new Date("2025-05-29T12:00:00Z");
    const result = formatWaktuRelatif(date);
    expect(result).toContain("hari");
  });

  it("mengembalikan '-' untuk nilai null", () => {
    expect(formatWaktuRelatif(null)).toBe("-");
  });

  it("menggunakan Timestamp-like object", () => {
    const date = new Date("2025-05-29T12:00:00Z");
    const ts = makeTimestampLike(date);
    const result = formatWaktuRelatif(ts);
    expect(result).not.toBe("-");
  });
});

// ─── hitungTagihan ───────────────────────────────────────────────────────────
describe("hitungTagihan", () => {
  const settingsDefault = {
    abonemen: 5000,
    hargaBlok1: 2000,
    batasBlok: 10,
    hargaBlok2: 3000,
    blokTarif: [
      { batasAtas: 10, harga: 2000, tipe: "per_m3" as const },
      { batasAtas: null, harga: 3000, tipe: "per_m3" as const },
    ],
  };

  it("menghitung tagihan di bawah batas blok 1 (pemakaian = 5 m³)", () => {
    // 5 m³ × Rp2000 = Rp10.000 + abonemen Rp5.000 = Rp15.000
    const result = hitungTagihan(100, 105, settingsDefault);
    expect(result.pemakaian).toBe(5);
    expect(result.subtotalBlok1).toBe(10000);
    expect(result.subtotalBlok2).toBe(0);
    expect(result.total).toBe(15000);
  });

  it("menghitung tagihan persis di batas blok (pemakaian = 10 m³)", () => {
    // 10 m³ × Rp2000 = Rp20.000 + abonemen Rp5.000 = Rp25.000
    const result = hitungTagihan(0, 10, settingsDefault);
    expect(result.pemakaian).toBe(10);
    expect(result.subtotalBlok1).toBe(20000);
    expect(result.subtotalBlok2).toBe(0);
    expect(result.total).toBe(25000);
  });

  it("menghitung tagihan lintas dua blok (pemakaian = 15 m³)", () => {
    // blok1: 10 m³ × Rp2000 = Rp20.000
    // blok2:  5 m³ × Rp3000 = Rp15.000
    // total: Rp20.000 + Rp15.000 + Rp5.000 (abonemen) = Rp40.000
    const result = hitungTagihan(0, 15, settingsDefault);
    expect(result.pemakaian).toBe(15);
    expect(result.subtotalBlok1).toBe(20000);
    expect(result.subtotalBlok2).toBe(15000);
    expect(result.total).toBe(40000);
  });

  it("menghitung tagihan pemakaian nol (tidak ada pemakaian)", () => {
    // Hanya abonemen
    const result = hitungTagihan(100, 100, settingsDefault);
    expect(result.pemakaian).toBe(0);
    expect(result.subtotalPemakaian).toBe(0);
    expect(result.total).toBe(5000);
  });

  it("tidak menghasilkan pemakaian negatif (meter akhir < meter awal)", () => {
    // Kasus error meter — pemakaian di-clamp ke 0
    const result = hitungTagihan(100, 90, settingsDefault);
    expect(result.pemakaian).toBe(0);
    expect(result.total).toBe(5000);
  });

  it("menggunakan legacy 2-blok fallback jika blokTarif tidak ada", () => {
    const settingsLegacy = {
      abonemen: 5000,
      hargaBlok1: 2000,
      batasBlok: 10,
      hargaBlok2: 3000,
      // blokTarif tidak ada → fallback legacy
    };
    const result = hitungTagihan(0, 15, settingsLegacy);
    expect(result.pemakaian).toBe(15);
    expect(result.total).toBe(40000);
  });

  it("blokDetail memiliki panjang yang benar", () => {
    const result = hitungTagihan(0, 15, settingsDefault);
    // settingsDefault punya 2 blok
    expect(result.blokDetail).toHaveLength(2);
  });
});

// ─── buildNomorTagihan ───────────────────────────────────────────────────────
describe("buildNomorTagihan", () => {
  it("menghasilkan format yang benar", () => {
    const result = buildNomorTagihan(2025, 1, 1, "Budi Santoso");
    expect(result).toBe("TAG-2025-01-001-BUDISANTOS");
  });

  it("memformat bulan dengan leading zero", () => {
    const result = buildNomorTagihan(2025, 9, 5, "Ana");
    expect(result).toBe("TAG-2025-09-005-ANA");
  });

  it("memotong nama lebih dari 10 karakter", () => {
    const result = buildNomorTagihan(2025, 12, 100, "Muhammad Rizal Fauzi");
    expect(result).toBe("TAG-2025-12-100-MUHAMMADRI");
  });

  it("menghapus spasi di nama", () => {
    const result = buildNomorTagihan(2025, 6, 1, "A B C");
    expect(result).toBe("TAG-2025-06-001-ABC");
  });
});

// ─── getBulanTahunAktif ──────────────────────────────────────────────────────
describe("getBulanTahunAktif", () => {
  it("mengembalikan bulan dan tahun saat ini", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-03-15"));
    const { bulan, tahun } = getBulanTahunAktif();
    expect(bulan).toBe(3);
    expect(tahun).toBe(2025);
    vi.useRealTimers();
  });
});

// ─── isMenunggak ─────────────────────────────────────────────────────────────
describe("isMenunggak", () => {
  it("bulan tagihan sebelum bulan aktif (tahun sama) selalu menunggak", () => {
    expect(isMenunggak(5, 2026, 7, 2026)).toBe(true);
  });

  it("tahun tagihan sebelum tahun aktif selalu menunggak", () => {
    expect(isMenunggak(12, 2025, 1, 2026)).toBe(true);
  });

  it("bulan tagihan setelah bulan aktif (tahun sama) tidak menunggak", () => {
    expect(isMenunggak(8, 2026, 7, 2026)).toBe(false);
  });

  // ── Batas menunggak (v1.4.1): (hari terakhir bulan − 1), bukan tanggal
  // tetap 25. Juli 2026 punya 31 hari → batas menunggak = tgl 30.
  it("bulan aktif (Juli, 31 hari), sebelum batas (tgl 29) → belum menunggak", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-29"));
    expect(isMenunggak(7, 2026, 7, 2026)).toBe(false);
    vi.useRealTimers();
  });

  it("bulan aktif (Juli, 31 hari), tepat batas (tgl 30) → sudah menunggak", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-30"));
    expect(isMenunggak(7, 2026, 7, 2026)).toBe(true);
    vi.useRealTimers();
  });

  it("bulan aktif (Juli, 31 hari), setelah batas (tgl 31) → menunggak", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-31"));
    expect(isMenunggak(7, 2026, 7, 2026)).toBe(true);
    vi.useRealTimers();
  });

  // ── Bulan 30 hari (Juni): batas menunggak = tgl 29.
  it("bulan aktif (Juni, 30 hari), sebelum batas (tgl 28) → belum menunggak", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-28"));
    expect(isMenunggak(6, 2026, 6, 2026)).toBe(false);
    vi.useRealTimers();
  });

  it("bulan aktif (Juni, 30 hari), tepat batas (tgl 29) → sudah menunggak", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-29"));
    expect(isMenunggak(6, 2026, 6, 2026)).toBe(true);
    vi.useRealTimers();
  });

  // ── Februari non-kabisat (2026, 28 hari): batas menunggak = tgl 27.
  it("bulan aktif (Februari 2026, non-kabisat, 28 hari), sebelum batas (tgl 26) → belum menunggak", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-26"));
    expect(isMenunggak(2, 2026, 2, 2026)).toBe(false);
    vi.useRealTimers();
  });

  it("bulan aktif (Februari 2026, non-kabisat, 28 hari), tepat batas (tgl 27) → sudah menunggak", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-27"));
    expect(isMenunggak(2, 2026, 2, 2026)).toBe(true);
    vi.useRealTimers();
  });

  // ── Februari kabisat (2024, 29 hari): batas menunggak = tgl 28.
  it("bulan aktif (Februari 2024, kabisat, 29 hari), sebelum batas (tgl 27) → belum menunggak", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-02-27"));
    expect(isMenunggak(2, 2024, 2, 2024)).toBe(false);
    vi.useRealTimers();
  });

  it("bulan aktif (Februari 2024, kabisat, 29 hari), tepat batas (tgl 28) → sudah menunggak", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-02-28"));
    expect(isMenunggak(2, 2024, 2, 2024)).toBe(true);
    vi.useRealTimers();
  });

  it("bulan aktif (Februari 2024, kabisat), tgl 29 (hari terakhir) → tetap menunggak", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-02-29"));
    expect(isMenunggak(2, 2024, 2, 2024)).toBe(true);
    vi.useRealTimers();
  });

  // ── REGRESI v1.4.2: parameter ketiga/keempat (bulanAktif/tahunAktif) HARUS
  // selalu bulan SEKARANG SUNGGUHAN (dari getBulanTahunAktif()), TIDAK BOLEH
  // bulan yang sedang ditampilkan/dipilih di layar (activeBulan). Bug yang
  // ditemukan di TagihanView/RekapView/TunggakanView v1.4.1: memanggil
  // isMenunggak(activeBulan, activeTahun, activeBulan, activeTahun) — bulan
  // dibandingkan terhadap DIRINYA SENDIRI. Jika activeBulan adalah bulan
  // LAMPAU (mis. melihat Juli sementara sekarang sudah Agustus), fungsi ini
  // salah jatuh ke cabang "bulan sama" (baris tagihanBulan === bulanAktif),
  // yang hanya membandingkan tanggal-hari-ini-sungguhan terhadap batas Juli
  // — dan karena tanggal hari ini di awal Agustus (mis. tgl 2) hampir pasti
  // BUKAN ≥ 30 (batas Juli), hasilnya SELALU false. Padahal Juli yang sudah
  // lama lewat semestinya SELALU dianggap menunggak (cabang tagihanBulan <
  // bulanAktif), terlepas dari tanggal berapa hari ini.
  it("REGRESI: bulan lampau (Juli) yang dilihat dari bulan sekarang jauh setelahnya (Agustus) tetap SELALU menunggak, bukan false karena kebetulan tanggal-hari-ini kecil", () => {
    vi.useFakeTimers();
    // Hari ini: 2 Agustus 2026. Tagihan Juli 2026 belum bayar.
    // Parameter ketiga/keempat WAJIB bulan sekarang (8, 2026) — BUKAN Juli
    // (7, 2026) meski itu bulan yang sedang "dilihat" di suatu UI.
    vi.setSystemTime(new Date("2026-08-02"));
    expect(isMenunggak(7, 2026, 8, 2026)).toBe(true);
    vi.useRealTimers();
  });

  it("REGRESI: pola SALAH (bulan dibandingkan terhadap dirinya sendiri) memang menghasilkan false — mendokumentasikan mengapa activeBulan tidak boleh dipakai sebagai bulanAktif", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-02"));
    // Ini BUKAN cara yang benar memanggil isMenunggak — sengaja didokumentasikan
    // sebagai bukti mengapa pola ini harus dihindari di semua pemanggil.
    expect(isMenunggak(7, 2026, 7, 2026)).toBe(false);
    vi.useRealTimers();
  });

  it("REGRESI: bulan lampau beberapa bulan sebelumnya (Juni, dilihat dari Agustus) tetap selalu menunggak", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-02"));
    expect(isMenunggak(6, 2026, 8, 2026)).toBe(true);
    vi.useRealTimers();
  });

  it("REGRESI: lintas tahun — Desember 2025 dilihat dari Februari 2026 tetap selalu menunggak", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-05"));
    expect(isMenunggak(12, 2025, 2, 2026)).toBe(true);
    vi.useRealTimers();
  });
});

// ─── getBatasMenunggakTanggal & getJumlahHariDalamBulan ──────────────────────
describe("getJumlahHariDalamBulan", () => {
  it("bulan 31 hari (Januari, Juli, Desember)", () => {
    expect(getJumlahHariDalamBulan(1, 2026)).toBe(31);
    expect(getJumlahHariDalamBulan(7, 2026)).toBe(31);
    expect(getJumlahHariDalamBulan(12, 2026)).toBe(31);
  });

  it("bulan 30 hari (April, Juni, September, November)", () => {
    expect(getJumlahHariDalamBulan(4, 2026)).toBe(30);
    expect(getJumlahHariDalamBulan(6, 2026)).toBe(30);
    expect(getJumlahHariDalamBulan(9, 2026)).toBe(30);
    expect(getJumlahHariDalamBulan(11, 2026)).toBe(30);
  });

  it("Februari non-kabisat → 28 hari", () => {
    expect(getJumlahHariDalamBulan(2, 2026)).toBe(28);
    expect(getJumlahHariDalamBulan(2, 2027)).toBe(28);
  });

  it("Februari kabisat → 29 hari", () => {
    expect(getJumlahHariDalamBulan(2, 2024)).toBe(29);
    expect(getJumlahHariDalamBulan(2, 2028)).toBe(29);
  });
});

describe("getBatasMenunggakTanggal", () => {
  it("bulan 31 hari (Juli) → batas tgl 30", () => {
    expect(getBatasMenunggakTanggal(7, 2026)).toBe(30);
  });

  it("bulan 30 hari (Juni) → batas tgl 29", () => {
    expect(getBatasMenunggakTanggal(6, 2026)).toBe(29);
  });

  it("bulan 30 hari (April) → batas tgl 29", () => {
    expect(getBatasMenunggakTanggal(4, 2026)).toBe(29);
  });

  it("Februari non-kabisat (2026, 2027) → batas tgl 27", () => {
    expect(getBatasMenunggakTanggal(2, 2026)).toBe(27);
    expect(getBatasMenunggakTanggal(2, 2027)).toBe(27);
  });

  it("Februari kabisat (2024, 2028) → batas tgl 28", () => {
    expect(getBatasMenunggakTanggal(2, 2024)).toBe(28);
    expect(getBatasMenunggakTanggal(2, 2028)).toBe(28);
  });
});

// ─── getMemberStartPeriode ───────────────────────────────────────────────────
describe("getMemberStartPeriode", () => {
  it("null jika createdAt tidak ada (undefined)", () => {
    expect(getMemberStartPeriode({ createdAt: undefined })).toBeNull();
  });

  it("null jika createdAt null", () => {
    expect(getMemberStartPeriode({ createdAt: null })).toBeNull();
  });

  it("membaca instance Timestamp Firestore dengan benar", () => {
    const date = new Date(2026, 2, 5); // 5 Maret 2026
    const ts = Timestamp.fromDate(date);
    const result = getMemberStartPeriode({ createdAt: ts });
    expect(result).toEqual({ bulan: 3, tahun: 2026 });
  });

  it("membaca object {seconds} (bentuk timestamp-like) dengan benar", () => {
    const date = new Date(2026, 6, 10); // 10 Juli 2026 (bulan 0-indexed di constructor Date)
    const result = getMemberStartPeriode({ createdAt: makeTimestampLike(date) });
    expect(result).toEqual({ bulan: 7, tahun: 2026 });
  });

  it("membaca instance Date langsung dengan benar", () => {
    const date = new Date(2026, 4, 15); // 15 Mei 2026
    const result = getMemberStartPeriode({ createdAt: date });
    expect(result).toEqual({ bulan: 5, tahun: 2026 });
  });

  it("menangani pergantian tahun dengan benar (Desember)", () => {
    const date = new Date(2025, 11, 31); // 31 Des 2025
    const result = getMemberStartPeriode({ createdAt: makeTimestampLike(date) });
    expect(result).toEqual({ bulan: 12, tahun: 2025 });
  });
});

// ─── isMemberTerdaftarSaatPeriode ────────────────────────────────────────────
describe("isMemberTerdaftarSaatPeriode", () => {
  // Kasus nyata yang dilaporkan: H.saini & Sandiono terdaftar Juli 2026, tapi
  // sempat tampil "Menunggak" di Tagihan/Rekap/Beranda bulan Mei 2026 —
  // ini kumpulan test yang memastikan skenario itu tidak terulang.
  const createdAtJuli2026 = makeTimestampLike(new Date(2026, 6, 10));

  it("bulan pendaftaran itu sendiri dianggap sudah terdaftar", () => {
    expect(isMemberTerdaftarSaatPeriode({ createdAt: createdAtJuli2026 }, 7, 2026)).toBe(true);
  });

  it("bulan sebelum pendaftaran (tahun sama) dianggap BELUM terdaftar", () => {
    expect(isMemberTerdaftarSaatPeriode({ createdAt: createdAtJuli2026 }, 6, 2026)).toBe(false);
  });

  it("bulan jauh sebelum pendaftaran (kasus nyata: Mei vs daftar Juli) dianggap BELUM terdaftar", () => {
    expect(isMemberTerdaftarSaatPeriode({ createdAt: createdAtJuli2026 }, 5, 2026)).toBe(false);
  });

  it("bulan setelah pendaftaran dianggap sudah terdaftar", () => {
    expect(isMemberTerdaftarSaatPeriode({ createdAt: createdAtJuli2026 }, 8, 2026)).toBe(true);
  });

  it("tahun sebelum tahun pendaftaran dianggap BELUM terdaftar", () => {
    expect(isMemberTerdaftarSaatPeriode({ createdAt: createdAtJuli2026 }, 12, 2025)).toBe(false);
  });

  it("tahun setelah tahun pendaftaran dianggap sudah terdaftar", () => {
    expect(isMemberTerdaftarSaatPeriode({ createdAt: createdAtJuli2026 }, 1, 2027)).toBe(true);
  });

  it("member tanpa createdAt (data lama) selalu dianggap sudah terdaftar", () => {
    expect(isMemberTerdaftarSaatPeriode({ createdAt: null }, 1, 2020)).toBe(true);
    expect(isMemberTerdaftarSaatPeriode({ createdAt: undefined }, 1, 2020)).toBe(true);
  });
});

// ─── getMemberStartPeriode — prioritas tanggalTerdaftar vs createdAt ─────────
describe("getMemberStartPeriode — prioritas field", () => {
  it("tanggalTerdaftar dipakai jika ada, mengabaikan createdAt", () => {
    const tanggalTerdaftar = makeTimestampLike(new Date(2026, 6, 1)); // Juli 2026 (koreksi manual)
    const createdAt = makeTimestampLike(new Date(2026, 2, 1)); // Maret 2026 (waktu submit form asli)
    const result = getMemberStartPeriode({ tanggalTerdaftar, createdAt });
    expect(result).toEqual({ bulan: 7, tahun: 2026 });
  });

  it("fallback ke createdAt jika tanggalTerdaftar kosong (data lama sebelum fitur ini ada)", () => {
    const createdAt = makeTimestampLike(new Date(2026, 2, 1)); // Maret 2026
    const result = getMemberStartPeriode({ tanggalTerdaftar: undefined, createdAt });
    expect(result).toEqual({ bulan: 3, tahun: 2026 });
  });

  it("null jika keduanya kosong", () => {
    expect(getMemberStartPeriode({ tanggalTerdaftar: null, createdAt: null })).toBeNull();
  });
});

// ─── getMemberEndPeriode ──────────────────────────────────────────────────────
describe("getMemberEndPeriode", () => {
  it("null jika tanggalNonaktif tidak ada (member masih aktif)", () => {
    expect(getMemberEndPeriode({ tanggalNonaktif: undefined })).toBeNull();
    expect(getMemberEndPeriode({ tanggalNonaktif: null })).toBeNull();
  });

  it("membaca tanggalNonaktif dengan benar jika ada", () => {
    const tanggalNonaktif = makeTimestampLike(new Date(2026, 5, 20)); // 20 Juni 2026
    expect(getMemberEndPeriode({ tanggalNonaktif })).toEqual({ bulan: 6, tahun: 2026 });
  });
});

// ─── isMemberTerdaftarSaatPeriode — batas atas (tanggalNonaktif) + reaktivasi ─
describe("isMemberTerdaftarSaatPeriode — batas atas dan reaktivasi", () => {
  // Skenario nyata yang didiskusikan: daftar Januari, berhenti Juni, aktif
  // lagi Agustus (tanggalTerdaftar diperbarui ke Agustus saat reaktivasi).
  const tanggalPendaftaranPertama = makeTimestampLike(new Date(2026, 0, 10)); // Jan 2026

  it("bulan setelah tanggalNonaktif dianggap TIDAK terdaftar (berhenti, belum reaktivasi)", () => {
    const member = {
      tanggalTerdaftar: tanggalPendaftaranPertama,
      tanggalNonaktif: makeTimestampLike(new Date(2026, 5, 15)), // berhenti Juni 2026
    };
    expect(isMemberTerdaftarSaatPeriode(member, 7, 2026)).toBe(false); // Juli setelah berhenti
    expect(isMemberTerdaftarSaatPeriode(member, 12, 2026)).toBe(false); // Desember setelah berhenti
  });

  it("bulan pada/sebelum tanggalNonaktif tetap dianggap terdaftar", () => {
    const member = {
      tanggalTerdaftar: tanggalPendaftaranPertama,
      tanggalNonaktif: makeTimestampLike(new Date(2026, 5, 15)), // berhenti Juni 2026
    };
    expect(isMemberTerdaftarSaatPeriode(member, 6, 2026)).toBe(true); // bulan berhenti itu sendiri
    expect(isMemberTerdaftarSaatPeriode(member, 3, 2026)).toBe(true); // jauh sebelum berhenti
  });

  it("setelah reaktivasi (tanggalTerdaftar diperbarui ke Agustus, tanggalNonaktif direset null), Juni-Juli tidak dihitung tunggakan tapi Agustus dst terdaftar", () => {
    const memberSetelahReaktivasi = {
      tanggalTerdaftar: makeTimestampLike(new Date(2026, 7, 1)), // reaktivasi Agustus 2026
      tanggalNonaktif: null, // direset saat reaktivasi
    };
    // Juni & Juli (periode nonaktif) tidak dianggap terdaftar — tidak ditagih
    expect(isMemberTerdaftarSaatPeriode(memberSetelahReaktivasi, 6, 2026)).toBe(false);
    expect(isMemberTerdaftarSaatPeriode(memberSetelahReaktivasi, 7, 2026)).toBe(false);
    // Agustus dst dianggap terdaftar kembali
    expect(isMemberTerdaftarSaatPeriode(memberSetelahReaktivasi, 8, 2026)).toBe(true);
    expect(isMemberTerdaftarSaatPeriode(memberSetelahReaktivasi, 9, 2026)).toBe(true);
  });

  it("member aktif tanpa tanggalNonaktif tidak punya batas atas", () => {
    const member = { tanggalTerdaftar: tanggalPendaftaranPertama, tanggalNonaktif: null };
    expect(isMemberTerdaftarSaatPeriode(member, 12, 2030)).toBe(true); // jauh di masa depan tetap true
  });
});

// ─── toDateInputValue ─────────────────────────────────────────────────────────
describe("toDateInputValue", () => {
  it("string kosong jika value null/undefined", () => {
    expect(toDateInputValue(null)).toBe("");
    expect(toDateInputValue(undefined)).toBe("");
  });

  it("format YYYY-MM-DD dengan benar dari Timestamp", () => {
    const ts = Timestamp.fromDate(new Date(2026, 6, 5)); // 5 Juli 2026
    expect(toDateInputValue(ts)).toBe("2026-07-05");
  });

  it("padding angka satu digit dengan benar (bulan dan tanggal < 10)", () => {
    const ts = makeTimestampLike(new Date(2026, 0, 3)); // 3 Januari 2026
    expect(toDateInputValue(ts)).toBe("2026-01-03");
  });

  it("format benar dari instance Date langsung", () => {
    expect(toDateInputValue(new Date(2026, 11, 25))).toBe("2026-12-25"); // 25 Des 2026
  });
});

// ─── buildRekapRows ───────────────────────────────────────────────────────────
describe("buildRekapRows", () => {
  const baseMember = (overrides: Partial<Member>): Member => ({
    id: "m1",
    nama: "Test",
    nomorSambungan: "001",
    alamat: "",
    rt: "",
    dusun: "",
    status: "aktif",
    ...overrides,
  } as Member);

  const baseTagihan = (overrides: Partial<Tagihan>): Tagihan => ({
    id: "t1",
    nomorTagihan: "TAG-1",
    memberId: "m1",
    memberNama: "Test",
    memberNomorSambungan: "001",
    memberDusun: "Dusun A",
    memberRT: "001",
    bulan: 7,
    tahun: 2026,
    meterAwal: 0,
    meterAkhir: 0,
    pemakaian: 0,
    hargaHistoryId: "",
    abonemenSnapshot: 0,
    hargaBlok1Snapshot: 0,
    batasBlokSnapshot: 0,
    hargaBlok2Snapshot: 0,
    subtotalBlok1: 0,
    subtotalBlok2: 0,
    subtotalPemakaian: 0,
    total: 0,
    status: "belum",
    tanggalBayar: null,
    tanggalEntry: null,
    entryOleh: "",
    catatan: "",
    ...overrides,
  } as Tagihan);

  it("member dengan tagihan lunas → status lunas, menunggak selalu false", () => {
    const members = [baseMember({ id: "m1", status: "aktif" })];
    const tagihan = [baseTagihan({ memberId: "m1", status: "lunas", total: 25000 })];
    const rows = buildRekapRows(tagihan, members, 7, 2026, 8, 2026);
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe("lunas");
    expect(rows[0].menunggak).toBe(false);
    expect(rows[0].total).toBe(25000);
  });

  it("member dengan tagihan belum-bayar yang sudah di-entry, dilihat dari bulan lampau → menunggak true", () => {
    const members = [baseMember({ id: "m1", status: "aktif" })];
    // Tagihan Juni, belum bayar, dilihat dari sudut pandang Agustus (bulan lampau)
    const tagihan = [baseTagihan({ memberId: "m1", bulan: 6, tahun: 2026, status: "belum" })];
    const rows = buildRekapRows(tagihan, members, 6, 2026, 8, 2026);
    expect(rows[0].status).toBe("belum");
    expect(rows[0].menunggak).toBe(true);
  });

  it("member yang belum pernah di-entry sama sekali (virtual) tetap muncul sebagai belum-bayar", () => {
    const members = [baseMember({ id: "m1", status: "aktif" })];
    const rows = buildRekapRows([], members, 6, 2026, 8, 2026);
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe("belum");
    expect(rows[0].total).toBe(0);
    expect(rows[0].menunggak).toBe(true); // Juni dilihat dari Agustus = bulan lampau = menunggak
  });

  it("member yang belum terdaftar pada periode ini DAN belum punya tagihan → dikecualikan", () => {
    const createdAtAgustus = makeTimestampLike(new Date(2026, 7, 1)); // daftar Agustus 2026
    const members = [baseMember({ id: "m1", status: "aktif", createdAt: createdAtAgustus })];
    // Rekap untuk bulan Juni (sebelum member ini terdaftar), tidak ada tagihan tercatat
    const rows = buildRekapRows([], members, 6, 2026, 8, 2026);
    expect(rows).toHaveLength(0);
  });

  it("member yang belum terdaftar pada periode TAPI sudah punya tagihan tercatat → tetap ditampilkan (transaksi nyata)", () => {
    const createdAtAgustus = makeTimestampLike(new Date(2026, 7, 1));
    const members = [baseMember({ id: "m1", status: "aktif", createdAt: createdAtAgustus })];
    const tagihan = [baseTagihan({ memberId: "m1", bulan: 6, tahun: 2026, status: "lunas" })];
    const rows = buildRekapRows(tagihan, members, 6, 2026, 8, 2026);
    expect(rows).toHaveLength(1);
  });

  it("member non-aktif tidak ikut muncul di rekap", () => {
    const members = [baseMember({ id: "m1", status: "nonaktif" })];
    const rows = buildRekapRows([], members, 6, 2026, 8, 2026);
    expect(rows).toHaveLength(0);
  });
});
