/**
 * lib/export.ts
 * Generate PDF struk tagihan individual menggunakan jsPDF (client-side).
 * Tidak ada import server-side — semua lazy import agar Next.js tidak crash saat build.
 */

import { Tagihan, AppSettings, RekapRow } from "@/types";
import { formatRp, formatM3, formatTanggal } from "@/lib/helpers";
import { MONTHS } from "@/lib/constants";

// ─── Helper format bulan ──────────────────────────────────────────────────────

function labelBulan(bulan: number, tahun: number): string {
  return `${MONTHS[bulan - 1]} ${tahun}`;
}

/**
 * Nama file PDF invoice tagihan individual, dibangun dari field-field
 * individual (bulan, tahun, nama, no. sambungan) — BUKAN dari
 * tagihan.nomorTagihan. Alasan (v1.6.1): nomorTagihan pada sebagian data
 * historis ternyata tidak selalu konsisten dengan format buildNomorTagihan
 * (TAG-YYYY-MM-NNN-NAMA) — kemungkinan dari sebelum konvensi itu diterapkan
 * penuh — sehingga nama file yang dihasilkan bisa berbeda-beda antar
 * pelanggan (mis. "TAG-2026-07-030-ANGGA.pdf" vs bare "JON.pdf"). Dengan
 * membangun nama file langsung dari field individual di sini, hasilnya
 * SELALU konsisten terlepas dari riwayat nomorTagihan tersimpan.
 *
 * Format (disepakati admin): INVOICE-{bulan 2 digit}-{tahun}-{nama}-{no
 * sambungan}. Bulan numerik (07, bukan "Juli") — konsisten dengan konvensi
 * buildNomorTagihan yang sudah ada (helpers.ts), dan menghindari nama file
 * berspasi/bergantung locale.
 */
export function buildNamaFileInvoice(tagihan: Tagihan): string {
  const bulanStr = String(tagihan.bulan).padStart(2, "0");
  const namaSlug = tagihan.memberNama.replace(/\s+/g, "").toUpperCase();
  const nomorSlug = tagihan.memberNomorSambungan.replace(/\s+/g, "").toUpperCase();
  return `INVOICE-${bulanStr}-${tagihan.tahun}-${namaSlug}-${nomorSlug}`;
}

// ─── Generate PDF ─────────────────────────────────────────────────────────────

