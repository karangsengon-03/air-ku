"use client";
import { useState, useEffect } from "react";
import { DollarSign, Plus, Trash2, Edit2, History, Zap, Gauge } from "lucide-react";
import { toast } from "@/lib/toast";
import { formatRp, formatTanggal } from "@/lib/helpers";
import { updateSettings, saveHargaHistory, getHargaHistoryList, saveActivityLog } from "@/lib/db";
import { AppSettings, HargaHistory, UserRole, BlokTarif, TipeBlok, ModeTarif, ModePembayaran } from "@/types";
import SettingsSection from "./SettingsSection";

interface TarifSectionProps {
  settings: AppSettings;
  userRole: UserRole | null;
  showConfirm: (title: string, message: string, onConfirm: () => void, danger?: boolean) => void;
}

interface BlokEdit {
  batasAtas: string;
  harga: string;
  tipe: TipeBlok;
}

export default function TarifSection({ settings, userRole, showConfirm }: TarifSectionProps) {
  const [editing, setEditing] = useState(false);
  const [abonemen, setAbonemen] = useState(String(settings.abonemen));
  const [catatan, setCatatan] = useState("");
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<HargaHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [modeTarif, setModeTarif] = useState<ModeTarif>(settings.modeTarif ?? "per_pelanggan");
  const [modeTarifGlobal, setModeTarifGlobal] = useState<"meter" | "rata">(settings.modeTarifGlobal ?? "meter");
  const [modePembayaran, setModePembayaran] = useState<ModePembayaran>(settings.modePembayaran ?? "per_member");

  const initBlok = (): BlokEdit[] => {
    const src = settings.blokTarif && settings.blokTarif.length > 0
      ? settings.blokTarif
      : [
          { batasAtas: settings.batasBlok, harga: settings.hargaBlok1, tipe: "per_m3" as TipeBlok },
          { batasAtas: null, harga: settings.hargaBlok2, tipe: "per_m3" as TipeBlok },
        ];
    return src.map((b) => ({
      batasAtas: b.batasAtas !== null ? String(b.batasAtas) : "",
      harga: String(b.harga),
      tipe: b.tipe ?? "per_m3",
    }));
  };

  const [bloks, setBloks] = useState<BlokEdit[]>(initBlok);

  useEffect(() => {
    if (!editing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAbonemen(String(settings.abonemen));
      setBloks(initBlok());
      setModeTarif(settings.modeTarif ?? "per_pelanggan");
      setModeTarifGlobal(settings.modeTarifGlobal ?? "meter");
      setModePembayaran(settings.modePembayaran ?? "per_member");
    }
  }, [settings, editing]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateBlok = (idx: number, field: keyof BlokEdit, val: string) => {
    setBloks((prev) => prev.map((b, i) => i === idx ? { ...b, [field]: val } : b));
  };

  const tambahBlok = () => {
    setBloks((prev) => {
      const copy = [...prev];
      const prevBatas = copy.length >= 2 ? (parseInt(copy[copy.length - 2].batasAtas) || 0) : 0;
      if (!copy[copy.length - 1].batasAtas) {
        copy[copy.length - 1] = { ...copy[copy.length - 1], batasAtas: String(prevBatas + 10) };
      }
      copy.push({ batasAtas: "", harga: "", tipe: "per_m3" });
      return copy;
    });
  };

  const hapusBlok = (idx: number) => {
    setBloks((prev) => {
      if (prev.length <= 2) { toast.error("Minimal 2 blok tarif"); return prev; }
      const copy = prev.filter((_, i) => i !== idx);
      copy[copy.length - 1] = { ...copy[copy.length - 1], batasAtas: "" };
      return copy;
    });
  };

  const handleSave = () => {
    const a = parseInt(abonemen) || 0;
    if (a < 0) { toast.error("Abonemen tidak boleh negatif"); return; }
    for (let i = 0; i < bloks.length; i++) {
      const h = parseInt(bloks[i].harga) || 0;
      if (h <= 0) { toast.error(`Harga blok ${i + 1} harus lebih dari 0`); return; }
      if (i < bloks.length - 1) {
        const batas = parseInt(bloks[i].batasAtas) || 0;
        if (batas <= 0) { toast.error(`Batas atas blok ${i + 1} harus diisi`); return; }
        if (i > 0) {
          const prevBatas = parseInt(bloks[i - 1].batasAtas) || 0;
          if (batas <= prevBatas) { toast.error(`Batas blok ${i + 1} harus lebih besar dari blok ${i}`); return; }
        }
      }
    }
    const blokTarif: BlokTarif[] = bloks.map((b, i) => ({
      batasAtas: i === bloks.length - 1 ? null : (parseInt(b.batasAtas) || 0),
      harga: parseInt(b.harga) || 0,
      tipe: b.tipe,
    }));
    const h1 = blokTarif[0].harga;
    const batas = (blokTarif[0].batasAtas as number) || 10;
    const h2 = blokTarif[1]?.harga || 0;

    showConfirm("Simpan Tarif Baru",
      "Perubahan tarif TIDAK mempengaruhi tagihan lama. Tagihan baru akan menggunakan tarif ini.",
      async () => {
        setSaving(true);
        try {
          await updateSettings({
            abonemen: a, hargaBlok1: h1, batasBlok: batas, hargaBlok2: h2, blokTarif,
            modeTarif, modeTarifGlobal, modePembayaran,
          });
          await saveHargaHistory({
            abonemen: a, hargaBlok1: h1, batasBlok: batas, hargaBlok2: h2, blokTarif,
            catatan: catatan.trim() || `Perubahan tarif (${blokTarif.length} blok)`,
            diubahOleh: userRole?.email || "", tanggal: null,
          });
          const logDetail = blokTarif.map((b, i) => {
            const label = b.tipe === "flat" ? `Flat ${formatRp(b.harga)}` : `${formatRp(b.harga)}/m³`;
            return `blok${i + 1}=${label}${b.batasAtas !== null ? `(s/d ${b.batasAtas}m³)` : "(∞)"}`;
          }).join(", ");
          await saveActivityLog("ubah_tarif",
            `Tarif diubah: abonemen=${formatRp(a)}, ${logDetail}, mode=${modeTarif}`,
            userRole?.email || "", userRole?.role || "");
          toast.success(`Tarif ${blokTarif.length} blok berhasil disimpan`);
          setEditing(false); setCatatan("");
        } catch { toast.error("Gagal menyimpan tarif"); }
        finally { setSaving(false); }
      }
    );
  };

  const loadHistory = async () => {
    if (showHistory) { setShowHistory(false); return; }
    setLoadingHistory(true);
    try { const list = await getHargaHistoryList(); setHistory(list); setShowHistory(true); }
    catch { toast.error("Gagal memuat riwayat tarif"); }
    finally { setLoadingHistory(false); }
  };

  const displayBlok = settings.blokTarif && settings.blokTarif.length > 0
    ? settings.blokTarif
    : [
        { batasAtas: settings.batasBlok, harga: settings.hargaBlok1, tipe: "per_m3" as TipeBlok },
        { batasAtas: null, harga: settings.hargaBlok2, tipe: "per_m3" as TipeBlok },
      ];

  return (
    <SettingsSection icon={<DollarSign size={18} />} title="Tarif Air" defaultOpen>
      <div style={{ paddingTop: 12 }}>
        {/* Tarif aktif display */}
        <div style={{ background: "var(--color-bg)", borderRadius: 10, padding: "14px 16px", marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-txt3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Tarif Aktif</span>
            <span style={{ fontSize: 13, color: "var(--color-txt3)" }}>{displayBlok.length} Blok</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, paddingBottom: 8, borderBottom: "1px solid var(--color-border)" }}>
            <span style={{ fontSize: 13, color: "var(--color-txt2)" }}>Abonemen/bulan</span>
            <span className="mono" style={{ fontSize: 15, fontWeight: 700, color: "var(--color-txt)" }}>{formatRp(settings.abonemen)}</span>
          </div>
          {displayBlok.map((blok, idx) => {
            const prevBatas = idx > 0 ? (displayBlok[idx - 1].batasAtas as number) : 0;
            const rangeLabel = blok.batasAtas !== null ? `${prevBatas}–${blok.batasAtas} m³` : `> ${prevBatas} m³`;
            const tipe = blok.tipe ?? "per_m3";
            return (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-primary)" }}>Blok {idx + 1}</span>
                  <span style={{ fontSize: 13, color: "var(--color-txt3)", marginLeft: 8 }}>{rangeLabel}</span>
                  <span style={{
                    marginLeft: 6, fontSize: 11, fontWeight: 700, padding: "1px 6px", borderRadius: 10,
                    background: tipe === "flat" ? "rgba(202,138,4,0.12)" : "rgba(3,105,161,0.10)",
                    color: tipe === "flat" ? "var(--color-tunggakan)" : "var(--color-primary)",
                  }}>
                    {tipe === "flat" ? "Flat" : "Per m³"}
                  </span>
                </div>
                <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: "var(--color-txt)" }}>
                  {formatRp(blok.harga)}{tipe === "flat" ? "/bulan" : "/m³"}
                </span>
              </div>
            );
          })}
          {/* Mode tarif display */}
          <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "var(--color-txt2)" }}>Mode Entry</span>
            <span style={{
              fontSize: 13, fontWeight: 700, padding: "2px 8px", borderRadius: 10,
              background: "rgba(3,105,161,0.10)", color: "var(--color-primary)",
            }}>
              {settings.modeTarif === "global"
                ? `Global (${settings.modeTarifGlobal === "meter" ? "Meter Air" : "Iuran Rata"})`
                : "Per Pelanggan"}
            </span>
          </div>
        </div>

        {/* Edit form */}
        {editing ? (
          <div className="col-12">
            <div>
              <label className="section-label">Abonemen (Rp/bulan)</label>
              <input className="input-field mono" inputMode="numeric" value={abonemen}
                onChange={(e) => setAbonemen(e.target.value.replace(/\D/g, ""))} />
            </div>

            {/* Blok Tarif */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <label className="section-label" style={{ margin: 0 }}>Blok Pemakaian</label>
                <button onClick={tambahBlok}
                  style={{ fontSize: 13, fontWeight: 700, color: "var(--color-primary)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
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

                    {/* Range */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                      <div>
                        <label className="section-label">Dari (m³)</label>
                        <div className="input-field mono" style={{ fontSize: 13, height: 44, display: "flex", alignItems: "center", color: "var(--color-txt3)", userSelect: "none" }}>
                          {idx === 0 ? "0" : String(prevBatas)}
                        </div>
                      </div>
                      <div>
                        <label className="section-label">{isLast ? "Sampai (∞)" : "Sampai (m³)"}</label>
                        {isLast ? (
                          <div className="input-field mono" style={{ fontSize: 13, height: 44, display: "flex", alignItems: "center", color: "var(--color-txt3)", userSelect: "none" }}>∞</div>
                        ) : (
                          <input className="input-field mono" inputMode="numeric"
                            value={blok.batasAtas} style={{ fontSize: 13, height: 44 }}
                            onChange={(e) => updateBlok(idx, "batasAtas", e.target.value.replace(/\D/g, ""))}
                            placeholder="cth: 10" />
                        )}
                      </div>
                    </div>

                    {/* Tipe tarif toggle */}
                    <div style={{ marginBottom: 8 }}>
                      <label className="section-label">Tipe Tarif</label>
                      <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", border: "1px solid var(--color-border)" }}>
                        {(["per_m3", "flat"] as TipeBlok[]).map((t) => (
                          <button key={t} onClick={() => updateBlok(idx, "tipe", t)}
                            style={{
                              flex: 1, padding: "10px 8px", fontSize: 13, fontWeight: 700,
                              border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                              background: blok.tipe === t ? "var(--color-primary)" : "var(--color-bg)",
                              color: blok.tipe === t ? "white" : "var(--color-txt3)",
                            }}>
                            {t === "per_m3" ? <><Gauge size={13} /> Per m³</> : <><Zap size={13} /> Flat/Tetap</>}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Harga */}
                    <div>
                      <label className="section-label">
                        {blok.tipe === "flat" ? "Harga Flat (Rp/bulan)" : "Harga (Rp/m³)"}
                      </label>
                      <input className="input-field mono" inputMode="numeric" value={blok.harga}
                        onChange={(e) => updateBlok(idx, "harga", e.target.value.replace(/\D/g, ""))}
                        placeholder={blok.tipe === "flat" ? "cth: 25000" : "cth: 3000"} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mode Tarif Entry */}
            <div>
              <label className="section-label">Mode Entry Tarif</label>
              <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", border: "1px solid var(--color-border)" }}>
                {([
                  { val: "per_pelanggan", label: "Per Pelanggan" },
                  { val: "global", label: "Global per Bulan" },
                ] as { val: ModeTarif; label: string }[]).map((m) => (
                  <button key={m.val} onClick={() => setModeTarif(m.val)}
                    style={{
                      flex: 1, padding: "10px 8px", fontSize: 13, fontWeight: 700,
                      border: "none", cursor: "pointer",
                      background: modeTarif === m.val ? "var(--color-primary)" : "var(--color-bg)",
                      color: modeTarif === m.val ? "white" : "var(--color-txt3)",
                    }}>
                    {m.label}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: 13, color: "var(--color-txt3)", marginTop: 6, lineHeight: 1.5 }}>
                {modeTarif === "per_pelanggan"
                  ? "Admin/penagih pilih mode Iuran Rata atau Meter Air per pelanggan saat entry."
                  : "Semua entry bulan ini mengikuti mode yang dipilih di bawah."}
              </p>
            </div>

            {/* Mode global (hanya tampil jika mode = global) */}
            {modeTarif === "global" && (
              <div>
                <label className="section-label">Mode Global Bulan Ini</label>
                <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", border: "1px solid var(--color-border)" }}>
                  {([
                    { val: "rata", label: "Iuran Rata", icon: <Zap size={13} /> },
                    { val: "meter", label: "Meter Air", icon: <Gauge size={13} /> },
                  ] as { val: "rata" | "meter"; label: string; icon: React.ReactNode }[]).map((m) => (
                    <button key={m.val} onClick={() => setModeTarifGlobal(m.val)}
                      style={{
                        flex: 1, padding: "10px 8px", fontSize: 13, fontWeight: 700,
                        border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        background: modeTarifGlobal === m.val ? "var(--color-primary)" : "var(--color-bg)",
                        color: modeTarifGlobal === m.val ? "white" : "var(--color-txt3)",
                      }}>
                      {m.icon}{m.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Mode Pembayaran */}
            <div>
              <label className="section-label">Mode Pembayaran Entry</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {([
                  { val: "per_member" as ModePembayaran, label: "Per Member", desc: "Admin pilih Langsung Lunas atau Catat Tagihan tiap entry" },
                  { val: "global_lunas" as ModePembayaran, label: "Global — Langsung Lunas", desc: "Semua entry otomatis langsung Lunas" },
                  { val: "global_tagihan" as ModePembayaran, label: "Global — Catat Tagihan", desc: "Semua entry otomatis Ditagih, tandai lunas terpisah" },
                ] as { val: ModePembayaran; label: string; desc: string }[]).map((m) => (
                  <button key={m.val} onClick={() => setModePembayaran(m.val)}
                    style={{
                      padding: "11px 14px", borderRadius: 10, border: `1.5px solid ${modePembayaran === m.val ? "var(--color-primary)" : "var(--color-border)"}`,
                      background: modePembayaran === m.val ? "rgba(3,105,161,0.08)" : "var(--color-bg)",
                      textAlign: "left", cursor: "pointer",
                    }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: modePembayaran === m.val ? "var(--color-primary)" : "var(--color-txt)" }}>{m.label}</div>
                    <div style={{ fontSize: 13, color: "var(--color-txt3)", marginTop: 2 }}>{m.desc}</div>
                  </button>
                ))}
              </div>
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

        {/* History */}
        <button onClick={loadHistory} style={{
          marginTop: 10, width: "100%", padding: "10px", background: "none",
          border: "none", cursor: "pointer", color: "var(--color-primary)",
          fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}>
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
                  <span style={{ fontSize: 13, color: "var(--color-txt3)" }}>{formatTanggal(h.tanggal)}</span>
                  <span style={{ fontSize: 13, color: "var(--color-txt3)" }}>{h.diubahOleh}</span>
                </div>
                {h.blokTarif && h.blokTarif.length > 0 ? (
                  h.blokTarif.map((b, bi) => {
                    const prevB = bi > 0 ? h.blokTarif![bi - 1].batasAtas : 0;
                    const tipe = b.tipe ?? "per_m3";
                    return (
                      <div key={bi} className="mono" style={{ fontSize: 13, color: "var(--color-txt2)" }}>
                        Blok {bi + 1} [{tipe === "flat" ? "Flat" : "Per m³"}]: {formatRp(b.harga)}{tipe === "flat" ? "/bln" : "/m³"} {b.batasAtas !== null ? `(${prevB}–${b.batasAtas}m³)` : `(>${prevB}m³)`}
                      </div>
                    );
                  })
                ) : (
                  <>
                    <div className="mono" style={{ fontSize: 13, color: "var(--color-txt)" }}>Abonemen: {formatRp(h.abonemen)} · Blok1: {formatRp(h.hargaBlok1)}/m³</div>
                    <div className="mono" style={{ fontSize: 13, color: "var(--color-txt2)" }}>Batas: {h.batasBlok}m³ · Blok2: {formatRp(h.hargaBlok2)}/m³</div>
                  </>
                )}
                {h.catatan && <div style={{ fontSize: 13, color: "var(--color-txt3)", marginTop: 4, fontStyle: "italic" }}>{h.catatan}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </SettingsSection>
  );
}
