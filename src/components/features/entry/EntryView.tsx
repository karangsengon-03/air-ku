"use client";
import { useState, useCallback, useRef } from "react";
import { ChevronLeft, CheckCircle2, RefreshCw, Zap, Gauge, CreditCard, FileText, Info } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { toast } from "@/lib/toast";
import { getLastMeter, saveTagihan, saveActivityLog, getLatestHargaHistoryId, deleteTagihan, updateTagihanStatus } from "@/lib/db";
import { hitungTagihan, formatRp } from "@/lib/helpers";
import { MONTHS } from "@/lib/constants";
import { Member, Tagihan } from "@/types";
import MemberSelector from "./MemberSelector";
import QuickPayForm from "./QuickPayForm";
import MeterForm from "./MeterForm";
import EntrySuccess from "./EntrySuccess";
import EntryAlreadyPaid from "./EntryAlreadyPaid";

type EntryMode = "meter" | "quickpay";
type StatusEntry = "lunas" | "belum"; // lunas = langsung lunas, belum = catat tagihan dulu

function StepDot({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <div style={{
      width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center",
      justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0,
      background: done ? "var(--color-lunas)" : active ? "var(--color-primary)" : "var(--color-border)",
      color: done || active ? "white" : "var(--color-txt3)",
    }}>
      {done ? <CheckCircle2 size={13} /> : label}
    </div>
  );
}

