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
  getMemberStartPeriode,
  isMemberTerdaftarSaatPeriode,
} from "../helpers";

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

  it("bulan aktif, sebelum tanggal 25 → belum menunggak", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-20"));
    expect(isMenunggak(7, 2026, 7, 2026)).toBe(false);
    vi.useRealTimers();
  });

  it("bulan aktif, tepat tanggal 25 → sudah menunggak", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-25"));
    expect(isMenunggak(7, 2026, 7, 2026)).toBe(true);
    vi.useRealTimers();
  });

  it("bulan aktif, setelah tanggal 25 → menunggak", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-28"));
    expect(isMenunggak(7, 2026, 7, 2026)).toBe(true);
    vi.useRealTimers();
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
