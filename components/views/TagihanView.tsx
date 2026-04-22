"use client";
import { useState } from "react";
import { CheckCircle2, Clock, Share2, Download, Search, X, Droplets, Filter } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { formatRp, formatM3, formatTanggal } from "@/lib/helpers";
import { downloadPdfTagihan, shareTagihan } from "@/lib/export";
import { MONTHS } from "@/lib/constants";
import { Tagihan } from "@/types";

type FilterStatus = "semua" | "lunas" | "belum";

export default function TagihanView() {
  const { tagihan, activeBulan, activeTahun, userRole, addToast, settings } = useAppStore();
  const [filter, setFilter] = useState<FilterStatus>("semua");
  const [search, setSearch] = useState("");

  const isAdmin = userRole?.role === "admin";

  const filtered = tagihan.filter((t) => {
    if (filter !== "semua" && t.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return t.memberNama.toLowerCase().includes(q) ||
        t.memberNomorSambungan.toLowerCase().includes(q) ||
        (t.memberDusun || "").toLowerCase().includes(q);
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
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Header info */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "6px 0" }}>
        <Droplets size={16} style={{ color: "var(--color-primary)" }} />
        <span style={{ fontWeight: 700, fontSize: 15, color: "var(--color-txt)" }}>{bulanLabel}</span>
      </div>

      {/* Stat row */}
      <div style={{ display: "flex", gap: 8 }}>
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
        <input className="input-field" style={{ paddingLeft: 36 }}
          placeholder="Cari nama, nomor, dusun…"
          value={search} onChange={(e) => setSearch(e.target.value)} />
        {search && (
          <button onClick={() => setSearch("")} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--color-txt3)" }}>
            <X size={15} />
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 6 }}>
        {(["semua", "belum", "lunas"] as FilterStatus[]).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            style={{
              flex: 1, height: 36, borderRadius: 8, fontSize: 12, fontWeight: 700,
              border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
              background: filter === f ? "var(--color-primary)" : "var(--color-bg)",
              color: filter === f ? "#fff" : "var(--color-txt3)",
              outline: filter !== f ? "1px solid var(--color-border)" : "none",
            }}>
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

      {/* Hint tandai lunas */}
      <div style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(3,105,161,0.07)", fontSize: 12, color: "var(--color-primary)", fontWeight: 500 }}>
        💡 Untuk tandai lunas/belum — gunakan menu <strong>Entry</strong>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "32px 0", color: "var(--color-txt3)" }}>
          <Droplets size={32} style={{ margin: "0 auto 8px", opacity: 0.3 }} />
          <p style={{ fontSize: 13 }}>
            {tagihan.length === 0 ? `Belum ada tagihan untuk ${bulanLabel}.` : "Tidak ada yang sesuai filter."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((t) => {
            const lunas = t.status === "lunas";
            const isIuranRata = t.meterAwal === 0 && t.meterAkhir === 0;
            return (
              <div key={t.id} className="card" style={{
                padding: "12px 14px",
                borderLeft: `4px solid ${lunas ? "var(--color-lunas)" : "var(--color-belum)"}`,
              }}>
                {/* Nama + badge */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "var(--color-txt)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.memberNama}</div>
                    <div style={{ fontSize: 11, color: "var(--color-txt3)", marginTop: 1 }}>
                      No. {t.memberNomorSambungan} · {t.memberDusun ? `${t.memberDusun} / ` : ""}RT {t.memberRT}
                    </div>
                  </div>
                  <span className={lunas ? "badge-lunas" : "badge-belum"} style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 4, fontSize: 11, padding: "3px 8px", borderRadius: 20, fontWeight: 700,
                    background: lunas ? "rgba(21,128,61,0.12)" : "rgba(185,28,28,0.1)",
                    color: lunas ? "var(--color-lunas)" : "var(--color-belum)" }}>
                    {lunas ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                    {lunas ? "Lunas" : "Belum"}
                  </span>
                </div>

                {/* Detail */}
                <div style={{ display: "flex", gap: 12, fontSize: 12, color: "var(--color-txt2)", marginBottom: 8, flexWrap: "wrap" }}>
                  {isIuranRata ? (
                    <span style={{ fontStyle: "italic", color: "var(--color-txt3)" }}>iuran rata</span>
                  ) : (
                    <>
                      <span>Meter: <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{t.meterAwal} → {t.meterAkhir}</span></span>
                      <span>Pakai: <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{formatM3(t.pemakaian)}</span></span>
                    </>
                  )}
                </div>

                {/* Nominal + tanggal */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 18, fontWeight: 900, color: "var(--color-primary)", fontFamily: "JetBrains Mono, monospace" }}>{formatRp(t.total)}</span>
                  <div style={{ fontSize: 11, color: "var(--color-txt3)", textAlign: "right" }}>
                    <div>Entry: {formatTanggal(t.tanggalEntry)}</div>
                    {lunas && (t.tanggalBayar as boolean) && <div>Bayar: {formatTanggal(t.tanggalBayar)}</div>}
                  </div>
                </div>

                {/* Aksi — hanya share + download */}
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => handleShare(t)}
                    style={{ flex: 1, height: 38, borderRadius: 8, border: "1px solid var(--color-border)", background: "var(--color-bg)", color: "var(--color-primary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 12, fontWeight: 600 }}>
                    <Share2 size={14} /> Bagikan WA
                  </button>
                  <button onClick={() => handleDownload(t)}
                    style={{ width: 38, height: 38, borderRadius: 8, border: "1px solid var(--color-border)", background: "var(--color-bg)", color: "var(--color-txt3)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Download size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