export async function generatePdfTagihan(
  tagihan: Tagihan,
  settings: Pick<AppSettings, "namaOrganisasi" | "desa" | "kecamatan">
): Promise<Blob> {
  // Lazy import agar tidak masuk SSR bundle
  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [80, 160], // lebar 80mm (ukuran thermal printer umum)
  });

  const W = 80; // lebar halaman
  const margin = 6;
  const contentW = W - margin * 2;
  let y = 8;

  // ── Warna & font helper ──────────────────────────────────────────────────────
  const setFont = (size: number, style: "normal" | "bold" = "normal") => {
    doc.setFontSize(size);
    doc.setFont("helvetica", style);
  };

  const text = (
    str: string,
    x: number,
    align: "left" | "center" | "right" = "left"
  ) => {
    doc.text(str, x, y, { align });
  };

  const line = (dash = false) => {
    if (dash) {
      doc.setLineDashPattern([1, 1], 0);
    } else {
      doc.setLineDashPattern([], 0);
    }
    doc.setDrawColor(180, 180, 180);
    doc.line(margin, y, W - margin, y);
    y += 4;
  };

  const gap = (h = 3) => {
    y += h;
  };

  // ── Header organisasi ────────────────────────────────────────────────────────
  setFont(10, "bold");
  doc.setTextColor(3, 105, 161); // --color-primary
  text(settings.namaOrganisasi || "PAM Desa", W / 2, "center");
  y += 5;

  setFont(7.5);
  doc.setTextColor(80, 80, 80);
  if (settings.desa) {
    text(
      `Desa ${settings.desa}${settings.kecamatan ? `, Kec. ${settings.kecamatan}` : ""}`,
      W / 2,
      "center"
    );
    y += 4;
  }

  setFont(7);
  text("KWITANSI PEMBAYARAN AIR", W / 2, "center");
  y += 4;

  line();

  // ── Nomor tagihan & periode ──────────────────────────────────────────────────
  setFont(6.5);
  doc.setTextColor(100, 100, 100);
  text(`No: ${tagihan.nomorTagihan}`, margin);
  y += 4;
  text(`Periode: ${labelBulan(tagihan.bulan, tagihan.tahun)}`, margin);
  y += 4;
  text(`Tgl Entry: ${formatTanggal(tagihan.tanggalEntry)}`, margin);
  y += 4;

  if (tagihan.status === "lunas" && tagihan.tanggalBayar) {
    text(`Tgl Bayar: ${formatTanggal(tagihan.tanggalBayar)}`, margin);
    y += 4;
  }

  line(true);

  // ── Data pelanggan ───────────────────────────────────────────────────────────
  setFont(7, "bold");
  doc.setTextColor(30, 30, 30);
  text("DATA PELANGGAN", margin);
  y += 4;

  setFont(7);
  doc.setTextColor(50, 50, 50);

  const rowKv = (label: string, value: string) => {
    doc.text(label, margin, y);
    doc.text(value, W - margin, y, { align: "right" });
    y += 4;
  };

  rowKv("Nama", tagihan.memberNama);
  rowKv("No. Sambungan", tagihan.memberNomorSambungan);
  rowKv(
    "Lokasi",
    `${tagihan.memberDusun ? tagihan.memberDusun + " / " : ""}RT ${tagihan.memberRT}`
  );

  line(true);

  // ── Data meter ───────────────────────────────────────────────────────────────
  setFont(7, "bold");
  doc.setTextColor(30, 30, 30);
  text("DATA METER", margin);
  y += 4;

  setFont(7);
  doc.setTextColor(50, 50, 50);
  rowKv("Meter Awal", formatM3(tagihan.meterAwal));
  rowKv("Meter Akhir", formatM3(tagihan.meterAkhir));

  setFont(7.5, "bold");
  doc.setTextColor(3, 105, 161);
  rowKv("Pemakaian", formatM3(tagihan.pemakaian));

  line(true);

  // ── Rincian biaya ────────────────────────────────────────────────────────────
  setFont(7, "bold");
  doc.setTextColor(30, 30, 30);
  text("RINCIAN BIAYA", margin);
  y += 4;

  setFont(7);
  doc.setTextColor(50, 50, 50);
  rowKv("Abonemen", formatRp(tagihan.abonemenSnapshot));

  // Blok 1
  const blok1Label =
    tagihan.pemakaian <= tagihan.batasBlokSnapshot
      ? `Pemakaian (${formatM3(tagihan.pemakaian)} × ${formatRp(tagihan.hargaBlok1Snapshot)})`
      : `Blok 1 (${formatM3(tagihan.batasBlokSnapshot)} × ${formatRp(tagihan.hargaBlok1Snapshot)})`;
  rowKv(blok1Label, formatRp(tagihan.subtotalBlok1));

  // Blok 2 (hanya jika melebihi batas)
  if (tagihan.pemakaian > tagihan.batasBlokSnapshot) {
    const blok2Label = `Blok 2 (${formatM3(tagihan.pemakaian - tagihan.batasBlokSnapshot)} × ${formatRp(tagihan.hargaBlok2Snapshot)})`;
    rowKv(blok2Label, formatRp(tagihan.subtotalBlok2));
  }

  line();

  // ── Total ────────────────────────────────────────────────────────────────────
  setFont(9, "bold");
  doc.setTextColor(30, 30, 30);
  doc.text("TOTAL", margin, y);
  doc.setTextColor(3, 105, 161);
  doc.text(formatRp(tagihan.total), W - margin, y, { align: "right" });
  y += 6;

  // ── Status badge ─────────────────────────────────────────────────────────────
  const statusColor: [number, number, number] =
    tagihan.status === "lunas" ? [21, 128, 61] : [185, 28, 28];
  const statusLabel = tagihan.status === "lunas" ? "LUNAS" : tagihan.catatan === "belum-dientry" ? "BELUM DIENTRY" : "DITAGIH - BELUM BAYAR";

  doc.setFillColor(...statusColor);
  doc.roundedRect(margin, y, contentW, 8, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  setFont(8, "bold");
  doc.text(statusLabel, W / 2, y + 5.2, { align: "center" });
  y += 12;

  // ── Catatan ──────────────────────────────────────────────────────────────────
  if (tagihan.catatan) {
    setFont(6.5);
    doc.setTextColor(100, 100, 100);
    text(`Catatan: ${tagihan.catatan}`, margin);
    y += 4;
  }

  gap(2);
  line(true);

  // ── Footer ───────────────────────────────────────────────────────────────────
  setFont(6);
  doc.setTextColor(150, 150, 150);
  text("Dicetak via AirKu — Aplikasi Iuran Air Desa", W / 2, "center");
  y += 4;
  text(`Entri oleh: ${tagihan.entryOleh}`, W / 2, "center");

  return doc.output("blob");
}

// ─── Share via WA (teks fallback) ─────────────────────────────────────────────

