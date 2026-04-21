/**
 * lib/export.ts
 * Generate PDF struk tagihan individual menggunakan jsPDF (client-side).
 * Tidak ada import server-side — semua lazy import agar Next.js tidak crash saat build.
 */

import { Tagihan, AppSettings } from "@/types";
import { formatRp, formatM3, formatTanggal } from "@/lib/helpers";
import { MONTHS } from "@/lib/constants";

// ─── Helper format bulan ──────────────────────────────────────────────────────

function labelBulan(bulan: number, tahun: number): string {
  return `${MONTHS[bulan - 1]} ${tahun}`;
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
  const statusLabel = tagihan.status === "lunas" ? "✓ LUNAS" : "⏳ BELUM BAYAR";

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
    `📊 *Data Meter*`,
    `• Meter Awal : ${formatM3(tagihan.meterAwal)}`,
    `• Meter Akhir: ${formatM3(tagihan.meterAkhir)}`,
    `• Pemakaian  : ${formatM3(tagihan.pemakaian)}`,
    ``,
    `💰 *Rincian Biaya*`,
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
    `Status: ${tagihan.status === "lunas" ? "✅ LUNAS" : "❌ BELUM BAYAR"}`,
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
  a.download = `${tagihan.nomorTagihan}.pdf`;
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
      const file = new File([blob], `${tagihan.nomorTagihan}.pdf`, {
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

export interface RekapRow {
  nama: string;
  nomorSambungan: string;
  dusun: string;
  rt: string;
  pemakaian: number;
  total: number;
  status: "lunas" | "belum";
}

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
    doc.text(isLunas ? "✓ Lunas" : "✗ Belum", cols.status.x, y);
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
    `💧 Tagihan Air — *${bulanLabel}*`,
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
