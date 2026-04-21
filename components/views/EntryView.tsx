"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Search,
  ChevronRight,
  ChevronLeft,
  Droplets,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  User,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { listenMembers, getLastMeter, saveTagihan, cekTagihanSudahAda, saveActivityLog, getLatestHargaHistoryId } from "@/lib/db";
import { hitungTagihan, formatRp, formatM3 } from "@/lib/helpers";
import { MONTHS } from "@/lib/constants";
import { Member } from "@/types";

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepDot({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
        style={{
          background: done
            ? "var(--color-lunas)"
            : active
            ? "var(--color-primary)"
            : "var(--color-border)",
          color: done || active ? "#fff" : "var(--color-txt3)",
        }}
      >
        {done ? <CheckCircle2 size={14} /> : label}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function EntryView() {
  const { settings, activeBulan, activeTahun, userRole, showConfirm, addToast } = useAppStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [meterAwal, setMeterAwal] = useState<number | "">("");
  const [meterAkhir, setMeterAkhir] = useState<number | "">("");
  const [catatan, setCatatan] = useState("");
  const [meterAwalAuto, setMeterAwalAuto] = useState(false);
  const [loadingMeter, setLoadingMeter] = useState(false);
  const [sudahAda, setSudahAda] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const meterAkhirRef = useRef<HTMLInputElement>(null);

  // subscribe members
  useEffect(() => {
    const unsub = listenMembers((data) => {
      setMembers(data.filter((m) => m.status === "aktif"));
    });
    return unsub;
  }, []);

  // filter members by search
  const filteredMembers = members.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      m.nama.toLowerCase().includes(q) ||
      m.nomorSambungan.toLowerCase().includes(q) ||
      m.dusun.toLowerCase().includes(q) ||
      m.rt.toLowerCase().includes(q)
    );
  });

  // select member → ambil meter awal otomatis
  const handleSelectMember = useCallback(
    async (member: Member) => {
      setSelectedMember(member);
      setMeterAwal("");
      setMeterAkhir("");
      setCatatan("");
      setMeterAwalAuto(false);
      setSudahAda(false);
      setStep(2);

      // cek sudah ada tagihan bulan ini
      if (member.id) {
        const ada = await cekTagihanSudahAda(member.id, activeBulan, activeTahun);
        if (ada) {
          setSudahAda(true);
          return;
        }
      }

      // ambil meter awal otomatis dari bulan lalu
      setLoadingMeter(true);
      try {
        const lastMeter = member.id
          ? await getLastMeter(member.id, activeBulan, activeTahun)
          : null;

        if (lastMeter !== null) {
          setMeterAwal(lastMeter);
          setMeterAwalAuto(true);
        } else {
          // bulan pertama — isi dari meterAwalPertama jika ada
          setMeterAwal(member.meterAwalPertama ?? "");
          setMeterAwalAuto(false);
        }
      } finally {
        setLoadingMeter(false);
        setTimeout(() => meterAkhirRef.current?.focus(), 100);
      }
    },
    [activeBulan, activeTahun]
  );

  // kalkulasi real-time
  const meterAwalNum = typeof meterAwal === "number" ? meterAwal : 0;
  const meterAkhirNum = typeof meterAkhir === "number" ? meterAkhir : 0;
  const meterValid =
    typeof meterAwal === "number" &&
    typeof meterAkhir === "number" &&
    meterAkhir >= meterAwal;

  const kalkulasi = meterValid
    ? hitungTagihan(meterAwalNum, meterAkhirNum, settings)
    : null;

  // simpan tagihan
  const handleSimpan = useCallback(async () => {
    if (!selectedMember?.id || !meterValid || !kalkulasi) return;

    const hargaHistoryId = await getLatestHargaHistoryId() ?? "default";

    showConfirm(
      "Konfirmasi Entry Meter",
      `Simpan tagihan untuk ${selectedMember.nama}?\nTotal: ${formatRp(kalkulasi.total)}`,
      async () => {
        setSaving(true);
        try {
          await saveTagihan({
            memberId: selectedMember.id!,
            memberNama: selectedMember.nama,
            memberNomorSambungan: selectedMember.nomorSambungan,
            memberDusun: selectedMember.dusun,
            memberRT: selectedMember.rt,
            bulan: activeBulan,
            tahun: activeTahun,
            meterAwal: meterAwalNum,
            meterAkhir: meterAkhirNum,
            pemakaian: kalkulasi.pemakaian,
            hargaHistoryId,
            abonemenSnapshot: settings.abonemen,
            hargaBlok1Snapshot: settings.hargaBlok1,
            batasBlokSnapshot: settings.batasBlok,
            hargaBlok2Snapshot: settings.hargaBlok2,
            subtotalBlok1: kalkulasi.subtotalBlok1,
            subtotalBlok2: kalkulasi.subtotalBlok2,
            subtotalPemakaian: kalkulasi.subtotalPemakaian,
            total: kalkulasi.total,
            status: "belum",
            tanggalBayar: null,
            entryOleh: userRole?.email ?? "",
            catatan,
          });

          await saveActivityLog(
            "entry_meter",
            `Entry meter ${selectedMember.nama} — ${MONTHS[activeBulan - 1]} ${activeTahun} — ${formatM3(kalkulasi.pemakaian)} — ${formatRp(kalkulasi.total)}`,
            userRole?.email ?? "",
            userRole?.role ?? ""
          );

          addToast("success", `Tagihan ${selectedMember.nama} berhasil disimpan!`);
          setSavedSuccess(true);
          setStep(3);
        } catch (err) {
          console.error(err);
          addToast("error", "Gagal menyimpan tagihan. Coba lagi.");
        } finally {
          setSaving(false);
        }
      }
    );
  }, [
    selectedMember, meterValid, kalkulasi, meterAwalNum, meterAkhirNum,
    activeBulan, activeTahun, settings, catatan, userRole, showConfirm, addToast,
  ]);

  // reset ke pilih pelanggan
  const handleReset = () => {
    setStep(1);
    setSelectedMember(null);
    setSearch("");
    setMeterAwal("");
    setMeterAkhir("");
    setCatatan("");
    setSudahAda(false);
    setSavedSuccess(false);
  };

  const bulanLabel = `${MONTHS[activeBulan - 1]} ${activeTahun}`;

  return (
    <div className="pb-safe px-4 pt-4 space-y-4">
      {/* Step indicator */}
      <div className="card p-3">
        <div className="flex items-center justify-center gap-2">
          <StepDot active={step === 1} done={step > 1} label="1" />
          <div className="flex-1 h-0.5 rounded" style={{ background: step > 1 ? "var(--color-lunas)" : "var(--color-border)" }} />
          <StepDot active={step === 2} done={step > 2} label="2" />
          <div className="flex-1 h-0.5 rounded" style={{ background: step > 2 ? "var(--color-lunas)" : "var(--color-border)" }} />
          <StepDot active={step === 3} done={false} label="3" />
        </div>
        <div className="flex justify-between mt-1 text-[11px]" style={{ color: "var(--color-txt3)" }}>
          <span>Pilih Pelanggan</span>
          <span>Input Meter</span>
          <span>Selesai</span>
        </div>
      </div>

      {/* ── STEP 1: Pilih Pelanggan ── */}
      {step === 1 && (
        <div className="space-y-3">
          <p className="text-sm font-medium" style={{ color: "var(--color-txt2)" }}>
            Pilih pelanggan untuk entry meter <strong>{bulanLabel}</strong>
          </p>

          {/* Search box */}
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--color-txt3)" }} />
            <input
              className="input-field pl-10"
              placeholder="Cari nama, nomor, dusun, RT..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoComplete="off"
            />
          </div>

          {/* Member list */}
          {filteredMembers.length === 0 ? (
            <div className="text-center py-8" style={{ color: "var(--color-txt3)" }}>
              <User size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">Tidak ada pelanggan ditemukan</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredMembers.map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleSelectMember(m)}
                  className="card w-full p-3 flex items-center justify-between text-left hover:opacity-80 active:scale-[0.98] transition-all"
                >
                  <div>
                    <p className="font-semibold text-base" style={{ color: "var(--color-txt)" }}>
                      {m.nama}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--color-txt3)" }}>
                      No. {m.nomorSambungan} · {m.dusun} RT {m.rt}
                    </p>
                  </div>
                  <ChevronRight size={18} style={{ color: "var(--color-txt3)" }} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── STEP 2: Input Meter ── */}
      {step === 2 && selectedMember && (
        <div className="space-y-4">
          {/* Info pelanggan */}
          <div className="card p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-base font-bold" style={{ color: "var(--color-txt)" }}>
                  {selectedMember.nama}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-txt3)" }}>
                  No. {selectedMember.nomorSambungan}
                </p>
                <p className="text-xs" style={{ color: "var(--color-txt3)" }}>
                  {selectedMember.dusun} · RT {selectedMember.rt}
                </p>
                {selectedMember.alamat && (
                  <p className="text-xs" style={{ color: "var(--color-txt3)" }}>
                    {selectedMember.alamat}
                  </p>
                )}
              </div>
              <button
                onClick={() => { setStep(1); setSelectedMember(null); }}
                className="btn-ghost px-2 py-1 text-xs flex items-center gap-1"
              >
                <ChevronLeft size={14} />
                Ganti
              </button>
            </div>
          </div>

          {/* Sudah ada tagihan */}
          {sudahAda ? (
            <div className="card p-4 space-y-3">
              <div className="flex items-center gap-2" style={{ color: "var(--color-tunggakan)" }}>
                <AlertCircle size={20} />
                <p className="font-semibold">Tagihan sudah ada</p>
              </div>
              <p className="text-sm" style={{ color: "var(--color-txt2)" }}>
                {selectedMember.nama} sudah memiliki tagihan untuk <strong>{bulanLabel}</strong>.
              </p>
              <button onClick={handleReset} className="btn-secondary w-full">
                Pilih Pelanggan Lain
              </button>
            </div>
          ) : loadingMeter ? (
            <div className="flex items-center justify-center py-8 gap-2"
              style={{ color: "var(--color-txt3)" }}>
              <RefreshCw size={18} className="animate-spin" />
              <span className="text-sm">Mengambil data meter...</span>
            </div>
          ) : (
            <>
              {/* Input meter */}
              <div className="card p-4 space-y-4">
                <p className="font-semibold text-sm" style={{ color: "var(--color-txt)" }}>
                  Entry Meter — {bulanLabel}
                </p>

                {/* Meter Awal */}
                <div>
                  <label className="block text-sm font-medium mb-1.5"
                    style={{ color: "var(--color-txt2)" }}>
                    Meter Awal (m³)
                    {meterAwalAuto && (
                      <span className="ml-2 text-xs px-1.5 py-0.5 rounded"
                        style={{ background: "var(--color-lunas)20", color: "var(--color-lunas)" }}>
                        Otomatis
                      </span>
                    )}
                  </label>
                  <input
                    className="input-field mono"
                    type="number"
                    inputMode="numeric"
                    placeholder="0"
                    value={meterAwal}
                    onChange={(e) => {
                      const v = e.target.value;
                      setMeterAwal(v === "" ? "" : Number(v));
                      setMeterAwalAuto(false);
                    }}
                    readOnly={meterAwalAuto}
                    style={meterAwalAuto ? { background: "var(--color-border)", cursor: "default" } : {}}
                  />
                  {meterAwalAuto && (
                    <p className="text-xs mt-1" style={{ color: "var(--color-txt3)" }}>
                      Diambil dari meter akhir bulan lalu.{" "}
                      <button
                        onClick={() => setMeterAwalAuto(false)}
                        className="underline"
                        style={{ color: "var(--color-primary)" }}
                      >
                        Edit manual
                      </button>
                    </p>
                  )}
                </div>

                {/* Meter Akhir */}
                <div>
                  <label className="block text-sm font-medium mb-1.5"
                    style={{ color: "var(--color-txt2)" }}>
                    Meter Sekarang (m³)
                  </label>
                  <input
                    ref={meterAkhirRef}
                    className="input-field mono"
                    type="number"
                    inputMode="numeric"
                    placeholder="Angka di meteran"
                    value={meterAkhir}
                    onChange={(e) => {
                      const v = e.target.value;
                      setMeterAkhir(v === "" ? "" : Number(v));
                    }}
                  />
                  {typeof meterAkhir === "number" &&
                    typeof meterAwal === "number" &&
                    meterAkhir < meterAwal && (
                      <p className="text-xs mt-1 flex items-center gap-1"
                        style={{ color: "var(--color-belum)" }}>
                        <AlertCircle size={12} />
                        Meter sekarang tidak boleh kurang dari meter awal
                      </p>
                    )}
                </div>

                {/* Catatan opsional */}
                <div>
                  <label className="block text-sm font-medium mb-1.5"
                    style={{ color: "var(--color-txt2)" }}>
                    Catatan (opsional)
                  </label>
                  <textarea
                    className="input-field resize-none"
                    rows={2}
                    placeholder="Contoh: meter baru, bocor, dll"
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                  />
                </div>
              </div>

              {/* Preview kalkulasi */}
              {kalkulasi && (
                <div className="card p-4 space-y-3">
                  <p className="font-semibold text-sm flex items-center gap-2"
                    style={{ color: "var(--color-txt)" }}>
                    <Droplets size={16} style={{ color: "var(--color-accent)" }} />
                    Preview Tagihan
                  </p>

                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span style={{ color: "var(--color-txt3)" }}>Pemakaian</span>
                      <span className="mono font-medium">{formatM3(kalkulasi.pemakaian)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: "var(--color-txt3)" }}>Abonemen</span>
                      <span className="mono">{formatRp(settings.abonemen)}</span>
                    </div>
                    {kalkulasi.subtotalBlok1 > 0 && (
                      <div className="flex justify-between">
                        <span style={{ color: "var(--color-txt3)" }}>
                          Blok 1 (≤{settings.batasBlok} m³ × {formatRp(settings.hargaBlok1)})
                        </span>
                        <span className="mono">{formatRp(kalkulasi.subtotalBlok1)}</span>
                      </div>
                    )}
                    {kalkulasi.subtotalBlok2 > 0 && (
                      <div className="flex justify-between">
                        <span style={{ color: "var(--color-txt3)" }}>
                          Blok 2 (&gt;{settings.batasBlok} m³ × {formatRp(settings.hargaBlok2)})
                        </span>
                        <span className="mono">{formatRp(kalkulasi.subtotalBlok2)}</span>
                      </div>
                    )}
                    <div className="border-t pt-2 flex justify-between font-bold"
                      style={{ borderColor: "var(--color-border)" }}>
                      <span style={{ color: "var(--color-txt)" }}>Total Tagihan</span>
                      <span className="mono text-base" style={{ color: "var(--color-primary)" }}>
                        {formatRp(kalkulasi.total)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tombol simpan */}
              <button
                onClick={handleSimpan}
                disabled={!meterValid || saving}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    Simpan Tagihan
                  </>
                )}
              </button>
            </>
          )}
        </div>
      )}

      {/* ── STEP 3: Sukses ── */}
      {step === 3 && selectedMember && kalkulasi && savedSuccess && (
        <div className="space-y-4">
          <div className="card p-6 text-center space-y-3">
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
              style={{ background: "var(--color-lunas)20" }}>
              <CheckCircle2 size={32} style={{ color: "var(--color-lunas)" }} />
            </div>
            <div>
              <p className="font-bold text-lg" style={{ color: "var(--color-txt)" }}>
                Tagihan Tersimpan!
              </p>
              <p className="text-sm mt-1" style={{ color: "var(--color-txt3)" }}>
                {selectedMember.nama} · {bulanLabel}
              </p>
            </div>
            <div className="rounded-xl p-4 space-y-1 text-sm"
              style={{ background: "var(--color-border)50" }}>
              <div className="flex justify-between">
                <span style={{ color: "var(--color-txt3)" }}>Pemakaian</span>
                <span className="mono font-medium">{formatM3(kalkulasi.pemakaian)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span style={{ color: "var(--color-txt)" }}>Total</span>
                <span className="mono" style={{ color: "var(--color-lunas)" }}>
                  {formatRp(kalkulasi.total)}
                </span>
              </div>
            </div>
          </div>

          <button onClick={handleReset} className="btn-primary w-full flex items-center justify-center gap-2">
            <User size={18} />
            Entry Pelanggan Berikutnya
          </button>
        </div>
      )}
    </div>
  );
}