export function buildWaTextTagihan(
  tagihan: Tagihan,
  namaOrganisasi: string
): string {
  const baris = [
    `*${namaOrganisasi || "PAM Desa"}*`,
    `📄 Tagihan Air — ${labelBulan(tagihan.bulan, tagihan.tahun)}`,
    ``,
    `Yth. *${tagihan.memberNama}*`,
    `No. Sambungan: ${tagihan.memberNomorSambungan}`,
    ``,
    `Data Meter`,
    `• Meter Awal : ${formatM3(tagihan.meterAwal)}`,
    `• Meter Akhir: ${formatM3(tagihan.meterAkhir)}`,
    `• Pemakaian  : ${formatM3(tagihan.pemakaian)}`,
    ``,
    `Rincian Biaya`,
    `• Abonemen: ${formatRp(tagihan.abonemenSnapshot)}`,
  ];

  if (tagihan.pemakaian <= tagihan.batasBlokSnapshot) {
    baris.push(
      `• Pemakaian: ${formatRp(tagihan.subtotalBlok1)}`
    );
  } else {
    baris.push(
      `• Blok 1 (≤${tagihan.batasBlokSnapshot}m³): ${formatRp(tagihan.subtotalBlok1)}`,
      `• Blok 2 (>${tagihan.batasBlokSnapshot}m³): ${formatRp(tagihan.subtotalBlok2)}`
    );
  }

  baris.push(
    ``,
    `*Total: ${formatRp(tagihan.total)}*`,
    `Status: ${tagihan.status === "lunas" ? "LUNAS" : "BELUM BAYAR"}`,
    ``,
    `No. Tagihan: ${tagihan.nomorTagihan}`
  );

  if (tagihan.catatan) {
    baris.push(`Catatan: ${tagihan.catatan}`);
  }

  return baris.join("\n");
}

// ─── Download PDF helper (dipanggil dari komponen) ────────────────────────────

