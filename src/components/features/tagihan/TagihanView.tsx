"use client";
import { useMemo, useState } from "react";
import { CheckCircle2, Clock, Search, X, Droplets, Filter, Info } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { toast } from "@/lib/toast";
import { isMenunggak, formatRp } from "@/lib/helpers";
import { updateTagihanStatus, saveActivityLog } from "@/lib/db";
import { downloadPdfTagihan, shareTagihan } from "@/lib/export";
import { MONTHS } from "@/lib/constants";
import { Tagihan } from "@/types";
import TagihanCard from "./TagihanCard";

type FilterStatus = "semua" | "lunas" | "belum";

export default function TagihanView() {
  const { tagihan, activeBulan, activeTahun, settings, members, userRole, showConfirm } = useAppStore();
  const isAdmin = userRole?.role === "admin";
  const [filter, setFilter] = useState<FilterStatus>("semua");
  const [search, setSearch] = useState("");

  // Gabungkan tagihan yang ada + virtual entries untuk member belum di-entry
  const allTagihan = useMemo(() => {
    const membersAktif = members.filter((m) => m.status === "aktif");
    const tagihanIds = new Set(tagihan.map((t) => t.memberId));
    const menunggakBulanIni = isMenunggak(activeBulan, activeTahun, activeBulan, activeTahun);

    // Virtual entries hanya dibuat jika sudah lewat tgl 25 (menunggak)
    // Jika belum lewat tgl 25, member yang belum dientry tidak perlu tampil di Tagihan
    const virtual: Tagihan[] = menunggakBulanIni
      ? membersAktif
          .filter((m) => m.id && !tagihanIds.has(m.id))
          .map((m) => ({
            id: `virtual-${m.id}`,
            memberId: m.id!,
            memberNama: m.nama,
            memberNomorSambungan: m.nomorSambungan,
            memberDusun: m.dusun ?? "",
            memberRT: m.rt ?? "",
            bulan: activeBulan,
            tahun: activeTahun,
            meterAwal: 0, meterAkhir: 0, pemakaian: 0,
            subtotalBlok1: 0, subtotalBlok2: 0, subtotalPemakaian: 0,
            total: 0,
            hargaHistoryId: "",
            abonemenSnapshot: settings.abonemen,
            hargaBlok1Snapshot: settings.hargaBlok1,
            batasBlokSnapshot: settings.batasBlok,
            hargaBlok2Snapshot: settings.hargaBlok2,
            blokTarifSnapshot: settings.blokTarif ?? [],
            abonemen: settings.abonemen,
            status: "belum" as const,
            blokSnapshot: [],
            tanggal: null, tanggalBayar: null, tanggalEntry: null,
            entryOleh: "", dibayarOleh: "", diinputOleh: "",
            nomorTagihan: "",
            catatan: "belum-dientry",
            _virtual: true,
          }))
      : [];

    // Gabung: tagihan nyata + virtual, sort: lunas → ditagih → menunggak → nama
    const combined = [...tagihan, ...virtual];
    combined.sort((a, b) => {
      const aVirtual = (a as Tagihan & { _virtual?: boolean })._virtual || a.catatan === "belum-dientry";
      const bVirtual = (b as Tagihan & { _virtual?: boolean })._virtual || b.catatan === "belum-dientry";
      const order = (t: Tagihan, isV: boolean) =>
        t.status === "lunas" ? 0 : isV ? 2 : 1;
      if (order(a, aVirtual) !== order(b, bVirtual)) return order(a, aVirtual) - order(b, bVirtual);
      return a.memberNama.localeCompare(b.memberNama, "id");
    });
    return combined;
  }, [tagihan, members, activeBulan, activeTahun, settings]);

  const filtered = allTagihan.filter((t) => {
    if (filter !== "semua" && t.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        t.memberNama.toLowerCase().includes(q) ||
        t.memberNomorSambungan.toLowerCase().includes(q) ||
        (t.memberDusun || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const membersAktif = members.filter((m) => m.status === "aktif");
  const jumlahLunas = allTagihan.filter((t) => t.status === "lunas").length;
  const jumlahDitagih = allTagihan.filter((t) => t.status === "belum" && !(t as Tagihan & { _virtual?: boolean })._virtual && t.catatan !== "belum-dientry").length;
  const jumlahMenunggak = allTagihan.filter((t) => t.status === "belum" && ((t as Tagihan & { _virtual?: boolean })._virtual || t.catatan === "belum-dientry")).length;

  const handleShare = async (t: Tagihan) => {
    try { await shareTagihan(t, settings); }
    catch { toast.error("Gagal share tagihan"); }
  };

  const handleDownload = async (t: Tagihan) => {
    try { await downloadPdfTagihan(t, settings); }
    catch { toast.error("Gagal download PDF"); }
  };

  const handleTandaiLunas = (t: Tagihan) => {
    showConfirm(
      "Tandai Lunas",
      `Konfirmasi pembayaran:\n\nPelanggan: ${t.memberNama}\nTagihan: ${formatRp(t.total)}\nBulan: ${MONTHS[t.bulan - 1]} ${t.tahun}\n\nWarga sudah membayar?`,
      async () => {
        try {
          await updateTagihanStatus(t.id!, "lunas");
          await saveActivityLog(
            "tandai_lunas",
            `${t.memberNama} — ${MONTHS[t.bulan - 1]} ${t.tahun} (${t.nomorTagihan || "manual"})`,
            userRole?.email ?? "", userRole?.role ?? ""
          );
          toast.success(`${t.memberNama} — Tandai lunas berhasil!`);
        } catch { toast.error("Gagal memperbarui status."); }
      }
    );
  };

  const bulanLabel = `${MONTHS[activeBulan - 1]} ${activeTahun}`;

  return (
    <div className="col-12 animate-fade-in-up">
      {/* Header info */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "6px 0" }}>
        <Droplets size={16} style={{ color: "var(--color-primary)" }} />
        <span style={{ fontWeight: 700, fontSize: 15, color: "var(--color-txt)" }}>{bulanLabel}</span>
      </div>

      {/* Stat row */}
      <div className="row-8">
        {[
          { label: "Lunas", value: `${jumlahLunas}/${membersAktif.length}`, color: "var(--color-lunas)" },
          { label: "Ditagih", value: String(jumlahDitagih), color: "var(--color-tunggakan)" },
          { label: "Menunggak", value: String(jumlahMenunggak), color: "var(--color-belum)" },
        ].map((s) => (
          <div key={s.label} className="card" style={{ flex: 1, padding: "10px 12px", borderLeft: `3px solid ${s.color}` }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-txt3)", textTransform: "uppercase", marginBottom: 3 }}>{s.label}</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: s.color, fontFamily: "JetBrains Mono, monospace", lineHeight: 1 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: "relative" }}>
        <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-txt3)" }} />
        <input
          className="input-field"
          style={{ paddingLeft: 36 }}
          placeholder="Cari nama, nomor, dusun…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--color-txt3)" }}
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 6 }}>
        {(["semua", "belum", "lunas"] as FilterStatus[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              flex: 1, height: 48, borderRadius: 8, fontSize: 13, fontWeight: 700,
              border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              background: filter === f ? "var(--color-primary)" : "var(--color-bg)",
              color: filter === f ? "white" : "var(--color-txt3)",
              outline: filter !== f ? "1px solid var(--color-border)" : "none",
            }}
          >
            {f === "semua" && <><Filter size={12} /> Semua</>}
            {f === "belum" && <><Clock size={12} /> Belum</>}
            {f === "lunas" && <><CheckCircle2 size={12} /> Lunas</>}
          </button>
        ))}
      </div>

      {/* Info jumlah */}
      {(search || filter !== "semua") && (
        <p style={{ fontSize: 13, color: "var(--color-txt3)" }}>
          {filtered.length} dari {allTagihan.length} tagihan
        </p>
      )}

      {/* Hint */}
      <div style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(3,105,161,0.07)", fontSize: 13, color: "var(--color-primary)", fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}>
        <Info size={14} style={{ flexShrink: 0 }} />
        Entry pembayaran via menu <strong>Entry</strong>. Belum dientry otomatis tampil Menunggak jika lewat tgl 25.
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <Droplets size={32} style={{ margin: "0 auto 8px", opacity: 0.3 }} />
          <p style={{ fontSize: 13 }}>
            {allTagihan.length === 0 ? `Belum ada tagihan untuk ${bulanLabel}.` : "Tidak ada yang sesuai filter."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((t) => (
            <TagihanCard
              key={t.id}
              tagihan={t}
              onShare={t.id?.startsWith("virtual-") ? undefined : handleShare}
              onDownload={t.id?.startsWith("virtual-") ? undefined : handleDownload}
              onTandaiLunas={isAdmin && !t.id?.startsWith("virtual-") ? handleTandaiLunas : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
