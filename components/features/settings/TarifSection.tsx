"use client";
import { useState, useEffect } from "react";
import { DollarSign, Plus, Trash2, Edit2, History } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { formatRp, formatTanggal } from "@/lib/helpers";
import { updateSettings, saveHargaHistory, getHargaHistoryList, saveActivityLog } from "@/lib/db";
import { AppSettings, HargaHistory, UserRole, BlokTarif } from "@/types";
import SettingsSection from "./SettingsSection";

interface TarifSectionProps {
  settings: AppSettings;
  userRole: UserRole | null;
  addToast: (t: "success" | "error" | "info", m: string) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void, danger?: boolean) => void;
}

export default function TarifSection({ settings, userRole, addToast, showConfirm }: TarifSectionProps) {
  const [editing, setEditing] = useState(false);
  const [abonemen, setAbonemen] = useState(String(settings.abonemen));
  const [catatan, setCatatan] = useState("");
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<HargaHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const initBlok = () => {
    const src = settings.blokTarif && settings.blokTarif.length > 0
      ? settings.blokTarif
      : [{ batasAtas: settings.batasBlok, harga: settings.hargaBlok1 }, { batasAtas: null, harga: settings.hargaBlok2 }];
    return src.map((b) => ({ batasAtas: b.batasAtas !== null ? String(b.batasAtas) : "", harga: String(b.harga) }));
  };

  const [bloks, setBloks] = useState<{ batasAtas: string; harga: string }[]>(initBlok);

  useEffect(() => {
    if (!editing) { setAbonemen(String(settings.abonemen)); setBloks(initBlok()); }
  }, [settings, editing]);

  const updateBlok = (idx: number, field: "batasAtas" | "harga", val: string) => {
    setBloks((prev) => prev.map((b, i) => i === idx ? { ...b, [field]: val } : b));
  };

  const tambahBlok = () => {
    setBloks((prev) => {
      const copy = [...prev];
      const last = copy[copy.length - 1];
      const prevBatas = copy.length >= 2 ? (parseInt(copy[copy.length - 2].batasAtas) || 0) : 0;
      if (!last.batasAtas) copy[copy.length - 1] = { ...last, batasAtas: String(prevBatas + 10) };
      copy.push({ batasAtas: "", harga: "" });
      return copy;
    });
  };

  const hapusBlok = (idx: number) => {
    setBloks((prev) => {
      if (prev.length <= 2) { addToast("error", "Minimal 2 blok tarif"); return prev; }
      const copy = prev.filter((_, i) => i !== idx);
      copy[copy.length - 1] = { ...copy[copy.length - 1], batasAtas: "" };
      return copy;
    });
  };

  const handleSave = () => {
    const a = parseInt(abonemen) || 0;
    if (a <= 0) { addToast("error", "Abonemen harus lebih dari 0"); return; }
    for (let i = 0; i < bloks.length; i++) {
      const h = parseInt(bloks[i].harga) || 0;
      if (h <= 0) { addToast("error", `Harga blok ${i + 1} harus lebih dari 0`); return; }
      if (i < bloks.length - 1) {
        const batas = parseInt(bloks[i].batasAtas) || 0;
        if (batas <= 0) { addToast("error", `Batas atas blok ${i + 1} harus diisi`); return; }
        if (i > 0) {
          const prevBatas = parseInt(bloks[i - 1].batasAtas) || 0;
          if (batas <= prevBatas) { addToast("error", `Batas blok ${i + 1} harus lebih besar dari blok ${i}`); return; }
        }
      }
    }
    const blokTarif: BlokTarif[] = bloks.map((b, i) => ({
      batasAtas: i === bloks.length - 1 ? null : (parseInt(b.batasAtas) || 0),
      harga: parseInt(b.harga) || 0,
    }));
    const h1 = blokTarif[0].harga;
    const batas = (blokTarif[0].batasAtas as number) || 10;
    const h2 = blokTarif[1]?.harga || 0;
    showConfirm("Simpan Tarif Baru",
      "Perubahan tarif TIDAK mempengaruhi tagihan lama. Tagihan baru akan menggunakan tarif ini.",
      async () => {
        setSaving(true);
        try {
          await updateSettings({ abonemen: a, hargaBlok1: h1, batasBlok: batas, hargaBlok2: h2, blokTarif });
          await saveHargaHistory({
            abonemen: a, hargaBlok1: h1, batasBlok: batas, hargaBlok2: h2, blokTarif,
            catatan: catatan.trim() || `Perubahan tarif (${blokTarif.length} blok)`,
            diubahOleh: userRole?.email || "", tanggal: null,
          });
          const logDetail = blokTarif.map((b, i) =>
            `blok${i + 1}=${formatRp(b.harga)}/m³${b.batasAtas !== null ? `(s/d ${b.batasAtas}m³)` : "(∞)"}`
          ).join(", ");
          await saveActivityLog("ubah_tarif",
            `Tarif diubah: abonemen=${formatRp(a)}, ${logDetail}`,
            userRole?.email || "", userRole?.role || "");
          addToast("success", `Tarif ${blokTarif.length} blok berhasil disimpan`);
          setEditing(false); setCatatan("");
        } catch { addToast("error", "Gagal menyimpan tarif"); }
        finally { setSaving(false); }
      }
    );
  };

  const loadHistory = async () => {
    if (showHistory) { setShowHistory(false); return; }
    setLoadingHistory(true);
    try { const list = await getHargaHistoryList(); setHistory(list); setShowHistory(true); }
    catch { addToast("error", "Gagal memuat riwayat tarif"); }
    finally { setLoadingHistory(false); }
  };

  const displayBlok = settings.blokTarif && settings.blokTarif.length > 0
    ? settings.blokTarif
    : [{ batasAtas: settings.batasBlok, harga: settings.hargaBlok1 }, { batasAtas: null, harga: settings.hargaBlok2 }];

  return (
    <SettingsSection icon={<DollarSign size={18} />} title="Tarif Air" defaultOpen>
      <div style={{ paddingTop: 12 }}>
        {/* Current tariff display */}
        <div style={{ background: "var(--color-bg)", borderRadius: 10, padding: "14px 16px", marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--color-txt3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Tarif Aktif</span>
            <span style={{ fontSize: 11, color: "var(--color-txt3)" }}>{displayBlok.length} Blok Pemakaian</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, paddingBottom: 8, borderBottom: "1px solid var(--color-border)" }}>
            <span style={{ fontSize: 13, color: "var(--color-txt2)" }}>Abonemen/bulan</span>
            <span className="mono" style={{ fontSize: 14, fontWeight: 700, color: "var(--color-txt)" }}>{formatRp(settings.abonemen)}</span>
          </div>
          {displayBlok.map((blok, idx) => {
            const prevBatas = idx > 0 ? (displayBlok[idx - 1].batasAtas as number) : 0;
            const rangeLabel = blok.batasAtas !== null ? `${prevBatas}–${blok.batasAtas} m³` : `> ${prevBatas} m³`;
            return (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-primary)" }}>Blok {idx + 1}</span>
                  <span style={{ fontSize: 12, color: "var(--color-txt3)", marginLeft: 8 }}>{rangeLabel}</span>
                </div>
                <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: "var(--color-txt)" }}>{formatRp(blok.harga)}/m³</span>
              </div>
            );
          })}
        </div>

        {/* Edit form */}
        {editing ? (
          <div className="col-12">
            <div>
              <label className="section-label">Abonemen (Rp/bulan)</label>
              <input className="input-field mono" inputMode="numeric" value={abonemen}
                onChange={(e) => setAbonemen(e.target.value.replace(/\D/g, ""))} />
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <label className="section-label" style={{ margin: 0 }}>Blok Pemakaian</label>
                <button onClick={tambahBlok}
                  style={{ fontSize: 12, fontWeight: 700, color: "var(--color-primary)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                  <Plus size={14} /> Tambah Blok
                </button>
              </div>
              {bloks.map((blok, idx) => {
                const isLast = idx === bloks.length - 1;
                const prevBatas = idx > 0 ? (parseInt(bloks[idx - 1].batasAtas) || 0) : 0;
                return (
                  <div key={idx} style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", borderRadius: 10, padding: "14px 16px", marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-primary)" }}>Blok {idx + 1}</span>
                      {idx >= 2 && (
                        <button onClick={() => hapusBlok(idx)}
                          style={{ color: "var(--color-belum)", background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <div>
                        <label className="section-label">Dari (m³)</label>
                        <input className="input-field mono" value={idx === 0 ? "0" : String(prevBatas)} disabled
                          style={{ background: "var(--color-border)", fontSize: 14, height: 44 }} />
                      </div>
                      <div>
                        <label className="section-label">{isLast ? "Sampai (∞)" : "Sampai (m³)"}</label>
                        <input className="input-field mono" inputMode="numeric"
                          value={isLast ? "∞" : blok.batasAtas} disabled={isLast}
                          style={isLast ? { background: "var(--color-border)", fontSize: 14, height: 44 } : { fontSize: 14, height: 44 }}
                          onChange={(e) => updateBlok(idx, "batasAtas", e.target.value.replace(/\D/g, ""))}
                          placeholder="cth: 10" />
                      </div>
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <label className="section-label">Harga (Rp/m³)</label>
                      <input className="input-field mono" inputMode="numeric" value={blok.harga}
                        onChange={(e) => updateBlok(idx, "harga", e.target.value.replace(/\D/g, ""))}
                        placeholder="cth: 2000" />
                    </div>
                  </div>
                );
              })}
            </div>
            <div>
              <label className="section-label">Catatan Perubahan (opsional)</label>
              <input className="input-field" placeholder="cth: penyesuaian tarif 2026" value={catatan} onChange={(e) => setCatatan(e.target.value)} />
            </div>
            <div className="row-8">
              <button className="btn-secondary" style={{ flex: 1, height: 48 }} onClick={() => setEditing(false)} disabled={saving}>Batal</button>
              <button className="btn-primary" style={{ flex: 2, height: 48 }} onClick={handleSave} disabled={saving}>
                {saving ? "Menyimpan..." : "Simpan Tarif"}
              </button>
            </div>
          </div>
        ) : (
          <button className="btn-secondary" style={{ width: "100%", height: 48 }} onClick={() => setEditing(true)}>
            <Edit2 size={15} /> Ubah Tarif
          </button>
        )}

        {/* History toggle */}
        <button
          onClick={loadHistory}
          style={{
            marginTop: 10, width: "100%", padding: "10px", background: "none",
            border: "none", cursor: "pointer", color: "var(--color-primary)",
            fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}
        >
          <History size={14} />
          {loadingHistory ? "Memuat..." : showHistory ? "Sembunyikan Riwayat" : "Lihat Riwayat Perubahan Tarif"}
        </button>

        {showHistory && (
          <div style={{ marginTop: 8, borderTop: "1px solid var(--color-border)", paddingTop: 10 }}>
            {history.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--color-txt3)", textAlign: "center" }}>Belum ada riwayat perubahan.</p>
            ) : history.map((h, i) => (
              <div key={h.id || i} style={{ padding: "10px 12px", borderRadius: 8, marginBottom: 6, background: "var(--color-bg)", border: "1px solid var(--color-border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: "var(--color-txt3)" }}>{formatTanggal(h.tanggal)}</span>
                  <span style={{ fontSize: 12, color: "var(--color-txt3)" }}>{h.diubahOleh}</span>
                </div>
                {h.blokTarif && h.blokTarif.length > 0 ? (
                  h.blokTarif.map((b, bi) => {
                    const prevB = bi > 0 ? h.blokTarif![bi - 1].batasAtas : 0;
                    return (
                      <div key={bi} className="mono" style={{ fontSize: 12, color: "var(--color-txt2)" }}>
                        Blok {bi + 1}: {formatRp(b.harga)}/m³ {b.batasAtas !== null ? `(${prevB}–${b.batasAtas}m³)` : `(>${prevB}m³)`}
                      </div>
                    );
                  })
                ) : (
                  <>
                    <div className="mono" style={{ fontSize: 13, color: "var(--color-txt)" }}>Abonemen: {formatRp(h.abonemen)} · Blok1: {formatRp(h.hargaBlok1)}/m³</div>
                    <div className="mono" style={{ fontSize: 13, color: "var(--color-txt2)" }}>Batas: {h.batasBlok}m³ · Blok2: {formatRp(h.hargaBlok2)}/m³</div>
                  </>
                )}
                {h.catatan && <div style={{ fontSize: 12, color: "var(--color-txt3)", marginTop: 4, fontStyle: "italic" }}>{h.catatan}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </SettingsSection>
  );
}
