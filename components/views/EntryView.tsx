"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Search, ChevronRight, ChevronLeft, Droplets, CheckCircle2,
  AlertCircle, RefreshCw, User, Zap, Gauge,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { listenMembers, getLastMeter, saveTagihan, cekTagihanSudahAda, saveActivityLog, getLatestHargaHistoryId } from "@/lib/db";
import { hitungTagihan, formatRp, formatM3 } from "@/lib/helpers";
import { MONTHS, QUICKPAY_PRESETS } from "@/lib/constants";
import { Member } from "@/types";

type EntryMode = "meter" | "quickpay";

// ─── Step dot ────────────────────────────────────────────────────────────────

function StepDot({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <div style={{
      width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center",
      justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0,
      background: done ? "var(--color-lunas)" : active ? "var(--color-primary)" : "var(--color-border)",
      color: done || active ? "#fff" : "var(--color-txt3)",
    }}>
      {done ? <CheckCircle2 size={14} /> : label}
    </div>
  );
}

// ─── QuickPay preset button ───────────────────────────────────────────────────

function PresetBtn({ value, selected, onSelect }: { value: number; selected: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      style={{
        padding: "10px 4px", borderRadius: 10, fontSize: 14, fontWeight: 700,
        border: selected ? "2px solid var(--color-primary)" : "2px solid var(--color-border)",
        background: selected ? "rgba(3,105,161,0.1)" : "var(--color-bg)",
        color: selected ? "var(--color-primary)" : "var(--color-txt)",
        cursor: "pointer", fontFamily: "JetBrains Mono, monospace",
      }}
    >
      {value}rb
    </button>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function EntryView() {
  const { settings, activeBulan, activeTahun, userRole, showConfirm, addToast } = useAppStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [mode, setMode] = useState<EntryMode>("meter");
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Meter mode
  const [meterAwal, setMeterAwal] = useState<number | "">("");
  const [meterAkhir, setMeterAkhir] = useState<number | "">("");
  const [meterAwalAuto, setMeterAwalAuto] = useState(false);
  const [loadingMeter, setLoadingMeter] = useState(false);

  // QuickPay mode
  const [qpPreset, setQpPreset] = useState<number | null>(null);
  const [qpManual, setQpManual] = useState("");     // ribuan, x1000
  const [qpNominal, setQpNominal] = useState(0);   // nilai akhir rupiah

  const [catatan, setCatatan] = useState("");
  const [sudahAda, setSudahAda] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedResult, setSavedResult] = useState<{ nama: string; total: number } | null>(null);

  const meterAkhirRef = useRef<HTMLInputElement>(null);
  const qpManualRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = listenMembers((data) => setMembers(data.filter((m) => m.status === "aktif")));
    return unsub;
  }, []);

  // Update qpNominal saat preset atau manual berubah
  useEffect(() => {
    if (qpPreset !== null) {
      setQpNominal(qpPreset * 1000);
    } else if (qpManual !== "") {
      const v = parseInt(qpManual.replace(/\D/g, "")) || 0;
      setQpNominal(v * 1000);
    } else {
      setQpNominal(0);
    }
  }, [qpPreset, qpManual]);

  const filteredMembers = members.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return m.nama.toLowerCase().includes(q) || m.nomorSambungan.toLowerCase().includes(q)
      || m.dusun.toLowerCase().includes(q) || m.rt.toLowerCase().includes(q);
  });

  const handleSelectMember = useCallback(async (member: Member) => {
    setSelectedMember(member);
    setMeterAwal(""); setMeterAkhir(""); setCatatan("");
    setMeterAwalAuto(false); setSudahAda(false); setSavedResult(null);
    setQpPreset(null); setQpManual("");
    setStep(2);

    if (member.id) {
      const ada = await cekTagihanSudahAda(member.id, activeBulan, activeTahun);
      if (ada) { setSudahAda(true); return; }
    }

    if (mode === "meter") {
      setLoadingMeter(true);
      try {
        const lastMeter = member.id ? await getLastMeter(member.id, activeBulan, activeTahun) : null;
        if (lastMeter !== null) { setMeterAwal(lastMeter); setMeterAwalAuto(true); }
        else { setMeterAwal(member.meterAwalPertama ?? ""); setMeterAwalAuto(false); }
      } finally {
        setLoadingMeter(false);
        setTimeout(() => meterAkhirRef.current?.focus(), 100);
      }
    } else {
      setTimeout(() => qpManualRef.current?.focus(), 100);
    }
  }, [activeBulan, activeTahun, mode]);

  // Kalkulasi meter mode
  const meterAwalNum = typeof meterAwal === "number" ? meterAwal : 0;
  const meterAkhirNum = typeof meterAkhir === "number" ? meterAkhir : 0;
  const meterValid = typeof meterAwal === "number" && typeof meterAkhir === "number" && meterAkhir >= meterAwal;
  const kalkulasi = meterValid ? hitungTagihan(meterAwalNum, meterAkhirNum, settings) : null;

  // Simpan
  const handleSimpan = useCallback(async () => {
    if (!selectedMember?.id) return;

    const isQp = mode === "quickpay";
    const totalFinal = isQp ? qpNominal : kalkulasi?.total ?? 0;

    if (isQp && totalFinal <= 0) { addToast("error", "Nominal iuran harus lebih dari 0"); return; }
    if (!isQp && !meterValid) return;

    const hargaHistoryId = await getLatestHargaHistoryId() ?? "default";

    showConfirm(
      "Konfirmasi Simpan",
      `Simpan iuran untuk ${selectedMember.nama}?\nTotal: ${formatRp(totalFinal)}`,
      async () => {
        setSaving(true);
        try {
          const pemakaian = isQp ? 0 : (kalkulasi?.pemakaian ?? 0);

          await saveTagihan({
            memberId: selectedMember.id!,
            memberNama: selectedMember.nama,
            memberNomorSambungan: selectedMember.nomorSambungan,
            memberDusun: selectedMember.dusun,
            memberRT: selectedMember.rt,
            bulan: activeBulan, tahun: activeTahun,
            meterAwal: isQp ? 0 : meterAwalNum,
            meterAkhir: isQp ? 0 : meterAkhirNum,
            pemakaian,
            hargaHistoryId,
            abonemenSnapshot: settings.abonemen,
            hargaBlok1Snapshot: settings.hargaBlok1,
            batasBlokSnapshot: settings.batasBlok,
            hargaBlok2Snapshot: settings.hargaBlok2,
            subtotalBlok1: isQp ? 0 : (kalkulasi?.subtotalBlok1 ?? 0),
            subtotalBlok2: isQp ? 0 : (kalkulasi?.subtotalBlok2 ?? 0),
            subtotalPemakaian: isQp ? totalFinal : (kalkulasi?.subtotalPemakaian ?? 0),
            total: totalFinal,
            status: "belum",
            tanggalBayar: null,
            entryOleh: userRole?.email ?? "",
            catatan: catatan + (isQp ? " [iuran rata]" : ""),
          });

          await saveActivityLog(
            "entry_iuran",
            `${isQp ? "QuickPay" : "Entry meter"} ${selectedMember.nama} — ${MONTHS[activeBulan - 1]} ${activeTahun} — ${formatRp(totalFinal)}`,
            userRole?.email ?? "", userRole?.role ?? ""
          );

          addToast("success", `Tagihan ${selectedMember.nama} tersimpan!`);
          setSavedResult({ nama: selectedMember.nama, total: totalFinal });
          setStep(3);
        } catch (err) {
          console.error(err);
          addToast("error", "Gagal menyimpan. Coba lagi.");
        } finally {
          setSaving(false);
        }
      }
    );
  }, [selectedMember, mode, qpNominal, meterValid, kalkulasi, meterAwalNum, meterAkhirNum,
      activeBulan, activeTahun, settings, catatan, userRole, showConfirm, addToast]);

  const handleReset = () => {
    setStep(1); setSelectedMember(null); setSearch("");
    setMeterAwal(""); setMeterAkhir(""); setCatatan("");
    setSudahAda(false); setSavedResult(null);
    setQpPreset(null); setQpManual("");
  };

  const bulanLabel = `${MONTHS[activeBulan - 1]} ${activeTahun}`;

  return (
    <div style={{ paddingBottom: 100, padding: "16px 16px 100px" }}>

      {/* Mode toggle */}
      <div style={{
        display: "flex", borderRadius: 12, overflow: "hidden",
        border: "1px solid var(--color-border)", marginBottom: 14,
      }}>
        {([
          { key: "meter", label: "Meter Air", icon: <Gauge size={15} /> },
          { key: "quickpay", label: "Iuran Rata", icon: <Zap size={15} /> },
        ] as { key: EntryMode; label: string; icon: React.ReactNode }[]).map((m) => (
          <button
            key={m.key}
            onClick={() => { setMode(m.key); handleReset(); }}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "11px 8px", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer",
              background: mode === m.key ? "var(--color-primary)" : "var(--color-bg)",
              color: mode === m.key ? "#fff" : "var(--color-txt3)",
              transition: "all 0.15s",
            }}
          >
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      {/* Mode info */}
      <div style={{
        padding: "8px 12px", borderRadius: 8, marginBottom: 14, fontSize: 12,
        color: "var(--color-txt3)", background: "var(--color-bg)",
        border: "1px solid var(--color-border)",
      }}>
        {mode === "meter"
          ? "🔢 Input angka di meteran air pelanggan. Tagihan dihitung otomatis berdasarkan pemakaian."
          : "💰 Iuran rata — belum ada water meter. Input nominal langsung (misal: 25 = Rp 25.000)."}
      </div>

      {/* Step indicator */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
        <StepDot active={step === 1} done={step > 1} label="1" />
        <div style={{ flex: 1, height: 2, borderRadius: 2, background: step > 1 ? "var(--color-lunas)" : "var(--color-border)", margin: "0 6px" }} />
        <StepDot active={step === 2} done={step > 2} label="2" />
        <div style={{ flex: 1, height: 2, borderRadius: 2, background: step > 2 ? "var(--color-lunas)" : "var(--color-border)", margin: "0 6px" }} />
        <StepDot active={step === 3} done={false} label="3" />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--color-txt3)", marginBottom: 16 }}>
        <span>Pilih Pelanggan</span>
        <span>{mode === "meter" ? "Input Meter" : "Input Nominal"}</span>
        <span>Selesai</span>
      </div>

      {/* ── STEP 1: Pilih Pelanggan ── */}
      {step === 1 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ fontSize: 14, color: "var(--color-txt2)" }}>
            Pilih pelanggan untuk <strong>{bulanLabel}</strong>
          </p>
          <div style={{ position: "relative" }}>
            <Search size={17} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-txt3)" }} />
            <input className="input-field" style={{ paddingLeft: 38 }}
              placeholder="Cari nama, nomor, dusun, RT..."
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          {filteredMembers.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "var(--color-txt3)" }}>
              <User size={36} style={{ margin: "0 auto 8px", opacity: 0.4 }} />
              <p style={{ fontSize: 13 }}>
                {members.length === 0 ? "Belum ada pelanggan. Tambah di menu Pelanggan." : "Tidak ada yang cocok."}
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {filteredMembers.map((m) => (
                <button key={m.id} onClick={() => handleSelectMember(m)} className="card"
                  style={{ width: "100%", padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", textAlign: "left", cursor: "pointer" }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 15, color: "var(--color-txt)" }}>{m.nama}</p>
                    <p style={{ fontSize: 12, color: "var(--color-txt3)", marginTop: 2 }}>No. {m.nomorSambungan} · {m.dusun} RT {m.rt}</p>
                  </div>
                  <ChevronRight size={18} style={{ color: "var(--color-txt3)" }} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── STEP 2: Input ── */}
      {step === 2 && selectedMember && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Info pelanggan */}
          <div className="card" style={{ padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: 15, color: "var(--color-txt)" }}>{selectedMember.nama}</p>
              <p style={{ fontSize: 12, color: "var(--color-txt3)", marginTop: 2 }}>
                No. {selectedMember.nomorSambungan} · {selectedMember.dusun} RT {selectedMember.rt}
              </p>
            </div>
            <button onClick={() => { setStep(1); setSelectedMember(null); }} style={{
              display: "flex", alignItems: "center", gap: 4, fontSize: 12,
              color: "var(--color-primary)", background: "none", border: "none", cursor: "pointer",
            }}>
              <ChevronLeft size={13} /> Ganti
            </button>
          </div>

          {sudahAda ? (
            <div className="card" style={{ padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--color-tunggakan)", marginBottom: 8 }}>
                <AlertCircle size={20} />
                <strong>Tagihan sudah ada</strong>
              </div>
              <p style={{ fontSize: 13, color: "var(--color-txt2)", marginBottom: 12 }}>
                {selectedMember.nama} sudah punya tagihan untuk <strong>{bulanLabel}</strong>.
              </p>
              <button className="btn-secondary" style={{ width: "100%" }} onClick={handleReset}>Pilih Pelanggan Lain</button>
            </div>
          ) : loadingMeter ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "var(--color-txt3)" }}>
              <RefreshCw size={20} style={{ margin: "0 auto 8px", animation: "spin 1s linear infinite" }} />
              <p style={{ fontSize: 13 }}>Mengambil data meter...</p>
            </div>
          ) : mode === "meter" ? (
            /* ── METER MODE ── */
            <>
              <div className="card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
                <p style={{ fontWeight: 700, fontSize: 14, color: "var(--color-txt)" }}>Entry Meter — {bulanLabel}</p>

                {/* Meter Awal */}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-txt2)", display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    Meter Awal (m³)
                    {meterAwalAuto && (
                      <span style={{ fontSize: 11, background: "rgba(21,128,61,0.12)", color: "var(--color-lunas)", padding: "2px 8px", borderRadius: 20, fontWeight: 600 }}>
                        Otomatis
                      </span>
                    )}
                  </label>
                  <input className="input-field mono" type="number" inputMode="numeric" placeholder="0"
                    value={meterAwal} readOnly={meterAwalAuto}
                    style={meterAwalAuto ? { background: "var(--color-border)", cursor: "default" } : {}}
                    onChange={(e) => { setMeterAwal(e.target.value === "" ? "" : Number(e.target.value)); setMeterAwalAuto(false); }} />
                  {meterAwalAuto && (
                    <p style={{ fontSize: 11, color: "var(--color-txt3)", marginTop: 4 }}>
                      Dari meter akhir bulan lalu.{" "}
                      <button onClick={() => setMeterAwalAuto(false)} style={{ color: "var(--color-primary)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", fontSize: 11 }}>
                        Edit manual
                      </button>
                    </p>
                  )}
                </div>

                {/* Meter Akhir */}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-txt2)", display: "block", marginBottom: 6 }}>Meter Sekarang (m³)</label>
                  <input ref={meterAkhirRef} className="input-field mono" type="number" inputMode="numeric"
                    placeholder="Angka di meteran" value={meterAkhir}
                    onChange={(e) => setMeterAkhir(e.target.value === "" ? "" : Number(e.target.value))} />
                  {typeof meterAkhir === "number" && typeof meterAwal === "number" && meterAkhir < meterAwal && (
                    <p style={{ fontSize: 11, color: "var(--color-belum)", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                      <AlertCircle size={11} /> Meter sekarang tidak boleh kurang dari meter awal
                    </p>
                  )}
                </div>

                {/* Catatan */}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-txt2)", display: "block", marginBottom: 6 }}>Catatan (opsional)</label>
                  <textarea className="input-field" style={{ resize: "none" }} rows={2}
                    placeholder="cth: meter baru, bocor, dll" value={catatan}
                    onChange={(e) => setCatatan(e.target.value)} />
                </div>
              </div>

              {/* Preview kalkulasi */}
              {kalkulasi && (
                <div className="card" style={{ padding: 14 }}>
                  <p style={{ fontWeight: 700, fontSize: 13, color: "var(--color-txt)", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                    <Droplets size={15} style={{ color: "var(--color-accent)" }} /> Preview Tagihan
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
                    {[
                      { label: "Pemakaian", val: formatM3(kalkulasi.pemakaian) },
                      { label: "Abonemen", val: formatRp(settings.abonemen) },
                      ...(kalkulasi.subtotalBlok1 > 0 ? [{ label: `Blok 1 (≤${settings.batasBlok}m³)`, val: formatRp(kalkulasi.subtotalBlok1) }] : []),
                      ...(kalkulasi.subtotalBlok2 > 0 ? [{ label: `Blok 2 (>${settings.batasBlok}m³)`, val: formatRp(kalkulasi.subtotalBlok2) }] : []),
                    ].map((row) => (
                      <div key={row.label} style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "var(--color-txt3)" }}>{row.label}</span>
                        <span className="mono">{row.val}</span>
                      </div>
                    ))}
                    <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: 8, display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 15 }}>
                      <span style={{ color: "var(--color-txt)" }}>Total</span>
                      <span className="mono" style={{ color: "var(--color-primary)" }}>{formatRp(kalkulasi.total)}</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* ── QUICKPAY MODE ── */
            <div className="card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
              <p style={{ fontWeight: 700, fontSize: 14, color: "var(--color-txt)" }}>
                💰 Iuran Rata — {bulanLabel}
              </p>

              {/* Preset buttons */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-txt2)", display: "block", marginBottom: 8 }}>
                  Pilih Nominal (ribu rupiah)
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
                  {QUICKPAY_PRESETS.map((v) => (
                    <PresetBtn key={v} value={v} selected={qpPreset === v}
                      onSelect={() => { setQpPreset(v === qpPreset ? null : v); setQpManual(""); }} />
                  ))}
                </div>
              </div>

              {/* Manual input */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-txt2)", display: "block", marginBottom: 6 }}>
                  Atau ketik manual (dalam ribuan)
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input ref={qpManualRef} className="input-field mono" inputMode="numeric"
                    placeholder="cth: 25 = Rp 25.000"
                    value={qpManual}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "");
                      setQpManual(v);
                      setQpPreset(null);
                    }}
                    style={{ flex: 1 }}
                  />
                  <span style={{ fontSize: 13, color: "var(--color-txt3)", whiteSpace: "nowrap" }}>× 1.000</span>
                </div>
              </div>

              {/* Preview total */}
              {qpNominal > 0 && (
                <div style={{
                  background: "rgba(3,105,161,0.08)", borderRadius: 10, padding: "12px 14px",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <span style={{ fontSize: 14, color: "var(--color-txt2)", fontWeight: 600 }}>Total Iuran</span>
                  <span className="mono" style={{ fontSize: 22, fontWeight: 800, color: "var(--color-primary)" }}>
                    {formatRp(qpNominal)}
                  </span>
                </div>
              )}

              {/* Catatan */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-txt2)", display: "block", marginBottom: 6 }}>Catatan (opsional)</label>
                <textarea className="input-field" style={{ resize: "none" }} rows={2}
                  placeholder="cth: bayar tunai, lewat transfer, dll" value={catatan}
                  onChange={(e) => setCatatan(e.target.value)} />
              </div>
            </div>
          )}

          {/* Tombol simpan */}
          {!sudahAda && !loadingMeter && (
            <button className="btn-primary" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              disabled={saving || (mode === "meter" ? !meterValid : qpNominal <= 0)}
              onClick={handleSimpan}>
              {saving ? (
                <><RefreshCw size={17} style={{ animation: "spin 1s linear infinite" }} /> Menyimpan...</>
              ) : (
                <><CheckCircle2 size={17} /> Simpan Tagihan</>
              )}
            </button>
          )}
        </div>
      )}

      {/* ── STEP 3: Sukses ── */}
      {step === 3 && savedResult && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="card" style={{ padding: 24, textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(21,128,61,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <CheckCircle2 size={32} style={{ color: "var(--color-lunas)" }} />
            </div>
            <p style={{ fontWeight: 800, fontSize: 18, color: "var(--color-txt)" }}>Berhasil Disimpan!</p>
            <p style={{ fontSize: 13, color: "var(--color-txt3)", marginTop: 4 }}>{savedResult.nama} · {bulanLabel}</p>
            <div style={{ marginTop: 14, background: "var(--color-bg)", borderRadius: 10, padding: "12px 16px" }}>
              <p style={{ fontSize: 13, color: "var(--color-txt3)" }}>Total Tagihan</p>
              <p className="mono" style={{ fontSize: 24, fontWeight: 800, color: "var(--color-lunas)", marginTop: 2 }}>
                {formatRp(savedResult.total)}
              </p>
            </div>
          </div>
          <button className="btn-primary" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            onClick={handleReset}>
            <User size={17} /> Entry Pelanggan Berikutnya
          </button>
        </div>
      )}
    </div>
  );
}
