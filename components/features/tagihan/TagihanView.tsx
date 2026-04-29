"use client";
import { useState } from "react";
import { CheckCircle2, Clock, Search, X, Droplets, Filter } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { formatRp } from "@/lib/helpers";
import { downloadPdfTagihan, shareTagihan } from "@/lib/export";
import { MONTHS } from "@/lib/constants";
import { Tagihan } from "@/types";
import TagihanCard from "./TagihanCard";

type FilterStatus = "semua" | "lunas" | "belum";

export default function TagihanView() {
  const { tagihan, activeBulan, activeTahun, userRole, addToast, settings } = useAppStore();
  const [filter, setFilter] = useState<FilterStatus>("semua");
  const [search, setSearch] = useState("");

  const filtered = tagihan.filter((t) => {
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

  const jumlahLunas = tagihan.filter((t) => t.status === "lunas").length;
  const jumlahBelum = tagihan.filter((t) => t.status === "belum").length;
  const totalTerkumpul = tagihan.filter((t) => t.status === "lunas").reduce((s, t) => s + t.total, 0);

  const handleShare = async (t: Tagihan) => {
    try { await shareTagihan(t, settings); }
    catch { addToast("error", "Gagal share tagihan"); }
  };

  const handleDownload = async (t: Tagihan) => {
    try { await downloadPdfTagihan(t, settings); }
    catch { addToast("error", "Gagal download PDF"); }
  };

  const bulanLabel = `${MONTHS[activeBulan - 1]} ${activeTahun}`;

  return (
    <div className="col-10 animate-fade-in-up">
      {/* Header info */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "6px 0" }}>
        <Droplets size={16} style={{ color: "var(--color-primary)" }} />
        <span style={{ fontWeight: 700, fontSize: 15, color: "var(--color-txt)" }}>{bulanLabel}</span>
      </div>

      {/* Stat row */}
      <div className="row-8">
        {[
          { label: "Terkumpul", value: formatRp(totalTerkumpul), color: "var(--color-primary)" },
          { label: "Lunas", value: `${jumlahLunas}/${tagihan.length}`, color: "var(--color-lunas)" },
          { label: "Belum", value: String(jumlahBelum), color: "var(--color-belum)" },
        ].map((s) => (
          <div key={s.label} className="card" style={{ flex: 1, padding: "10px 8px", borderLeft: `3px solid ${s.color}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--color-txt3)", textTransform: "uppercase", marginBottom: 3 }}>{s.label}</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: s.color, fontFamily: "JetBrains Mono, monospace", lineHeight: 1 }}>{s.value}</div>
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
              flex: 1, height: 36, borderRadius: 8, fontSize: 12, fontWeight: 700,
              border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
              background: filter === f ? "var(--color-primary)" : "var(--color-bg)",
              color: filter === f ? "#fff" : "var(--color-txt3)",
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
        <p style={{ fontSize: 12, color: "var(--color-txt3)" }}>
          {filtered.length} dari {tagihan.length} tagihan
        </p>
      )}

      {/* Hint */}
      <div style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(3,105,161,0.07)", fontSize: 12, color: "var(--color-primary)", fontWeight: 500 }}>
        💡 Entry pembayaran dilakukan di menu <strong>Entry Bayar</strong>. Belum entry = Belum Bayar otomatis.
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <Droplets size={32} style={{ margin: "0 auto 8px", opacity: 0.3 }} />
          <p style={{ fontSize: 13 }}>
            {tagihan.length === 0 ? `Belum ada tagihan untuk ${bulanLabel}.` : "Tidak ada yang sesuai filter."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((t) => (
            <TagihanCard
              key={t.id}
              tagihan={t}
              onShare={handleShare}
              onDownload={handleDownload}
            />
          ))}
        </div>
      )}
    </div>
  );
}