export default function EntryView() {
  const { settings, activeBulan, activeTahun, userRole, showConfirm, members, tagihan } = useAppStore();
  const isAdmin = userRole?.role === "admin";
  const isLocked = settings.globalLock;
  const modePembayaran = settings.modePembayaran ?? "per_member";

  // StatusEntry: ikuti mode global jika bukan per_member
  const defaultStatus: StatusEntry =
    modePembayaran === "global_tagihan" ? "belum" : "lunas";
  const [statusEntry, setStatusEntry] = useState<StatusEntry>(defaultStatus);
  const statusIsLocked = modePembayaran !== "per_member"; // jika global, toggle disembunyikan

  // Mode awal entry: ikuti setting global jika mode = "global", else bebas pilih
  const defaultMode: EntryMode = settings.modeTarif === "global"
    ? (settings.modeTarifGlobal === "rata" ? "quickpay" : "meter")
    : "quickpay";

  const [entryMode, setEntryMode] = useState<EntryMode>(defaultMode);
  const modeIsLocked = settings.modeTarif === "global"; // jika global, toggle disembunyikan
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [search, setSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

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

  const membersAktif = members.filter((m) => m.status === "aktif");

  const qpNominal = (() => {
    if (qpPreset !== null) return qpPreset * 1000;
    if (qpManual !== "") return (parseInt(qpManual.replace(/\D/g, "")) || 0) * 1000;
    return 0;
  })();

  const qpIsZero = qpPreset === 0 || (qpManual !== "" && parseInt(qpManual.replace(/\D/g, "")) === 0);
  const qpValid = qpPreset !== null || qpManual !== "";

  const meterAwalNum = typeof meterAwal === "number" ? meterAwal : 0;
  const meterAkhirNum = typeof meterAkhir === "number" ? meterAkhir : 0;
  const meterValid = typeof meterAwal === "number" && typeof meterAkhir === "number" && meterAkhir >= meterAwal;
  const kalkulasi = meterValid ? hitungTagihan(meterAwalNum, meterAkhirNum, settings) : null;

  const bulanLabel = `${MONTHS[activeBulan - 1]} ${activeTahun}`;

  const handleSelectMember = useCallback(async (member: Member) => {
    setSelectedMember(member);
    setMeterAwal(""); setMeterAkhir(""); setCatatan("");
    setMeterAwalAuto(false); setSudahAda(null); setSavedResult(null);
    setQpPreset(null); setQpManual("");
    setStatusEntry(modePembayaran === "global_tagihan" ? "belum" : "lunas"); // reset ke default tiap pilih member baru

    const existing = tagihan.find((t) => t.memberId === member.id);
    setSudahAda(existing ?? null);
    setStep(2);

    if (existing) return;

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
  }, [activeBulan, activeTahun, entryMode, tagihan, modePembayaran]);

  const handleSimpan = useCallback(async () => {
    if (!selectedMember?.id) return;
    const isQp = entryMode === "quickpay";
    const totalFinal = isQp ? qpNominal : (kalkulasi?.total ?? 0);
    if (isQp && !qpValid) { toast.error("Pilih nominal atau ketik 0 untuk pelanggan baru"); return; }
    if (!isQp && !meterValid) return;
    if (isLocked) { toast.error("Aplikasi sedang dikunci"); return; }

    // Hanya admin yang bisa catat tagihan (belum bayar)
    const statusFinal: "lunas" | "belum" = (!isAdmin && statusEntry === "belum") ? "lunas" : statusEntry;

    const nominalLabel = isQp
      ? (qpIsZero ? "Rp 0 (pelanggan baru)" : formatRp(totalFinal))
      : formatRp(totalFinal);

    const konfirmasiJudul = statusFinal === "lunas"
      ? "Konfirmasi — Langsung Lunas"
      : "Konfirmasi — Catat Tagihan";

    const konfirmasiPesan = statusFinal === "lunas"
      ? `Catat pembayaran LUNAS:\n\nPelanggan: ${selectedMember.nama}\nTotal: ${nominalLabel}\nBulan: ${bulanLabel}\n\nTagihan akan disimpan dengan status LUNAS.`
      : `Catat tagihan BELUM BAYAR:\n\nPelanggan: ${selectedMember.nama}\nTotal: ${nominalLabel}\nBulan: ${bulanLabel}\n\nStatus: DITAGIH — tandai lunas saat warga membayar.`;

    const hargaHistoryId = await getLatestHargaHistoryId() ?? "default";
    showConfirm(konfirmasiJudul, konfirmasiPesan,
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
            blokSnapshotList: isQp ? [] : (kalkulasi?.blokDetail ?? []),
            subtotalBlok1: isQp ? 0 : (kalkulasi?.subtotalBlok1 ?? 0),
            subtotalBlok2: isQp ? 0 : (kalkulasi?.subtotalBlok2 ?? 0),
            subtotalPemakaian: isQp ? totalFinal : (kalkulasi?.subtotalPemakaian ?? 0),
            total: totalFinal,
            status: statusFinal,
            tanggalBayar: statusFinal === "lunas" ? new Date() : null,
            entryOleh: userRole?.email ?? "",
            catatan: catatan + (isQp ? " [iuran rata]" : "") + (qpIsZero ? " [pelanggan baru]" : ""),
          });
          await saveActivityLog(
            statusFinal === "lunas" ? "entry_bayar" : "entry_tagihan",
            `${isQp ? "Iuran rata" : "Meter"} ${selectedMember.nama} — ${bulanLabel} — ${nominalLabel} [${statusFinal === "lunas" ? "LUNAS" : "DITAGIH"}]`,
            userRole?.email ?? "", userRole?.role ?? "");
          toast.success(`${selectedMember.nama} — ${statusFinal === "lunas" ? "Entry lunas berhasil!" : "Tagihan berhasil dicatat!"}`);
          setSavedResult({ nama: selectedMember.nama, total: totalFinal });
          setStep(3);
        } catch (err) {
          console.error(err); toast.error("Gagal menyimpan. Coba lagi.");
        } finally { setSaving(false); }
      });
  }, [selectedMember, entryMode, qpNominal, qpValid, qpIsZero, meterValid, kalkulasi,
    meterAwalNum, meterAkhirNum, activeBulan, activeTahun, bulanLabel, settings, catatan,
    userRole, showConfirm, isLocked, statusEntry, isAdmin]);

  const handleHapus = useCallback(async (t: Tagihan) => {
    if (!isAdmin || isLocked) return;
    showConfirm("Hapus Entry Bayar?",
      `Hapus entry ${t.memberNama} — ${formatRp(t.total)}?\nStatus akan kembali ke Belum Bayar.\nAksi ini tidak bisa dibatalkan.`,
      async () => {
        try {
          await deleteTagihan(t.id!);
          await saveActivityLog("hapus_entry",
            `Hapus entry: ${t.memberNama} — ${bulanLabel}`,
            userRole?.email ?? "", userRole?.role ?? "");
          toast.success("Entry dihapus — status kembali Belum Bayar");
          setSudahAda(null); setStep(1); setSelectedMember(null); setSearch("");
        } catch { toast.error("Gagal menghapus"); }
      }, true);
  }, [isAdmin, isLocked, showConfirm, bulanLabel, userRole]);

  const handleTandaiLunasEntry = useCallback(async (t: Tagihan) => {
    if (!isAdmin || isLocked) return;
    showConfirm(
      "Tandai Lunas",
      `Konfirmasi pembayaran:\n\nPelanggan: ${t.memberNama}\nTagihan: ${formatRp(t.total)}\nBulan: ${bulanLabel}\n\nWarga sudah membayar?`,
      async () => {
        try {
          await updateTagihanStatus(t.id!, "lunas");
          await saveActivityLog("tandai_lunas",
            `${t.memberNama} — ${bulanLabel} (${t.nomorTagihan || "manual"})`,
            userRole?.email ?? "", userRole?.role ?? "");
          toast.success(`${t.memberNama} — Tandai lunas berhasil!`);
          setSudahAda({ ...t, status: "lunas" });
        } catch { toast.error("Gagal memperbarui status."); }
      }
    );
  }, [isAdmin, isLocked, showConfirm, bulanLabel, userRole]);

  const handleReset = () => {
    setStep(1); setSelectedMember(null); setSearch("");
    setMeterAwal(""); setMeterAkhir(""); setCatatan("");
    setSudahAda(null); setSavedResult(null); setQpPreset(null); setQpManual("");
  };

  return (
    <div className="col-12 animate-fade-in-up">

      {/* Info mode */}
      <div style={{
        background: "rgba(3,105,161,0.07)", border: "1px solid rgba(3,105,161,0.2)",
        borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "var(--color-txt2)", lineHeight: 1.6,
      }}>
        <span style={{ fontWeight: 700, color: "var(--color-primary)" }}>Cara kerja:</span>{" "}
        Pilih pelanggan → Input nominal → Simpan. Entry bayar otomatis tercatat <strong>Lunas</strong>.
        Belum entry = Belum Bayar. Tidak perlu langkah tambahan.
      </div>

      {/* Entry mode toggle — hanya tampil jika mode per_pelanggan */}
      {modeIsLocked ? (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          padding: "10px 14px", borderRadius: 10, border: "1px solid var(--color-border)",
          background: "var(--color-bg)", fontSize: 13, color: "var(--color-txt3)", fontWeight: 600,
        }}>
          {entryMode === "quickpay" ? <Zap size={14} /> : <Gauge size={14} />}
          Mode Global: {entryMode === "quickpay" ? "Iuran Rata" : "Meter Air"}
          <span style={{ fontSize: 11, marginLeft: 4 }}>(diatur di Pengaturan)</span>
        </div>
      ) : (
        <div style={{ display: "flex", borderRadius: 10, overflow: "hidden", border: "1px solid var(--color-border)" }}>
          {([
            { key: "quickpay", label: "Iuran Rata", icon: Zap },
            { key: "meter", label: "Meter Air", icon: Gauge },
          ] as { key: EntryMode; label: string; icon: typeof Zap }[]).map((m) => (
            <button key={m.key} onClick={() => { setEntryMode(m.key); handleReset(); }}
              style={{
                flex: 1, padding: "10px 12px", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer",
                background: entryMode === m.key ? "var(--color-primary)" : "var(--color-bg)",
                color: entryMode === m.key ? "white" : "var(--color-txt3)",
              }}>
              {m.label}
            </button>
          ))}
        </div>
      )}

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
        <MemberSelector
          search={search}
          onSearchChange={setSearch}
          members={membersAktif}
          tagihan={tagihan}
          bulanLabel={bulanLabel}
          onSelect={handleSelectMember}
        />
      )}

      {/* STEP 2: Input */}
      {step === 2 && selectedMember && (
        <div className="col-12">
          {/* Info pelanggan terpilih */}
          <div className="card" style={{ padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: 15, color: "var(--color-txt)" }}>{selectedMember.nama}</p>
              <p style={{ fontSize: 13, color: "var(--color-txt3)", marginTop: 2 }}>
                No. {selectedMember.nomorSambungan} · {selectedMember.dusun} RT {selectedMember.rt}
              </p>
            </div>
            <button
              onClick={() => { setStep(1); setSelectedMember(null); setSudahAda(null); }}
              style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "var(--color-primary)", background: "none", border: "none", cursor: "pointer" }}
            >
              <ChevronLeft size={13} /> Ganti
            </button>
          </div>

          {/* #16b: Sudah ada entry → sub-komponen */}
          {sudahAda ? (
            <EntryAlreadyPaid
              sudahAda={sudahAda}
              isAdmin={isAdmin}
              onHapus={handleHapus}
              onTandaiLunas={handleTandaiLunasEntry}
              onReset={handleReset}
            />
          ) : loadingMeter ? (
            <div className="empty-state">
              <RefreshCw size={20} style={{ margin: "0 auto 8px" }} />
              <p style={{ fontSize: 13 }}>Mengambil data meter...</p>
            </div>
          ) : (
            <>
              {entryMode === "quickpay" && (
                <QuickPayForm
                  bulanLabel={bulanLabel}
                  qpPreset={qpPreset}
                  qpManual={qpManual}
                  qpNominal={qpNominal}
                  qpValid={qpValid}
                  qpIsZero={qpIsZero}
                  qpManualRef={qpManualRef}
                  onPresetChange={(v) => { setQpPreset(v); setQpManual(""); }}
                  onManualChange={(v) => { setQpManual(v); setQpPreset(null); }}
                />
              )}

              {entryMode === "meter" && (
                <MeterForm
                  bulanLabel={bulanLabel}
                  meterAwal={meterAwal}
                  meterAkhir={meterAkhir}
                  meterAwalAuto={meterAwalAuto}
                  kalkulasi={kalkulasi}
                  settings={settings}
                  meterAkhirRef={meterAkhirRef}
                  onMeterAwalChange={(v) => { setMeterAwal(v); setMeterAwalAuto(false); }}
                  onMeterAkhirChange={setMeterAkhir}
                />
              )}

              {/* Catatan */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: "var(--color-txt3)", display: "block", marginBottom: 6 }}>CATATAN (opsional)</label>
                <textarea className="input-field" style={{ resize: "none" }} rows={2}
                  placeholder="cth: bayar tunai, lewat transfer, dll" value={catatan}
                  onChange={(e) => setCatatan(e.target.value)} />
              </div>

              {/* Toggle Status Entry — per member (admin only) atau info global */}
              {statusIsLocked ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10, border: "1px solid var(--color-border)", background: "var(--color-bg)", fontSize: 13, color: "var(--color-txt3)" }}>
                  <Info size={14} />
                  {modePembayaran === "global_lunas" ? "Mode Global: semua entry langsung Lunas" : "Mode Global: semua entry dicatat sebagai Ditagih"}
                  <span style={{ fontSize: 11, marginLeft: 4 }}>(ubah di Pengaturan)</span>
                </div>
              ) : isAdmin ? (
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "var(--color-txt3)", display: "block", marginBottom: 6 }}>STATUS PEMBAYARAN</label>
                  <div style={{ display: "flex", borderRadius: 10, overflow: "hidden", border: "1px solid var(--color-border)" }}>
                    {([
                      { val: "lunas" as StatusEntry, label: "Langsung Lunas", icon: <CreditCard size={14} />, color: "var(--color-lunas)" },
                      { val: "belum" as StatusEntry, label: "Catat Tagihan", icon: <FileText size={14} />, color: "var(--color-tunggakan)" },
                    ]).map((s) => (
                      <button key={s.val} onClick={() => setStatusEntry(s.val)}
                        style={{
                          flex: 1, padding: "11px 8px", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                          background: statusEntry === s.val ? (s.val === "lunas" ? "rgba(21,128,61,0.15)" : "rgba(202,138,4,0.15)") : "var(--color-bg)",
                          color: statusEntry === s.val ? s.color : "var(--color-txt3)",
                          borderBottom: statusEntry === s.val ? `2px solid ${s.color}` : "2px solid transparent",
                        }}>
                        {s.icon} {s.label}
                      </button>
                    ))}
                  </div>
                  <p style={{ fontSize: 13, color: "var(--color-txt3)", marginTop: 6, lineHeight: 1.5 }}>
                    {statusEntry === "lunas"
                      ? "Warga sudah membayar — tagihan langsung tercatat Lunas."
                      : "Tagihan dicatat dulu — tandai Lunas saat warga membayar."}
                  </p>
                </div>
              ) : null}

              {/* Tombol Simpan */}
              <button
                className="btn-primary"
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  background: statusEntry === "belum" ? "var(--color-tunggakan)" : undefined,
                }}
                disabled={saving || (entryMode === "quickpay" ? !qpValid : !meterValid) || isLocked}
                onClick={handleSimpan}
              >
                {saving
                  ? <><RefreshCw size={16} /> Menyimpan...</>
                  : statusEntry === "lunas"
                    ? <><CreditCard size={16} /> Simpan — Langsung Lunas</>
                    : <><FileText size={16} /> Simpan — Catat Tagihan</>
                }
              </button>
            </>
          )}
        </div>
      )}

      {/* STEP 3: Sukses → #16b sub-komponen */}
      {step === 3 && savedResult && (
        <EntrySuccess
          nama={savedResult.nama}
          bulanLabel={bulanLabel}
          total={savedResult.total}
          onReset={handleReset}
        />
      )}
    </div>
  );
}
