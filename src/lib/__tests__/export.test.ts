import { describe, it, expect } from "vitest";
import { ringkasPerBulan, labelExportScope, buildNamaFileInvoice, ExportScope } from "../export";
import type { RekapRow, Tagihan } from "../../types";

const row = (overrides: Partial<RekapRow>): RekapRow => ({
  nama: "Test",
  nomorSambungan: "001",
  dusun: "Dusun A",
  rt: "001",
  pemakaian: 0,
  total: 0,
  status: "belum",
  menunggak: false,
  bulan: 7,
  tahun: 2026,
  ...overrides,
});

describe("ringkasPerBulan", () => {
  it("mengembalikan array kosong untuk input kosong", () => {
    expect(ringkasPerBulan([])).toEqual([]);
  });

  it("mengagregasi satu bulan dengan benar: lunas, ditagih, menunggak dihitung terpisah", () => {
    const rows: RekapRow[] = [
      row({ nama: "A", status: "lunas", total: 25000, pemakaian: 4 }),
      row({ nama: "B", status: "belum", menunggak: false, total: 25000, pemakaian: 3 }),
      row({ nama: "C", status: "belum", menunggak: true, total: 25000, pemakaian: 5 }),
    ];
    const result = ringkasPerBulan(rows);
    expect(result).toHaveLength(1);
    expect(result[0].jumlahPelanggan).toBe(3);
    expect(result[0].jumlahLunas).toBe(1);
    expect(result[0].jumlahDitagih).toBe(1);
    expect(result[0].jumlahMenunggak).toBe(1);
    // totalTerkumpul HANYA dari yang lunas
    expect(result[0].totalTerkumpul).toBe(25000);
    // totalTagihan dari SEMUA baris (lunas + belum)
    expect(result[0].totalTagihan).toBe(75000);
    expect(result[0].totalM3).toBe(12);
  });

  it("mengelompokkan multi-bulan secara terpisah, diurutkan kronologis meski input tidak urut", () => {
    const rows: RekapRow[] = [
      row({ bulan: 8, tahun: 2026, status: "lunas", total: 30000 }),
      row({ bulan: 6, tahun: 2026, status: "lunas", total: 25000 }),
      row({ bulan: 7, tahun: 2026, status: "lunas", total: 27000 }),
    ];
    const result = ringkasPerBulan(rows);
    expect(result).toHaveLength(3);
    expect(result.map((r) => r.bulan)).toEqual([6, 7, 8]);
  });

  it("mengelompokkan lintas tahun dengan benar (bulan sama, tahun beda = grup terpisah)", () => {
    const rows: RekapRow[] = [
      row({ bulan: 7, tahun: 2025, status: "lunas", total: 20000 }),
      row({ bulan: 7, tahun: 2026, status: "lunas", total: 25000 }),
    ];
    const result = ringkasPerBulan(rows);
    expect(result).toHaveLength(2);
    expect(result[0].tahun).toBe(2025);
    expect(result[1].tahun).toBe(2026);
  });

  it("label bulan terformat dengan benar (mis. 'Juli 2026')", () => {
    const rows: RekapRow[] = [row({ bulan: 7, tahun: 2026 })];
    expect(ringkasPerBulan(rows)[0].label).toBe("Juli 2026");
  });
});

describe("labelExportScope", () => {
  it("cakupan bulan → label bulan tunggal", () => {
    const scope: ExportScope = { kind: "bulan", bulan: 7, tahun: 2026 };
    expect(labelExportScope(scope)).toBe("Juli 2026");
  });

  it("cakupan tahunan → 'Tahun X'", () => {
    const scope: ExportScope = { kind: "tahunan", tahun: 2026 };
    expect(labelExportScope(scope)).toBe("Tahun 2026");
  });

  it("cakupan keseluruhan dengan rentang berbeda → 'X–Y'", () => {
    const scope: ExportScope = { kind: "keseluruhan", tahunMulai: 2024, tahunAkhir: 2026 };
    expect(labelExportScope(scope)).toBe("2024–2026");
  });

  it("cakupan keseluruhan dengan tahunMulai === tahunAkhir → 'Tahun X' (bukan 'X–X')", () => {
    const scope: ExportScope = { kind: "keseluruhan", tahunMulai: 2026, tahunAkhir: 2026 };
    expect(labelExportScope(scope)).toBe("Tahun 2026");
  });
});

// ─── buildNamaFileInvoice ─────────────────────────────────────────────────────
describe("buildNamaFileInvoice", () => {
  const baseTagihan = (overrides: Partial<Tagihan>): Tagihan => ({
    id: "t1", nomorTagihan: "", memberId: "m1", memberNama: "Test",
    memberNomorSambungan: "001", memberDusun: "", memberRT: "",
    bulan: 7, tahun: 2026, meterAwal: 0, meterAkhir: 0, pemakaian: 0,
    hargaHistoryId: "", abonemenSnapshot: 0, hargaBlok1Snapshot: 0,
    batasBlokSnapshot: 0, hargaBlok2Snapshot: 0, subtotalBlok1: 0,
    subtotalBlok2: 0, subtotalPemakaian: 0, total: 0, status: "belum",
    tanggalBayar: null, tanggalEntry: null, entryOleh: "", catatan: "",
    ...overrides,
  } as Tagihan);

  it("format sesuai spesifikasi: INVOICE-{bulan 2 digit}-{tahun}-{nama}-{no sambungan}", () => {
    const t = baseTagihan({ memberNama: "ANGGA", memberNomorSambungan: "001", bulan: 7, tahun: 2026 });
    expect(buildNamaFileInvoice(t)).toBe("INVOICE-07-2026-ANGGA-001");
  });

  it("REGRESI: nama pelanggan dengan titik (P.JON) — sebelumnya menghasilkan filename tidak konsisten ('JON.pdf' bare) karena mengandalkan nomorTagihan historis yang tidak selalu sesuai format buildNomorTagihan. Sekarang dibangun dari field individual, selalu konsisten.", () => {
    const t = baseTagihan({ memberNama: "P.JON", memberNomorSambungan: "012", bulan: 7, tahun: 2026 });
    expect(buildNamaFileInvoice(t)).toBe("INVOICE-07-2026-P.JON-012");
  });

  it("nama dengan spasi dihapus, bukan diganti tanda hubung (konsisten dengan buildNomorTagihan)", () => {
    const t = baseTagihan({ memberNama: "Asraful Deni", memberNomorSambungan: "003" });
    expect(buildNamaFileInvoice(t)).toBe("INVOICE-07-2026-ASRAFULDENI-003");
  });

  it("bulan Januari–September diberi leading zero (2 digit konsisten)", () => {
    const t = baseTagihan({ memberNama: "TEST", memberNomorSambungan: "001", bulan: 3, tahun: 2026 });
    expect(buildNamaFileInvoice(t)).toBe("INVOICE-03-2026-TEST-001");
  });

  it("nama diubah jadi UPPERCASE meski disimpan huruf kecil/campuran", () => {
    const t = baseTagihan({ memberNama: "budi santoso", memberNomorSambungan: "099" });
    expect(buildNamaFileInvoice(t)).toBe("INVOICE-07-2026-BUDISANTOSO-099");
  });
});
