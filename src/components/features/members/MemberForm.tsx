"use client";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { saveMember, updateMember, cekNomorSambunganTerpakai, saveActivityLog } from "@/lib/db";
import { Member, MemberStatus } from "@/types";
import { STATUS_LABEL, STATUS_COLOR, STATUS_BG } from "./MemberCard";
import { handleFirebaseError } from "@/lib/firebase-errors";
import { memberSchema, MemberFormValues } from "@/schemas";
import { toast } from "@/lib/toast";

interface MemberFormProps {
  editTarget: Member | null;
  onClose: () => void;
}

export default function MemberForm({ editTarget, onClose }: MemberFormProps) {
  const { settings, firebaseUser, userRole } = useAppStore();

  const dusunList = useMemo(() => settings.dusunList || [], [settings.dusunList]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema) as any,
    defaultValues: editTarget
      ? {
          nama: editTarget.nama,
          nomorSambungan: editTarget.nomorSambungan,
          alamat: editTarget.alamat,
          rt: editTarget.rt,
          dusun: editTarget.dusun,
          status: editTarget.status,
          meterAwalPertama: "",
        }
      : {
          nama: "", nomorSambungan: "", alamat: "", rt: "", dusun: "",
          status: "aktif", meterAwalPertama: "",
        },
  });

  const watchedDusun = watch("dusun");
  const watchedStatus = watch("status");
  const watchedRt = watch("rt");

  const rtList = useMemo(() => {
    if (!watchedDusun) return [];
    return settings.rtPerDusun?.[watchedDusun] || [];
  }, [watchedDusun, settings.rtPerDusun]);

  // Reset RT jika dusun berubah dan RT lama tidak ada di daftar baru
  useEffect(() => {
    const rts = settings.rtPerDusun?.[watchedDusun] || [];
    if (watchedRt && !rts.includes(watchedRt)) {
      setValue("rt", "");
    }
  }, [watchedDusun, settings.rtPerDusun, watchedRt, setValue]);

  const onSubmit = async (data: MemberFormValues) => {
    // Validasi tambahan: meter awal saat tambah baru
    if (!editTarget) {
      const meterVal = parseInt(data.meterAwalPertama || "");
      if (isNaN(meterVal) || meterVal < 0) {
        setError("meterAwalPertama", { message: "Meter awal pertama wajib diisi (angka ≥ 0)" });
        return;
      }
    }

    try {
      const sudahAda = await cekNomorSambunganTerpakai(data.nomorSambungan.trim(), editTarget?.id);
      if (sudahAda) {
        setError("nomorSambungan", {
          message: `Nomor sambungan "${data.nomorSambungan}" sudah digunakan pelanggan lain.`,
        });
        return;
      }

      if (editTarget) {
        await updateMember(editTarget.id!, {
          nama: data.nama.trim(),
          nomorSambungan: data.nomorSambungan.trim(),
          alamat: data.alamat?.trim() ?? "",
          rt: data.rt ?? "",
          dusun: data.dusun,
          status: data.status,
        });
        await saveActivityLog(
          "edit_member",
          `Edit pelanggan: ${data.nama.trim()} (${data.nomorSambungan})`,
          // SAFE: AppShell memastikan firebaseUser tidak null sebelum render komponen ini
          firebaseUser!.email!, userRole!.role
        );
        toast.success("Data pelanggan diperbarui.");
      } else {
        const meterVal = parseInt(data.meterAwalPertama || "");
        await saveMember({
          nama: data.nama.trim(),
          nomorSambungan: data.nomorSambungan.trim(),
          alamat: data.alamat?.trim() ?? "",
          rt: data.rt ?? "",
          dusun: data.dusun,
          status: data.status,
          meterAwalPertama: meterVal,
          // SAFE: AppShell memastikan firebaseUser tidak null sebelum render komponen ini
          createdBy: firebaseUser!.email!,
        });
        await saveActivityLog(
          "tambah_member",
          `Tambah pelanggan baru: ${data.nama.trim()} (${data.nomorSambungan})`,
          // SAFE: AppShell memastikan firebaseUser tidak null sebelum render komponen ini
          firebaseUser!.email!, userRole!.role
        );
        toast.success("Pelanggan baru berhasil ditambahkan.");
      }
      onClose();
    } catch (e) {
      console.error(e);
      setError("root", { message: handleFirebaseError(e) });
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 200,
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        overflowY: "auto", padding: "40px 16px 40px",
      }}
    >
      <div
        className="card animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 480, borderRadius: 20, padding: "20px 20px 28px" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 17 }}>
            {editTarget ? "Edit Pelanggan" : "Tambah Pelanggan Baru"}
          </div>
          <button className="btn-ghost" style={{ padding: 8 }} onClick={onClose} aria-label="Tutup form">
            <X size={20} />
          </button>
        </div>

        {/* #8 Fix: semua label form menggunakan <label htmlFor> bukan <div> */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Nama */}
          <div>
            <label htmlFor="member-nama" className="section-label">Nama Lengkap *</label>
            <input id="member-nama" className="input-field" placeholder="Nama pelanggan"
              {...register("nama")} />
            {errors.nama && <p style={{ fontSize: 13, color: "var(--color-belum)", marginTop: 4 }}>{errors.nama.message}</p>}
          </div>

          {/* Nomor Sambungan */}
          <div>
            <label htmlFor="member-nomor" className="section-label">Nomor Sambungan *</label>
            <input id="member-nomor" className="input-field mono" placeholder="Contoh: 001, A-12"
              {...register("nomorSambungan")} />
            {errors.nomorSambungan && <p style={{ fontSize: 13, color: "var(--color-belum)", marginTop: 4 }}>{errors.nomorSambungan.message}</p>}
          </div>

          {/* Dusun */}
          <div>
            <label htmlFor="member-dusun" className="section-label">Dusun *</label>
            {dusunList.length > 0 ? (
              <select id="member-dusun" className="input-field" style={{ cursor: "pointer" }}
                {...register("dusun")}
                onChange={(e) => { setValue("dusun", e.target.value); setValue("rt", ""); }}>
                <option value="">-- Pilih Dusun --</option>
                {dusunList.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            ) : (
              <input id="member-dusun" className="input-field" placeholder="Nama dusun"
                {...register("dusun")} />
            )}
            {errors.dusun && <p style={{ fontSize: 13, color: "var(--color-belum)", marginTop: 4 }}>{errors.dusun.message}</p>}
          </div>

          {/* RT */}
          <div>
            <label htmlFor="member-rt" className="section-label">RT</label>
            {rtList.length > 0 ? (
              <select id="member-rt" className="input-field" style={{ cursor: "pointer" }}
                {...register("rt")}>
                <option value="">-- Pilih RT --</option>
                {rtList.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            ) : (
              <input id="member-rt" className="input-field" placeholder="Nomor RT (opsional)"
                {...register("rt")} />
            )}
          </div>

          {/* Alamat */}
          <div>
            <label htmlFor="member-alamat" className="section-label">Alamat</label>
            <textarea id="member-alamat" className="input-field"
              style={{ height: "auto", paddingTop: 14, paddingBottom: 14, resize: "none", minHeight: 80 }}
              placeholder="Alamat lengkap (opsional)"
              rows={2}
              {...register("alamat")} />
          </div>

          {/* Meter Awal (hanya saat tambah) */}
          {!editTarget && (
            <div>
              <label htmlFor="member-meter-awal" className="section-label">Meter Awal Pertama (m³) *</label>
              <input id="member-meter-awal" className="input-field mono" inputMode="numeric"
                placeholder="Angka meter saat pemasangan"
                {...register("meterAwalPertama")} />
              {errors.meterAwalPertama && (
                <p style={{ fontSize: 13, color: "var(--color-belum)", marginTop: 4 }}>{errors.meterAwalPertama.message}</p>
              )}
              <div style={{ fontSize: 13, color: "var(--color-txt3)", marginTop: 4 }}>
                Digunakan sebagai meter awal bulan pertama entry.
              </div>
            </div>
          )}

          {/* Status (hanya saat edit) */}
          {editTarget && (
            <div>
              <div className="section-label" id="member-status-label">Status</div>
              <div className="row-10" role="group" aria-labelledby="member-status-label">
                {(["aktif", "nonaktif", "pindah"] as MemberStatus[]).map((s) => (
                  <button type="button" key={s} onClick={() => setValue("status", s)} style={{
                    flex: 1, height: 48, borderRadius: 8, fontWeight: 600, fontSize: 13,
                    cursor: "pointer", border: "1.5px solid",
                    borderColor: watchedStatus === s ? STATUS_COLOR[s] : "var(--color-border)",
                    background: watchedStatus === s ? STATUS_BG[s] : "transparent",
                    color: watchedStatus === s ? STATUS_COLOR[s] : "var(--color-txt3)",
                  }}>
                    {STATUS_LABEL[s]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Root Error */}
          {errors.root && (
            <div style={{
              background: "rgba(185,28,28,0.1)", border: "1px solid var(--color-belum)",
              borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "var(--color-belum)",
            }}>
              {errors.root.message}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button type="button" className="btn-secondary" style={{ flex: 1, height: 48 }} onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="btn-primary" style={{ flex: 2, height: 48 }} disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan…" : editTarget ? "Simpan Perubahan" : "Tambah Pelanggan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