export async function downloadPdfTagihan(
  tagihan: Tagihan,
  settings: Pick<AppSettings, "namaOrganisasi" | "desa" | "kecamatan">
): Promise<void> {
  const blob = await generatePdfTagihan(tagihan, settings);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${buildNamaFileInvoice(tagihan)}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Share native (PDF blob) atau fallback ke wa.me ──────────────────────────

export async function shareTagihan(
  tagihan: Tagihan,
  settings: Pick<AppSettings, "namaOrganisasi" | "desa" | "kecamatan">
): Promise<void> {
  const waText = buildWaTextTagihan(tagihan, settings.namaOrganisasi);

  // Coba Web Share API dengan file PDF
  if (
    typeof navigator !== "undefined" &&
    navigator.share &&
    navigator.canShare
  ) {
    try {
      const blob = await generatePdfTagihan(tagihan, settings);
      const file = new File([blob], `${buildNamaFileInvoice(tagihan)}.pdf`, {
        type: "application/pdf",
      });

      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Tagihan Air — ${tagihan.memberNama}`,
          text: waText,
          files: [file],
        });
        return;
      }
    } catch {
      // fallback ke wa.me
    }
  }

  // Fallback: buka wa.me dengan teks saja
  const encoded = encodeURIComponent(waText);
  window.open(`https://wa.me/?text=${encoded}`, "_blank");
}

// ─── Export PDF Rekap Bulanan ─────────────────────────────────────────────────

export async function downloadPdfRekap(
  rows: RekapRow[],
  bulanLabel: string,
  settings: Pick<
    import("@/types").AppSettings,
    "namaOrganisasi" | "desa" | "kecamatan"
  >,
  totalOperasional: number
): Promise<void> {
  const { jsPDF } = await import("jspdf");

  // A4 landscape untuk tabel yang lebih lebar
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  const W = 297;
  const margin = 12;
  let y = 14;

  const setFont = (size: number, style: "normal" | "bold" = "normal") => {
    doc.setFontSize(size);
    doc.setFont("helvetica", style);
  };

  // Header
  setFont(13, "bold");
  doc.setTextColor(3, 105, 161);
  doc.text(settings.namaOrganisasi || "PAM Desa", W / 2, y, {
    align: "center",
  });
  y += 6;

  setFont(9);
  doc.setTextColor(80, 80, 80);
  if (settings.desa) {
    doc.text(
      `Desa ${settings.desa}${settings.kecamatan ? `, Kec. ${settings.kecamatan}` : ""}`,
      W / 2,
      y,
      { align: "center" }
    );
    y += 5;
  }

  setFont(10, "bold");
  doc.setTextColor(30, 30, 30);
  doc.text(`REKAP TAGIHAN AIR — ${bulanLabel.toUpperCase()}`, W / 2, y, {
    align: "center",
  });
  y += 8;

  // Garis atas tabel
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, y, W - margin, y);
  y += 4;

  // Header kolom
  const cols = {
    no: { x: margin, w: 10 },
    nama: { x: margin + 10, w: 54 },
    sambungan: { x: margin + 64, w: 28 },
    dusun: { x: margin + 92, w: 34 },
    rt: { x: margin + 126, w: 14 },
    pemakaian: { x: margin + 140, w: 26 },
    total: { x: margin + 166, w: 36 },
    status: { x: margin + 202, w: 24 },
  };

  setFont(7.5, "bold");
  doc.setTextColor(80, 80, 80);
  doc.text("No", cols.no.x, y);
  doc.text("Nama Pelanggan", cols.nama.x, y);
  doc.text("No. Sambungan", cols.sambungan.x, y);
  doc.text("Dusun", cols.dusun.x, y);
  doc.text("RT", cols.rt.x, y);
  doc.text("Pemakaian", cols.pemakaian.x + cols.pemakaian.w, y, {
    align: "right",
  });
  doc.text("Total", cols.total.x + cols.total.w, y, { align: "right" });
  doc.text("Status", cols.status.x, y);
  y += 2;

  doc.line(margin, y, W - margin, y);
  y += 4;

  // Rows
  let totalLunas = 0;
  let totalBelum = 0;
  let totalM3 = 0;
  let jumlahLunas = 0;

  rows.forEach((row, idx) => {
    // Page break
    if (y > 185) {
      doc.addPage();
      y = 14;
    }

    const isLunas = row.status === "lunas";
    if (isLunas) {
      totalLunas += row.total;
      jumlahLunas++;
    } else {
      totalBelum += row.total;
    }
    totalM3 += row.pemakaian;

    // Zebra stripe
    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y - 3, W - margin * 2, 6, "F");
    }

    setFont(7.5);
    doc.setTextColor(30, 30, 30);
    doc.text(String(idx + 1), cols.no.x, y);
    doc.text(row.nama.slice(0, 28), cols.nama.x, y);
    doc.text(row.nomorSambungan, cols.sambungan.x, y);
    doc.text((row.dusun || "-").slice(0, 18), cols.dusun.x, y);
    doc.text(row.rt || "-", cols.rt.x, y);
    doc.text(
      `${row.pemakaian.toLocaleString("id-ID")} m³`,
      cols.pemakaian.x + cols.pemakaian.w,
      y,
      { align: "right" }
    );
    doc.text(
      `Rp ${row.total.toLocaleString("id-ID")}`,
      cols.total.x + cols.total.w,
      y,
      { align: "right" }
    );

    // Status badge color
    doc.setTextColor(isLunas ? 21 : 185, isLunas ? 128 : 28, isLunas ? 61 : 28);
    doc.text(isLunas ? "Lunas" : "Belum Bayar", cols.status.x, y);
    y += 6;
  });

  // Garis bawah tabel
  doc.setTextColor(30, 30, 30);
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, W - margin, y);
  y += 5;

  // Summary
  const totalTagihan = totalLunas + totalBelum;
  const pendapatanBersih = totalLunas - totalOperasional;

  setFont(8, "bold");
  doc.setTextColor(30, 30, 30);
  doc.text(`Total Tagihan: Rp ${totalTagihan.toLocaleString("id-ID")}`, margin, y);
  doc.text(
    `Terkumpul: Rp ${totalLunas.toLocaleString("id-ID")} (${jumlahLunas}/${rows.length} pelanggan)`,
    margin + 65,
    y
  );
  doc.text(
    `Total Pemakaian: ${totalM3.toLocaleString("id-ID")} m³`,
    margin + 160,
    y
  );
  y += 5;

  if (totalOperasional > 0) {
    doc.setTextColor(80, 80, 80);
    setFont(7.5);
    doc.text(
      `Operasional: Rp ${totalOperasional.toLocaleString("id-ID")}   |   Pendapatan Bersih: Rp ${pendapatanBersih.toLocaleString("id-ID")}`,
      margin,
      y
    );
    y += 5;
  }

  // Footer
  doc.setTextColor(150, 150, 150);
  setFont(6.5);
  doc.text(
    `Dicetak via AirKu — ${new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}`,
    W / 2,
    y + 4,
    { align: "center" }
  );

  // Download
  const filename = `Rekap-Air-${bulanLabel.replace(/\s/g, "-")}.pdf`;
  doc.save(filename);
}

// ─── Export PDF Rekap Multi-Bulan (Tahunan / Keseluruhan) ─────────────────────

/** Agregat satu bulan/tahun, dipakai untuk halaman Ringkasan Per Bulan. */
export interface RingkasanBulan {
  bulan: number;
  tahun: number;
  label: string;
  jumlahPelanggan: number;
  jumlahLunas: number;
  jumlahDitagih: number;
  jumlahMenunggak: number;
  totalTerkumpul: number;
  totalTagihan: number;
  totalM3: number;
}

/**
 * Agregasi rows (gabungan banyak bulan) jadi satu baris ringkasan per
 * bulan/tahun, diurutkan kronologis. Dipakai bersama oleh PDF dan Excel
 * (downloadPdfRekapRange dan downloadExcelRekap) supaya logika ringkasan
 * per-bulan konsisten di kedua format, tidak dihitung dua kali dengan cara
 * berbeda. Diekspor (bukan murni privat) supaya bisa diuji langsung —
 * lihat __tests__/export.test.ts.
 */
