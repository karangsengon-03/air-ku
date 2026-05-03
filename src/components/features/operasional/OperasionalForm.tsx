"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { saveOperasional, saveActivityLog, Timestamp } from "@/lib/db";
import { formatRp } from "@/lib/helpers";
import { handleFirebaseError } from "@/lib/firebase-errors";
import { operasionalSchema, OperasionalFormValues } from "@/schemas";
import { toast } from "@/lib/toast";

interface OperasionalFormProps {
  onClose: () => void;
}

export default function OperasionalForm({ onClose }: OperasionalFormProps) {
  const { firebaseUser, userRole } = useAppStore();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<OperasionalFormValues>({
    resolver: zodResolver(operasionalSchema),
    defaultValues: {
      label: "",
      nominal: "",
      tanggal: new Date().toISOString().split("T")[0],
    },
  });

  const watchedNominal = watch("nominal");

  function handleNominalChange(raw: string) {
    const digits = raw.replace(/\D/g, "");
    setValue("nominal", digits ? parseInt(digits).toLocaleString("id-ID") : "");
  }

  const onSubmit = async (data: OperasionalFormValues) => {
    const nominal = parseInt(data.nominal.replace(/\D/g, ""));
    if (isNaN(nominal) || nominal <= 0) {
      setError("nominal", { message: "Nominal harus berupa angka lebih dari 0" });
      return;
    }

    try {
      const [tahunDate, bulanDate] = data.tanggal.split("-").map(Number);
      const tanggal = Timestamp.fromDate(new Date(data.tanggal));
      await saveOperasional({
        label: data.label.trim(),
        nominal,
        tanggal,
        bulan: bulanDate,
        tahun: tahunDate,
        // SAFE: AppShell memastikan firebaseUser tidak null sebelum render komponen ini
        dicatatOleh: firebaseUser!.email!,
      });
      await saveActivityLog(
        "tambah_operasional",
        `Catat pengeluaran: ${data.label.trim()} — ${formatRp(nominal)}`,
        // SAFE: AppShell memastikan firebaseUser & userRole tidak null sebelum render komponen ini
        firebaseUser!.email!,
        userRole!.role
      );
      toast.success("Pengeluaran dicatat.");
      onClose();
    } catch (e) {
      console.error(e);
      setError("root", { message: handleFirebaseError(e) });
    }
  };

  return (
    <div
      onClick={() => onClose()}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 50,
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        overflowY: "auto", padding: "40px 16px 40px",
      }}
    >
      <div
        className="card animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 520, borderRadius: 20, padding: "20px 20px 28px" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 17 }}>Catat Pengeluaran</div>
          <button className="btn-ghost" style={{ padding: 8 }} onClick={onClose} aria-label="Tutup form">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Label */}
          <div>
            <label htmlFor="ops-label" className="section-label">Keterangan / Label *</label>
            <input
              id="ops-label"
              className="input-field"
              placeholder="Contoh: Gaji petugas, Perbaikan pipa, dll"
              {...register("label")}
            />
            {errors.label && <p style={{ fontSize: 13, color: "var(--color-belum)", marginTop: 4 }}>{errors.label.message}</p>}
          </div>

          {/* Nominal */}
          <div>
            <label htmlFor="ops-nominal" className="section-label">Nominal (Rp) *</label>
            <div style={{ position: "relative" }}>
              <span style={{
                position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                fontWeight: 600, color: "var(--color-txt3)", fontSize: 14,
              }}>Rp</span>
              <input
                id="ops-nominal"
                className="input-field mono"
                inputMode="numeric"
                placeholder="0"
                style={{ paddingLeft: 40 }}
                value={watchedNominal}
                onChange={(e) => handleNominalChange(e.target.value)}
              />
            </div>
            {errors.nominal && <p style={{ fontSize: 13, color: "var(--color-belum)", marginTop: 4 }}>{errors.nominal.message}</p>}
          </div>

          {/* Tanggal */}
          <div>
            <label htmlFor="ops-tanggal" className="section-label">Tanggal *</label>
            <input
              id="ops-tanggal"
              className="input-field"
              type="date"
              {...register("tanggal")}
            />
            {errors.tanggal && <p style={{ fontSize: 13, color: "var(--color-belum)", marginTop: 4 }}>{errors.tanggal.message}</p>}
          </div>

          {/* Root Error */}
          {errors.root && (
            <div style={{
              background: "rgba(185,28,28,0.1)", border: "1px solid var(--color-belum)",
              borderRadius: 8, padding: "10px 14px", fontSize: 14, color: "var(--color-belum)",
            }}>
              {errors.root.message}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="btn-primary" style={{ flex: 2 }} disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan…" : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
