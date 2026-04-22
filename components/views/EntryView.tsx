"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import {
  Search, ChevronRight, ChevronLeft, Droplets, CheckCircle2,
  AlertCircle, RefreshCw, User, Zap, Gauge, Clock, Trash2,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { getLastMeter, saveTagihan, saveActivityLog, getLatestHargaHistoryId, updateTagihanStatus, deleteTagihan } from "@/lib/db";
import { hitungTagihan, formatRp, formatM3, formatTanggal } from "@/lib/helpers";
import { MONTHS, QUICKPAY_PRESETS } from "@/lib/constants";
import { Member, Tagihan } from "@/types";

type EntryMode = "meter" | "quickpay";
type ViewMode = "entry" | "status"; // entry = input baru, status = kelola yang sudah ada

function StepDot({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <div style={{
      width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center",
      justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0,
      background: done ? "var(--color-lunas)" : active ? "var(--color-primary)" : "var(--color-border)",
      color: done || active ? "#fff" : "var(--color-txt3)",
    }}>
      {done ? <CheckCircle2 size={13} /> : label}
    </div>
  );
}

export default function EntryView() {
  const { settings, activeBulan, activeTahun, userRole, showConfirm, addToast, members, tagihan } = useAppStore();
  const isAdmin = userRole?.role === "admin";
  const isLocked = settings.globalLock;

  const [viewMode, setViewMode] = useState<ViewMode>("entry");
  const [entryMode, setEntryMode] = useState<EntryMode>("quickpay");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [search, setSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Entry baru
  const [meterAwal, setMeterAwal] = useState<number | "">("");
  const [meterAkhir, setMeterAkhir] = useState<number | "">("");
  const [meterAwalAuto, setMeterAwalAuto] = useState(false);
  const [loadingMeter, setLoadingMeter] = useState(false);
  const [qpPreset, setQpPreset] = useState<number | null>(null);
  const [qpManual, setQpManual] = useState("");
  const [catatan, setCatatan] = useState("");
  const [sudahAda, setSudahAda] = useState<Tagihan | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedResult, setSavedResult] = useState<{ nama: string; total: number } | null>(null);

  const meterAkhirRef = useRef<HTMLInputElement>(null);
  const qpManualRef = useRef<HTMLInputElement>(null);

  // Baca members dari store (sudah diisi oleh useData di AppShell)
  const membersAktif = members.filter((m) => m.status === "aktif");

  // Filter search
  const filtered = membersAktif.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return m.nama.toLowerCase().includes(q) || m.nomorSambungan.toLowerCase().includes(q)
      || m.dusun.toLowerCase().includes(q) || m.rt.toLowerCase().includes(q);
  });

  // Tagihan bulan ini dari store
  const tagihanBulanIni = tagihan; // sudah difilter bulan aktif oleh useData

  const qpNominal = (() => {
    if (qpPreset !== null) return qpPreset * 1000;
    if (qpManual !== "") return (parseInt(qpManual.replace(/\D/g, "")) || 0) * 1000;
    return 0;
  })();

  const handleSelectMember = useCallback(async (member: Member) => {
    setSelectedMember(member);
    setMeterAwal(""); setMeterAkhir(""); setCatatan("");
    setMeterAwalAuto(false); setSudahAda(null); setSavedResult(null);
    setQpPreset(null); setQpManual("");

    // Cek sudah ada tagihan bulan ini dari store — INSTAN, tidak perlu Firestore call
    const existing = tagihanBulanIni.find((t) => t.memberId === member.id);
    setSudahAda(existing ?? null);
    setStep(2);

    if (existing) return; // sudah ada, tampilkan tombol tandai lunas saja

    if (entryMode === "meter") {
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
  }, [activeBulan, activeTahun, entryMode, tagihanBulanIni]);

  const meterAwalNum = typeof meterAwal === "number" ? meterAwal : 0;
  const meterAkhirNum = typeof meterAkhir === "number" ? meterAkhir : 0;
  const meterValid = typeof meterAwal === "number" && typeof meterAkhir === "number" && meterAkhir >= meterAwal;
  const kalkulasi = meterValid ? hitungTagihan(meterAwalNum, meterAkhirNum, settings) : null;

  const handleSimpan = useCallback(async () => {
    if (!selectedMember?.id) return;
    const isQp = entryMode === "quickpay";
    const totalFinal = isQp ? qpNominal : (kalkulasi?.total ?? 0);
    if (isQp && totalFinal <= 0) { addToast("error", "Nominal harus lebih dari 0"); return; }
    if (!isQp && !meterValid) return;
    if (isLocked) { addToast("error", "Aplikasi sedang dikunci"); return; }

    const hargaHistoryId = await getLatestHargaHistoryId() ?? "default";
    showConfirm("Konfirmasi Simpan", `Simpan untuk ${selectedMember.nama}?\nTotal: ${formatRp(totalFinal)}`,
      async () => {
        setSaving(true);
        try {
          await saveTagihan({
            memberId: selectedMember.id!, memberNama: selectedMember.nama,
            memberNomorSambungan: selectedMember.nomorSambungan,
            memberDusun: selectedMember.dusun, memberRT: selectedMember.rt,
            bulan: activeBulan, tahun: activeTahun,
            meterAwal: isQp ? 0 : meterAwalNum, meterAkhir: isQp ? 0 : meterAkhirNum,
            pemakaian: isQp ? 0 : (kalkulasi?.pemakaian ?? 0),
            hargaHistoryId,
            abonemenSnapshot: settings.abonemen, hargaBlok1Snapshot: settings.hargaBlok1,
            batasBlokSnapshot: settings.batasBlok, hargaBlok2Snapshot: settings.hargaBlok2,
            subtotalBlok1: isQp ? 0 : (kalkulasi?.subtotalBlok1 ?? 0),
            subtotalBlok2: isQp ? 0 : (kalkulasi?.subtotalBlok2 ?? 0),
            subtotalPemakaian: isQp ? totalFinal : (kalkulasi?.subtotalPemakaian ?? 0),
            total: totalFinal, status: "belum", tanggalBayar: null,
            entryOleh: userRole?.email ?? "",
            catatan: catatan + (isQp ? " [iuran rata]" : ""),
          });
          await saveActivityLog("entry_iuran",
            `${isQp ? "Iuran rata" : "Meter"} ${selectedMember.nama} — ${MONTHS[activeBulan - 1]} ${activeTahun} — ${formatRp(totalFinal)}`,
            userRole?.email ?? "", userRole?.role ?? "");
          addToast("success", `Tagihan ${selectedMember.nama} tersimpan!`);
          setSavedResult({ nama: selectedMember.nama, total: totalFinal });
          setStep(3);
        } catch (err) {
          console.error(err); addToast("error", "Gagal menyimpan. Coba lagi.");
        } finally { setSaving(false); }
      });
  }, [selectedMember, entryMode, qpNominal, meterValid, kalkulasi, meterAwalNum, meterAkhirNum,
      activeBulan, activeTahun, settings, catatan, userRole, showConfirm, addToast, isLocked]);

  const handleTandai = useCallback(async (t: Tagihan, newStatus: "lunas" | "belum") => {
    if (isLocked) { addToast("error", "Aplikasi sedang dikunci"); return; }
    showConfirm(
      newStatus === "lunas" ? "Tandai Lunas?" : "Tandai Belum Bayar?",
      `${t.memberNama} — ${formatRp(t.total)}`,
      async () => {
        try {
          await updateTagihanStatus(t.id!, newStatus);
          await saveActivityLog("tandai_lunas",
            `Tandai ${newStatus}: ${t.memberNama} — ${MONTHS[activeBulan - 1]} ${activeTahun}`,
            userRole?.email ?? "", userRole?.role ?? "");
          addToast("success", newStatus === "lunas" ? "Ditandai lunas!" : "Ditandai belum bayar");
        } catch { addToast("error", "Gagal mengubah status"); }
      }
    );
  }, [isLocked, showConfirm, activeBulan, activeTahun, userRole, addToast]);

  const handleHapus = useCallback(async (t: Tagihan) => {
    if (!isAdmin || isLocked) return;
    showConfirm("Hapus Tagihan?", `Hapus tagihan ${t.memberNama} — ${formatRp(t.total)}?\nAksi ini tidak bisa dibatalkan.`,
      async () => {
        try {
          await deleteTagihan(t.id!);
          await saveActivityLog("hapus_tagihan",
            `Hapus tagihan: ${t.memberNama} — ${MONTHS[activeBulan - 1]} ${activeTahun}`,
            userRole?.email ?? "", userRole?.role ?? "");
          addToast("success", "Tagihan dihapus");
        } catch { addToast("error", "Gagal menghapus"); }
      }, true);
  }, [isAdmin, isLocked, showConfirm, activeBulan, activeTahun, userRole, addToast]);

  const handleReset = () => {
    setStep(1); setSelectedMember(null); setSearch("");
    setMeterAwal(""); setMeterAkhir(""); setCatatan("");
    setSudahAda(null); setSavedResult(null); setQpPreset(null); setQpManual("");
  };

  const bulanLabel = `${MONTHS[activeBulan - 1]} ${activeTahun}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

      {/* View mode toggle */}
      <div style={{ display: "flex", borderRadius: 10, overflow: "hidden", border: "1px solid var(--color-border)" }}>
        {([
          { key: "entry", label: "📝 Catat Iuran" },
          { key: "status", label: "✅ Tandai Lunas" },
        ] as { key: ViewMode; label: string }[]).map((m) => (
          <button key={m.key} onClick={() => { setViewMode(m.key); handleReset(); }}
            style={{
              flex: 1, padding: "11px 8px", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer",
              background: viewMode === m.key ? "var(--color-primary)" : "var(--color-bg)",
              color: viewMode === m.key ? "#fff" : "var(--color-txt3)",
            }}>
            {m.label}
          </button>
        ))}
      </div>

      {/* ══════════ VIEW: TANDAI LUNAS ══════════ */}
      {viewMode === "status" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 13, color: "var(--color-txt3)", padding: "4px 0" }}>
            {tagihanBulanIni.length === 0 ? "Belum ada tagihan bulan ini." : `${tagihanBulanIni.length} tagihan — ${bulanLabel}`}
          </div>
          {tagihanBulanIni.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "var(--color-txt3)" }}>
              <Droplets size={32} style={{ margin: "0 auto 8px", opacity: 0.3 }} />
              <p style={{ fontSize: 13 }}>Belum ada tagihan untuk {bulanLabel}</p>
            </div>
          ) : (
            tagihanBulanIni.map((t) => {
              const lunas = t.status === "lunas";
              return (
                <div key={t.id} className="card" style={{ padding: "12px 14px", borderLeft: `4px solid ${lunas ? "var(--color-lunas)" : "var(--color-belum)"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: "var(--color-txt)" }}>{t.memberNama}</div>
                      <div style={{ fontSize: 11, color: "var(--color-txt3)" }}>No. {t.memberNomorSambungan} · {t.memberDusun} RT {t.memberRT}</div>
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 20,
                      background: lunas ? "rgba(21,128,61,0.12)" : "rgba(185,28,28,0.1)",
                      color: lunas ? "var(--color-lunas)" : "var(--color-belum)",
                    }}>
                      {lunas ? "Lunas" : "Belum"}
                    </span>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "var(--color-primary)", fontFamily: "monospace", marginBottom: 10 }}>{formatRp(t.total)}</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {lunas ? (
                      <button onClick={() => handleTandai(t, "belum")}
                        style={{ flex: 1, height: 40, borderRadius: 8, border: "1px solid var(--color-belum)", background: "rgba(185,28,28,0.07)", color: "var(--color-belum)", cursor: "pointer", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                        <Clock size={14} /> Tandai Belum
                      </button>
                    ) : (
                      <button onClick={() => handleTandai(t, "lunas")}
                        style={{ flex: 1, height: 40, borderRadius: 8, border: "none", background: "var(--color-lunas)", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                        <CheckCircle2 size={14} /> Tandai Lunas
                      </button>
                    )}
                    {isAdmin && (
                      <button onClick={() => handleHapus(t)}
                        style={{ width: 40, height: 40, borderRadius: 8, border: "1px solid var(--color-belum)", background: "rgba(185,28,28,0.07)", color: "var(--color-belum)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ══════════ VIEW: CATAT IURAN ══════════ */}
      {viewMode === "entry" && (
        <>
          {/* Entry mode toggle */}
          <div style={{ display: "flex", borderRadius: 10, overflow: "hidden", border: "1px solid var(--color-border)" }}>
            {([
              { key: "quickpay", label: "⚡ Iuran Rata" },
              { key: "meter", label: "🔢 Meter Air" },
            ] as { key: EntryMode; label: string }[]).map((m) => (
              <button key={m.key} onClick={() => { setEntryMode(m.key); handleReset(); }}
                style={{
                  flex: 1, padding: "9px 8px", fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer",
                  background: entryMode === m.key ? "rgba(3,105,161,0.1)" : "var(--color-bg)",
                  color: entryMode === m.key ? "var(--color-primary)" : "var(--color-txt3)",
                  borderBottom: entryMode === m.key ? "2px solid var(--color-primary)" : "2px solid transparent",
                }}>
                {m.label}
              </button>
            ))}
          </div>

          <div style={{ fontSize: 12, color: "var(--color-txt3)", padding: "2px 4px" }}>
            {entryMode === "quickpay"
              ? "💰 Belum ada water meter — nominal iuran diinput manual (contoh: 25 = Rp 25.000)"
              : "📊 Input angka meteran air pelanggan. Tagihan dihitung otomatis."}
          </div>

          {/* Step indicator */}
          <div style={{ display: "flex", alignItems: "center" }}>
            <StepDot active={step === 1} done={step > 1} label="1" />
            <div style={{ flex: 1, height: 2, borderRadius: 2, background: step > 1 ? "var(--color-lunas)" : "var(--color-border)", margin: "0 6px" }} />
            <StepDot active={step === 2} done={step > 2} label="2" />
            <div style={{ flex: 1, height: 2, borderRadius: 2, background: step > 2 ? "var(--color-lunas)" : "var(--color-border)", margin: "0 6px" }} />
            <StepDot active={step === 3} done={false} label="3" />
          </div>

          {/* STEP 1: Pilih Pelanggan */}
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <p style={{ fontSize: 13, color: "var(--color-txt2)" }}>Pilih pelanggan untuk <strong>{bulanLabel}</strong></p>
              <div style={{ position: "relative" }}>
                <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-txt3)" }} />
                <input className="input-field" style={{ paddingLeft: 38 }} placeholder="Cari nama, nomor, dusun, RT..."
                  value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              {filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 0", color: "var(--color-txt3)" }}>
                  <User size={32} style={{ margin: "0 auto 8px", opacity: 0.4 }} />
                  <p style={{ fontSize: 13 }}>{membersAktif.length === 0 ? "Belum ada pelanggan. Tambah di menu Pelanggan." : "Tidak ada yang cocok."}</p>
                </div>
              ) : filtered.map((m) => {
                const sudahEntri = tagihanBulanIni.some((t) => t.memberId === m.id);
                return (
                  <button key={m.id} onClick={() => handleSelectMember(m)} className="card"
                    style={{ width: "100%", padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", textAlign: "left", cursor: "pointer", opacity: sudahEntri ? 0.7 : 1 }}>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 14, color: "var(--color-txt)" }}>{m.nama}</p>
                      <p style={{ fontSize: 11, color: "var(--color-txt3)", marginTop: 2 }}>No. {m.nomorSambungan} · {m.dusun} RT {m.rt}</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {sudahEntri && (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 10, background: "rgba(21,128,61,0.12)", color: "var(--color-lunas)" }}>
                          Sudah
                        </span>
                      )}
                      <ChevronRight size={16} style={{ color: "var(--color-txt3)" }} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* STEP 2: Input */}
          {step === 2 && selectedMember && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Info pelanggan */}
              <div className="card" style={{ padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 14, color: "var(--color-txt)" }}>{selectedMember.nama}</p>
                  <p style={{ fontSize: 11, color: "var(--color-txt3)", marginTop: 2 }}>No. {selectedMember.nomorSambungan} · {selectedMember.dusun} RT {selectedMember.rt}</p>
                </div>
                <button onClick={() => { setStep(1); setSelectedMember(null); setSudahAda(null); }}
                  style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 12, color: "var(--color-primary)", background: "none", border: "none", cursor: "pointer" }}>
                  <ChevronLeft size={13} /> Ganti
                </button>
              </div>

              {/* Sudah ada tagihan */}
              {sudahAda ? (
                <div className="card" style={{ padding: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--color-tunggakan)", marginBottom: 8 }}>
                    <AlertCircle size={18} /><strong>Tagihan sudah ada</strong>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <p style={{ fontSize: 14, fontWeight: 800, color: "var(--color-primary)", fontFamily: "monospace" }}>{formatRp(sudahAda.total)}</p>
                    <p style={{ fontSize: 12, color: "var(--color-txt3)", marginTop: 2 }}>Status: <span style={{ fontWeight: 700, color: sudahAda.status === "lunas" ? "var(--color-lunas)" : "var(--color-belum)" }}>{sudahAda.status === "lunas" ? "Lunas" : "Belum Bayar"}</span></p>
                    <p style={{ fontSize: 12, color: "var(--color-txt3)" }}>Entry: {formatTanggal(sudahAda.tanggalEntry)}</p>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {sudahAda.status === "belum" ? (
                      <button onClick={() => handleTandai(sudahAda, "lunas")}
                        style={{ flex: 1, height: 44, borderRadius: 8, border: "none", background: "var(--color-lunas)", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                        <CheckCircle2 size={15} /> Tandai Lunas Sekarang
                      </button>
                    ) : (
                      <button onClick={() => handleTandai(sudahAda, "belum")}
                        style={{ flex: 1, height: 44, borderRadius: 8, border: "1px solid var(--color-belum)", background: "rgba(185,28,28,0.07)", color: "var(--color-belum)", cursor: "pointer", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                        <Clock size={15} /> Tandai Belum Bayar
                      </button>
                    )}
                    <button onClick={handleReset}
                      style={{ flex: 1, height: 44, borderRadius: 8, border: "1px solid var(--color-border)", background: "var(--color-bg)", color: "var(--color-txt2)", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                      Pelanggan Lain
                    </button>
                  </div>
                </div>
              ) : loadingMeter ? (
                <div style={{ textAlign: "center", padding: "32px 0", color: "var(--color-txt3)" }}>
                  <RefreshCw size={20} style={{ margin: "0 auto 8px" }} />
                  <p style={{ fontSize: 13 }}>Mengambil data meter...</p>
                </div>
              ) : (
                <>
                  {/* QuickPay */}
                  {entryMode === "quickpay" && (
                    <div className="card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                      <p style={{ fontWeight: 700, fontSize: 14, color: "var(--color-txt)" }}>⚡ Iuran Rata — {bulanLabel}</p>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 700, color: "var(--color-txt3)", display: "block", marginBottom: 8 }}>PILIH NOMINAL (ribu Rp)</label>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
                          {QUICKPAY_PRESETS.map((v) => (
                            <button key={v} onClick={() => { setQpPreset(v === qpPreset ? null : v); setQpManual(""); }}
                              style={{
                                padding: "10px 4px", borderRadius: 8, fontSize: 14, fontWeight: 800,
                                border: qpPreset === v ? "2px solid var(--color-primary)" : "2px solid var(--color-border)",
                                background: qpPreset === v ? "rgba(3,105,161,0.1)" : "var(--color-bg)",
                                color: qpPreset === v ? "var(--color-primary)" : "var(--color-txt)",
                                cursor: "pointer", fontFamily: "JetBrains Mono, monospace",
                              }}>
                              {v}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 700, color: "var(--color-txt3)", display: "block", marginBottom: 6 }}>ATAU KETIK MANUAL (×1.000)</label>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <input ref={qpManualRef} className="input-field mono" inputMode="numeric"
                            placeholder="25 = Rp 25.000" value={qpManual}
                            onChange={(e) => { setQpManual(e.target.value.replace(/\D/g, "")); setQpPreset(null); }}
                            style={{ flex: 1 }} />
                          <span style={{ fontSize: 13, color: "var(--color-txt3)", whiteSpace: "nowrap" }}>× 1.000</span>
                        </div>
                      </div>
                      {qpNominal > 0 && (
                        <div style={{ background: "rgba(3,105,161,0.08)", borderRadius: 10, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 13, color: "var(--color-txt2)", fontWeight: 600 }}>Total Iuran</span>
                          <span style={{ fontSize: 22, fontWeight: 900, color: "var(--color-primary)", fontFamily: "JetBrains Mono, monospace" }}>{formatRp(qpNominal)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Meter */}
                  {entryMode === "meter" && (
                    <div className="card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                      <p style={{ fontWeight: 700, fontSize: 14, color: "var(--color-txt)" }}>🔢 Meter Air — {bulanLabel}</p>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 700, color: "var(--color-txt3)", display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                          METER AWAL (m³)
                          {meterAwalAuto && <span style={{ fontSize: 10, background: "rgba(21,128,61,0.12)", color: "var(--color-lunas)", padding: "2px 6px", borderRadius: 10 }}>Otomatis</span>}
                        </label>
                        <input className="input-field mono" type="number" inputMode="numeric" placeholder="0"
                          value={meterAwal} readOnly={meterAwalAuto}
                          style={meterAwalAuto ? { background: "var(--color-border)" } : {}}
                          onChange={(e) => { setMeterAwal(e.target.value === "" ? "" : Number(e.target.value)); setMeterAwalAuto(false); }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 700, color: "var(--color-txt3)", display: "block", marginBottom: 6 }}>METER SEKARANG (m³)</label>
                        <input ref={meterAkhirRef} className="input-field mono" type="number" inputMode="numeric"
                          placeholder="Angka di meteran" value={meterAkhir}
                          onChange={(e) => setMeterAkhir(e.target.value === "" ? "" : Number(e.target.value))} />
                        {typeof meterAkhir === "number" && typeof meterAwal === "number" && meterAkhir < meterAwal && (
                          <p style={{ fontSize: 11, color: "var(--color-belum)", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                            <AlertCircle size={11} /> Tidak boleh kurang dari meter awal
                          </p>
                        )}
                      </div>
                      {kalkulasi && (
                        <div style={{ background: "var(--color-bg)", borderRadius: 10, padding: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                          <p style={{ fontWeight: 700, fontSize: 13, color: "var(--color-txt)", marginBottom: 2 }}>Preview Tagihan</p>
                          {[
                            { label: "Pemakaian", val: formatM3(kalkulasi.pemakaian) },
                            { label: "Abonemen", val: formatRp(settings.abonemen) },
                            ...(kalkulasi.subtotalBlok1 > 0 ? [{ label: `Blok 1 (≤${settings.batasBlok}m³)`, val: formatRp(kalkulasi.subtotalBlok1) }] : []),
                            ...(kalkulasi.subtotalBlok2 > 0 ? [{ label: `Blok 2 (>${settings.batasBlok}m³)`, val: formatRp(kalkulasi.subtotalBlok2) }] : []),
                          ].map((row) => (
                            <div key={row.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                              <span style={{ color: "var(--color-txt3)" }}>{row.label}</span>
                              <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{row.val}</span>
                            </div>
                          ))}
                          <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: 8, display: "flex", justifyContent: "space-between" }}>
                            <span style={{ fontWeight: 700, color: "var(--color-txt)" }}>Total</span>
                            <span style={{ fontWeight: 900, fontSize: 16, color: "var(--color-primary)", fontFamily: "monospace" }}>{formatRp(kalkulasi.total)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Catatan */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "var(--color-txt3)", display: "block", marginBottom: 6 }}>CATATAN (opsional)</label>
                    <textarea className="input-field" style={{ resize: "none" }} rows={2}
                      placeholder="cth: bayar tunai, lewat transfer, dll" value={catatan}
                      onChange={(e) => setCatatan(e.target.value)} />
                  </div>

                  <button className="btn-primary" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                    disabled={saving || (entryMode === "quickpay" ? qpNominal <= 0 : !meterValid) || isLocked}
                    onClick={handleSimpan}>
                    {saving ? <><RefreshCw size={16} /> Menyimpan...</> : <><CheckCircle2 size={16} /> Simpan Tagihan</>}
                  </button>
                </>
              )}
            </div>
          )}

          {/* STEP 3: Sukses */}
          {step === 3 && savedResult && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="card" style={{ padding: 24, textAlign: "center" }}>
                <div style={{ width: 60, height: 60, borderRadius: "50%", background: "rgba(21,128,61,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                  <CheckCircle2 size={30} style={{ color: "var(--color-lunas)" }} />
                </div>
                <p style={{ fontWeight: 800, fontSize: 18, color: "var(--color-txt)" }}>Berhasil!</p>
                <p style={{ fontSize: 13, color: "var(--color-txt3)", marginTop: 4 }}>{savedResult.nama} · {bulanLabel}</p>
                <div style={{ marginTop: 14, background: "var(--color-bg)", borderRadius: 10, padding: "12px 16px" }}>
                  <p style={{ fontSize: 12, color: "var(--color-txt3)" }}>Total Tagihan</p>
                  <p style={{ fontSize: 24, fontWeight: 900, color: "var(--color-lunas)", fontFamily: "monospace", marginTop: 2 }}>{formatRp(savedResult.total)}</p>
                </div>
              </div>
              <button className="btn-primary" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }} onClick={handleReset}>
                <User size={16} /> Entry Pelanggan Berikutnya
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