export function ringkasPerBulan(rows: RekapRow[]): RingkasanBulan[] {
  const map = new Map<string, RingkasanBulan>();
  for (const r of rows) {
    const key = `${r.tahun}-${r.bulan}`;
    let agg = map.get(key);
    if (!agg) {
      agg = {
        bulan: r.bulan,
        tahun: r.tahun,
        label: labelBulan(r.bulan, r.tahun),
        jumlahPelanggan: 0,
        jumlahLunas: 0,
        jumlahDitagih: 0,
        jumlahMenunggak: 0,
        totalTerkumpul: 0,
        totalTagihan: 0,
        totalM3: 0,
      };
      map.set(key, agg);
    }
    agg.jumlahPelanggan++;
    agg.totalTagihan += r.total;
    agg.totalM3 += r.pemakaian;
    if (r.status === "lunas") {
      agg.jumlahLunas++;
      agg.totalTerkumpul += r.total;
    } else if (r.menunggak) {
      agg.jumlahMenunggak++;
    } else {
      agg.jumlahDitagih++;
    }
  }
  return Array.from(map.values()).sort((a, b) =>
    a.tahun !== b.tahun ? a.tahun - b.tahun : a.bulan - b.bulan
  );
}

export type ExportScope =
  | { kind: "bulan"; bulan: number; tahun: number }
  | { kind: "tahunan"; tahun: number }
  | { kind: "keseluruhan"; tahunMulai: number; tahunAkhir: number };

/** Label ringkas untuk judul laporan & nama file, sesuai cakupan yang dipilih. */
export function labelExportScope(scope: ExportScope): string {
  if (scope.kind === "bulan") return labelBulan(scope.bulan, scope.tahun);
  if (scope.kind === "tahunan") return `Tahun ${scope.tahun}`;
  return scope.tahunMulai === scope.tahunAkhir
    ? `Tahun ${scope.tahunMulai}`
    : `${scope.tahunMulai}–${scope.tahunAkhir}`;
}

export async function downloadPdfRekapRange(
  rows: RekapRow[],
  scope: ExportScope,
  settings: Pick<
    import("@/types").AppSettings,
    "namaOrganisasi" | "desa" | "kecamatan"
  >
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  const W = 297;
  const margin = 12;
  const scopeLabel = labelExportScope(scope);

  const setFont = (size: number, style: "normal" | "bold" = "normal") => {
    doc.setFontSize(size);
    doc.setFont("helvetica", style);
  };

  // Header institusi — dipanggil ulang di setiap halaman baru supaya laporan
  // panjang (puluhan halaman untuk cakupan Keseluruhan) tetap punya konteks
  // di tiap halaman, bukan cuma halaman pertama.
  const drawHeader = (judul: string): number => {
    let y = 14;
    setFont(13, "bold");
    doc.setTextColor(3, 105, 161);
    doc.text(settings.namaOrganisasi || "PAM Desa", W / 2, y, { align: "center" });
    y += 6;

    setFont(9);
    doc.setTextColor(80, 80, 80);
    if (settings.desa) {
      doc.text(
        `Desa ${settings.desa}${settings.kecamatan ? `, Kec. ${settings.kecamatan}` : ""}`,
        W / 2, y, { align: "center" }
      );
      y += 5;
    }

    setFont(10, "bold");
    doc.setTextColor(30, 30, 30);
    doc.text(judul.toUpperCase(), W / 2, y, { align: "center" });
    y += 8;

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margin, y, W - margin, y);
    return y + 4;
  };

  // Footer + nomor halaman — dipanggil setelah SEMUA halaman selesai dirender
  // (jsPDF baru tahu total halaman setelah semua konten ditulis), lewat
  // doc.setPage() untuk kembali menulis footer di tiap halaman.
  const drawFootersWithPageNumbers = () => {
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setTextColor(150, 150, 150);
      setFont(6.5);
      doc.text(
        `Dicetak via AirKu — ${new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })} — Hal ${p}/${totalPages}`,
        W / 2, 202, { align: "center" }
      );
    }
  };

  // ── Bagian 1: Ringkasan Per Bulan ──────────────────────────────────────────
  const ringkasan = ringkasPerBulan(rows);
  let y = drawHeader(`Ringkasan Per Bulan — ${scopeLabel}`);

  const colsRingkasan = {
    bulan: { x: margin, w: 46 },
    pelanggan: { x: margin + 46, w: 34 },
    lunas: { x: margin + 80, w: 28 },
    ditagih: { x: margin + 108, w: 28 },
    menunggak: { x: margin + 136, w: 30 },
    terkumpul: { x: margin + 166, w: 54 },
    totalTagihan: { x: margin + 220, w: 54 },
  };

  setFont(7.5, "bold");
  doc.setTextColor(80, 80, 80);
  doc.text("Bulan", colsRingkasan.bulan.x, y);
  doc.text("Pelanggan", colsRingkasan.pelanggan.x, y);
  doc.text("Lunas", colsRingkasan.lunas.x, y);
  doc.text("Ditagih", colsRingkasan.ditagih.x, y);
  doc.text("Menunggak", colsRingkasan.menunggak.x, y);
  doc.text("Terkumpul", colsRingkasan.terkumpul.x + colsRingkasan.terkumpul.w, y, { align: "right" });
  doc.text("Total Tagihan", colsRingkasan.totalTagihan.x + colsRingkasan.totalTagihan.w, y, { align: "right" });
  y += 2;
  doc.line(margin, y, W - margin, y);
  y += 4;

  let grandTerkumpul = 0, grandTagihan = 0, grandM3 = 0, grandPelanggan = 0;

  ringkasan.forEach((rb, idx) => {
    if (y > 185) { doc.addPage(); y = drawHeader(`Ringkasan Per Bulan — ${scopeLabel} (lanjutan)`); }

    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y - 3, W - margin * 2, 6, "F");
    }

    setFont(7.5);
    doc.setTextColor(30, 30, 30);
    doc.text(rb.label, colsRingkasan.bulan.x, y);
    doc.text(String(rb.jumlahPelanggan), colsRingkasan.pelanggan.x, y);
    doc.setTextColor(21, 128, 61);
    doc.text(String(rb.jumlahLunas), colsRingkasan.lunas.x, y);
    doc.setTextColor(217, 119, 6);
    doc.text(String(rb.jumlahDitagih), colsRingkasan.ditagih.x, y);
    doc.setTextColor(185, 28, 28);
    doc.text(String(rb.jumlahMenunggak), colsRingkasan.menunggak.x, y);
    doc.setTextColor(30, 30, 30);
    doc.text(`Rp ${rb.totalTerkumpul.toLocaleString("id-ID")}`, colsRingkasan.terkumpul.x + colsRingkasan.terkumpul.w, y, { align: "right" });
    doc.text(`Rp ${rb.totalTagihan.toLocaleString("id-ID")}`, colsRingkasan.totalTagihan.x + colsRingkasan.totalTagihan.w, y, { align: "right" });
    y += 6;

    grandTerkumpul += rb.totalTerkumpul;
    grandTagihan += rb.totalTagihan;
    grandM3 += rb.totalM3;
    grandPelanggan += rb.jumlahPelanggan;
  });

  // Baris "Total Keseluruhan" butuh ~10mm ruang (garis + 1 baris teks) —
  // guard di batas lebih ketat (178, bukan 185) supaya tidak pernah jatuh
  // terlalu dekat dengan posisi footer tetap (y=202) di halaman yang sama.
  if (y > 178) { doc.addPage(); y = drawHeader(`Ringkasan Per Bulan — ${scopeLabel} (lanjutan)`); }

  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, W - margin, y);
  y += 5;

  setFont(8, "bold");
  doc.setTextColor(30, 30, 30);
  doc.text(`Total Keseluruhan (${ringkasan.length} bulan, ${grandPelanggan} baris pelanggan): Rp ${grandTagihan.toLocaleString("id-ID")}`, margin, y);
  doc.text(`Terkumpul: Rp ${grandTerkumpul.toLocaleString("id-ID")}`, margin + 110, y);
  doc.text(`Total Pemakaian: ${grandM3.toLocaleString("id-ID")} m³`, margin + 210, y);

  // ── Bagian 2: Detail Per Pelanggan Per Bulan ───────────────────────────────
  doc.addPage();
  y = drawHeader(`Detail Per Pelanggan — ${scopeLabel}`);

  const colsDetail = {
    no: { x: margin, w: 8 },
    bulan: { x: margin + 8, w: 26 },
    nama: { x: margin + 34, w: 46 },
    sambungan: { x: margin + 80, w: 24 },
    dusun: { x: margin + 104, w: 30 },
    rt: { x: margin + 134, w: 12 },
    pemakaian: { x: margin + 146, w: 24 },
    total: { x: margin + 170, w: 34 },
    status: { x: margin + 204, w: 24 },
  };

  const drawDetailHeader = () => {
    setFont(7.5, "bold");
    doc.setTextColor(80, 80, 80);
    doc.text("No", colsDetail.no.x, y);
    doc.text("Bulan", colsDetail.bulan.x, y);
    doc.text("Nama Pelanggan", colsDetail.nama.x, y);
    doc.text("No. Sambungan", colsDetail.sambungan.x, y);
    doc.text("Dusun", colsDetail.dusun.x, y);
    doc.text("RT", colsDetail.rt.x, y);
    doc.text("Pemakaian", colsDetail.pemakaian.x + colsDetail.pemakaian.w, y, { align: "right" });
    doc.text("Total", colsDetail.total.x + colsDetail.total.w, y, { align: "right" });
    doc.text("Status", colsDetail.status.x, y);
    y += 2;
    doc.line(margin, y, W - margin, y);
    y += 4;
  };
  drawDetailHeader();

  rows.forEach((row, idx) => {
    if (y > 185) {
      doc.addPage();
      y = drawHeader(`Detail Per Pelanggan — ${scopeLabel} (lanjutan)`);
      drawDetailHeader();
    }

    const isLunas = row.status === "lunas";

    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y - 3, W - margin * 2, 6, "F");
    }

    setFont(7.5);
    doc.setTextColor(30, 30, 30);
    doc.text(String(idx + 1), colsDetail.no.x, y);
    doc.text(labelBulan(row.bulan, row.tahun).slice(0, 12), colsDetail.bulan.x, y);
    doc.text(row.nama.slice(0, 24), colsDetail.nama.x, y);
    doc.text(row.nomorSambungan, colsDetail.sambungan.x, y);
    doc.text((row.dusun || "-").slice(0, 16), colsDetail.dusun.x, y);
    doc.text(row.rt || "-", colsDetail.rt.x, y);
    doc.text(`${row.pemakaian.toLocaleString("id-ID")} m³`, colsDetail.pemakaian.x + colsDetail.pemakaian.w, y, { align: "right" });
    doc.text(`Rp ${row.total.toLocaleString("id-ID")}`, colsDetail.total.x + colsDetail.total.w, y, { align: "right" });

    doc.setTextColor(
      isLunas ? 21 : row.menunggak ? 185 : 217,
      isLunas ? 128 : row.menunggak ? 28 : 119,
      isLunas ? 61 : row.menunggak ? 28 : 6
    );
    doc.text(isLunas ? "Lunas" : row.menunggak ? "Menunggak" : "Ditagih", colsDetail.status.x, y);
    y += 6;
  });

  drawFootersWithPageNumbers();

  const filename = `Rekap-Air-${scopeLabel.replace(/[\s–]/g, "-")}.pdf`;
  doc.save(filename);
}

// ─── Export Excel Rekap (Bulan Tertentu / Tahunan / Keseluruhan) ──────────────

const HEADER_FILL = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FF0369A1" } };
const HEADER_FONT = { color: { argb: "FFFFFFFF" }, bold: true, size: 10 };
const CURRENCY_FMT = '"Rp" #,##0';
const M3_FMT = '#,##0.00 "m³"';

export async function downloadExcelRekap(
  rows: RekapRow[],
  scope: ExportScope,
  settings: Pick<import("@/types").AppSettings, "namaOrganisasi" | "desa" | "kecamatan">
): Promise<void> {
  const { Workbook } = await import("exceljs");
  const scopeLabel = labelExportScope(scope);

  const wb = new Workbook();
  wb.creator = "AirKu";
  wb.created = new Date();

  // ── Sheet 1: Ringkasan Per Bulan ───────────────────────────────────────────
  const ringkasan = ringkasPerBulan(rows);
  const wsRingkasan = wb.addWorksheet("Ringkasan");

  wsRingkasan.mergeCells("A1:H1");
  wsRingkasan.getCell("A1").value = `${settings.namaOrganisasi || "PAM Desa"} — Ringkasan Rekap ${scopeLabel}`;
  wsRingkasan.getCell("A1").font = { bold: true, size: 13, color: { argb: "FF0369A1" } };
  wsRingkasan.getRow(1).height = 22;

  if (settings.desa) {
    wsRingkasan.mergeCells("A2:H2");
    wsRingkasan.getCell("A2").value = `Desa ${settings.desa}${settings.kecamatan ? `, Kec. ${settings.kecamatan}` : ""}`;
    wsRingkasan.getCell("A2").font = { size: 9, color: { argb: "FF505050" } };
  }

  const headerRowIdx = settings.desa ? 4 : 3;
  const headerRow = wsRingkasan.getRow(headerRowIdx);
  headerRow.values = ["Bulan", "Jumlah Pelanggan", "Lunas", "Ditagih", "Menunggak", "Terkumpul", "Total Tagihan", "Total Pemakaian"];
  headerRow.eachCell((cell) => { cell.fill = HEADER_FILL; cell.font = HEADER_FONT; });
  headerRow.height = 20;

  ringkasan.forEach((rb) => {
    const row = wsRingkasan.addRow([
      rb.label, rb.jumlahPelanggan, rb.jumlahLunas, rb.jumlahDitagih, rb.jumlahMenunggak,
      rb.totalTerkumpul, rb.totalTagihan, rb.totalM3,
    ]);
    row.getCell(6).numFmt = CURRENCY_FMT;
    row.getCell(7).numFmt = CURRENCY_FMT;
    row.getCell(8).numFmt = M3_FMT;
  });

  // Baris total keseluruhan
  const grandTerkumpul = ringkasan.reduce((a, r) => a + r.totalTerkumpul, 0);
  const grandTagihan = ringkasan.reduce((a, r) => a + r.totalTagihan, 0);
  const grandM3 = ringkasan.reduce((a, r) => a + r.totalM3, 0);
  const grandPelanggan = ringkasan.reduce((a, r) => a + r.jumlahPelanggan, 0);
  const totalRow = wsRingkasan.addRow([
    "TOTAL", grandPelanggan, "", "", "", grandTerkumpul, grandTagihan, grandM3,
  ]);
  totalRow.eachCell((cell) => { cell.font = { bold: true }; });
  totalRow.getCell(6).numFmt = CURRENCY_FMT;
  totalRow.getCell(7).numFmt = CURRENCY_FMT;
  totalRow.getCell(8).numFmt = M3_FMT;

  wsRingkasan.columns = [
    { width: 18 }, { width: 16 }, { width: 10 }, { width: 10 },
    { width: 12 }, { width: 18 }, { width: 18 }, { width: 18 },
  ];
  // Freeze header row supaya tetap terlihat saat scroll ke bawah — berguna
  // untuk laporan Keseluruhan yang bisa mencapai puluhan baris ringkasan.
  wsRingkasan.views = [{ state: "frozen", ySplit: headerRowIdx }];

  // ── Sheet 2: Detail Per Pelanggan Per Bulan ────────────────────────────────
  const wsDetail = wb.addWorksheet("Detail");

  wsDetail.mergeCells("A1:I1");
  wsDetail.getCell("A1").value = `${settings.namaOrganisasi || "PAM Desa"} — Detail Rekap ${scopeLabel}`;
  wsDetail.getCell("A1").font = { bold: true, size: 13, color: { argb: "FF0369A1" } };
  wsDetail.getRow(1).height = 22;

  const detailHeaderRow = wsDetail.getRow(3);
  detailHeaderRow.values = ["No", "Bulan", "Nama Pelanggan", "No. Sambungan", "Dusun", "RT", "Pemakaian", "Total", "Status"];
  detailHeaderRow.eachCell((cell) => { cell.fill = HEADER_FILL; cell.font = HEADER_FONT; });
  detailHeaderRow.height = 20;

  rows.forEach((row, idx) => {
    const status = row.status === "lunas" ? "Lunas" : row.menunggak ? "Menunggak" : "Ditagih";
    const excelRow = wsDetail.addRow([
      idx + 1, labelBulan(row.bulan, row.tahun), row.nama, row.nomorSambungan,
      row.dusun || "-", row.rt || "-", row.pemakaian, row.total, status,
    ]);
    excelRow.getCell(7).numFmt = M3_FMT;
    excelRow.getCell(8).numFmt = CURRENCY_FMT;
    const statusCell = excelRow.getCell(9);
    const statusColor =
      row.status === "lunas" ? "FF15803D" : row.menunggak ? "FFB91C1C" : "FFD97706";
    statusCell.font = { color: { argb: statusColor }, bold: true };
  });

  wsDetail.columns = [
    { width: 6 }, { width: 16 }, { width: 26 }, { width: 16 },
    { width: 18 }, { width: 8 }, { width: 14 }, { width: 16 }, { width: 14 },
  ];
  wsDetail.views = [{ state: "frozen", ySplit: 3 }];

  // ── Download ────────────────────────────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const filename = `Rekap-Air-${scopeLabel.replace(/[\s–]/g, "-")}.xlsx`;
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── WA Kolektif (belum bayar) ────────────────────────────────────────────────

export function buildWaKolektif(
  rows: RekapRow[],
  bulanLabel: string,
  namaOrganisasi: string
): string {
  const belum = rows.filter((r) => r.status === "belum");
  if (belum.length === 0) return "";

  const baris = [
    `*${namaOrganisasi || "PAM Desa"}*`,
    `Tagihan Air — *${bulanLabel}*`,
    ``,
    `Berikut pelanggan yang *belum membayar*:`,
    ``,
    ...belum.map(
      (r, i) =>
        `${i + 1}. ${r.nama} (${r.nomorSambungan}) — *${formatRp(r.total)}*`
    ),
    ``,
    `Total: ${belum.length} pelanggan — *${formatRp(belum.reduce((a, r) => a + r.total, 0))}*`,
    ``,
    `Harap segera melunasi. Terima kasih 🙏`,
  ];

  return baris.join("\n");
}
