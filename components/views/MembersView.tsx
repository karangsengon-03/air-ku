"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Users, Plus, Search, X, Pencil, Trash2, ChevronDown,
  ChevronUp, FileText, CheckCircle, XCircle, MinusCircle,
  Phone,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import {
  saveMember,
  updateMember,
  deleteMember,
  cekMemberPunyaTagihan,
  cekNomorSambunganTerpakai,
  getTagihanByMember,
  saveActivityLog,
} from "@/lib/db";
import { formatRp, formatTanggal } from "@/lib/helpers";
import { Member, MemberStatus, Tagihan } from "@/types";

const STATUS_LABEL: Record<MemberStatus, string> = {
  aktif: "Aktif",
  nonaktif: "Non-Aktif",
  pindah: "Pindah",
};

const STATUS_COLOR: Record<MemberStatus, string> = {
  aktif: "var(--color-lunas)",
  nonaktif: "var(--color-txt3)",
  pindah: "var(--color-tunggakan)",
};

const STATUS_BG: Record<MemberStatus, string> = {
  aktif: "rgba(21,128,61,0.12)",
  nonaktif: "rgba(107,114,128,0.12)",
  pindah: "rgba(146,64,14,0.12)",
};

interface FormData {
  nama: string;
  nomorSambungan: string;
  alamat: string;
  rt: string;
  dusun: string;
  status: MemberStatus;
  meterAwalPertama: string;
}

const EMPTY_FORM: FormData = {
  nama: "",
  nomorSambungan: "",
  alamat: "",
  rt: "",
  dusun: "",
  status: "aktif",
  meterAwalPertama: "",
};

export default function MembersView() {
  const { members, settings, firebaseUser, userRole, addToast, showConfirm } = useAppStore();
  const isAdmin = userRole?.role === "admin";

  // ── filter & search
  const [search, setSearch] = useState("");
  const [filterDusun, setFilterDusun] = useState("semua");
  const [filterStatus, setFilterStatus] = useState<"semua" | MemberStatus>("semua");

  // ── modal tambah/edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Member | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // ── detail riwayat
  const [detailMember, setDetailMember] = useState<Member | null>(null);
  const [riwayatTagihan, setRiwayatTagihan] = useState<Tagihan[]>([]);
  const [loadingRiwayat, setLoadingRiwayat] = useState(false);

  // ── filter panel
  const [showFilter, setShowFilter] = useState(false);

  // ─── Dusun list dari settings
  const dusunList = useMemo(() => settings.dusunList || [], [settings.dusunList]);

  // ─── RT list untuk dusun terpilih
  const rtList = useMemo(() => {
    if (!form.dusun) return [];
    return settings.rtPerDusun?.[form.dusun] || [];
  }, [form.dusun, settings.rtPerDusun]);

  // ─── Filtered members
  const filtered = useMemo(() => {
    return members.filter((m) => {
      if (filterStatus !== "semua" && m.status !== filterStatus) return false;
      if (filterDusun !== "semua" && m.dusun !== filterDusun) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          m.nama.toLowerCase().includes(q) ||
          m.nomorSambungan.toLowerCase().includes(q) ||
          m.dusun?.toLowerCase().includes(q) ||
          m.rt?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [members, search, filterDusun, filterStatus]);

  // ─── Stat counts
  const stats = useMemo(() => ({
    total: members.length,
    aktif: members.filter((m) => m.status === "aktif").length,
    nonaktif: members.filter((m) => m.status === "nonaktif").length,
    pindah: members.filter((m) => m.status === "pindah").length,
  }), [members]);

  // ─── Open tambah
  function openTambah() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setModalOpen(true);
  }

  // ─── Open edit
  function openEdit(m: Member) {
    setEditTarget(m);
    setForm({
      nama: m.nama,
      nomorSambungan: m.nomorSambungan,
      alamat: m.alamat,
      rt: m.rt,
      dusun: m.dusun,
      status: m.status,
      meterAwalPertama: String(m.meterAwalPertama),
    });
    setFormError("");
    setModalOpen(true);
  }

  // ─── Save member
  async function handleSave() {
    setFormError("");
    if (!form.nama.trim()) return setFormError("Nama wajib diisi.");
    if (!form.nomorSambungan.trim()) return setFormError("Nomor sambungan wajib diisi.");
    if (!form.dusun) return setFormError("Pilih dusun.");
    const meterVal = parseInt(form.meterAwalPertama);
    if (!editTarget && (isNaN(meterVal) || meterVal < 0)) {
      return setFormError("Meter awal pertama wajib diisi (angka ≥ 0).");
    }

    setSaving(true);
    try {
      // cek nomor sambungan unik
      const sudahAda = await cekNomorSambunganTerpakai(
        form.nomorSambungan.trim(),
        editTarget?.id
      );
      if (sudahAda) {
        setSaving(false);
        return setFormError(`Nomor sambungan "${form.nomorSambungan}" sudah digunakan pelanggan lain.`);
      }

      if (editTarget) {
        await updateMember(editTarget.id!, {
          nama: form.nama.trim(),
          nomorSambungan: form.nomorSambungan.trim(),
          alamat: form.alamat.trim(),
          rt: form.rt,
          dusun: form.dusun,
          status: form.status,
        });
        await saveActivityLog(
          "edit_member",
          `Edit pelanggan: ${form.nama.trim()} (${form.nomorSambungan})`,
          firebaseUser!.email!,
          userRole!.role
        );
        addToast("success", "Data pelanggan diperbarui.");
      } else {
        await saveMember({
          nama: form.nama.trim(),
          nomorSambungan: form.nomorSambungan.trim(),
          alamat: form.alamat.trim(),
          rt: form.rt,
          dusun: form.dusun,
          status: form.status,
          meterAwalPertama: meterVal,
          createdBy: firebaseUser!.email!,
        });
        await saveActivityLog(
          "tambah_member",
          `Tambah pelanggan baru: ${form.nama.trim()} (${form.nomorSambungan})`,
          firebaseUser!.email!,
          userRole!.role
        );
        addToast("success", "Pelanggan baru berhasil ditambahkan.");
      }
      setModalOpen(false);
    } catch (e) {
      console.error(e);
      setFormError("Gagal menyimpan. Coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  // ─── Delete member
  async function handleDelete(m: Member) {
    const punyaTagihan = await cekMemberPunyaTagihan(m.id!);
    if (punyaTagihan) {
      addToast("error", "Tidak bisa hapus — pelanggan memiliki riwayat tagihan. Ubah status menjadi Non-Aktif atau Pindah.");
      return;
    }
    showConfirm(
      "Hapus Pelanggan",
      `Yakin hapus pelanggan "${m.nama}"? Tindakan ini tidak bisa dibatalkan.`,
      async () => {
        try {
          await deleteMember(m.id!);
          await saveActivityLog(
            "hapus_member",
            `Hapus pelanggan: ${m.nama} (${m.nomorSambungan})`,
            firebaseUser!.email!,
            userRole!.role
          );
          addToast("success", "Pelanggan dihapus.");
        } catch {
          addToast("error", "Gagal menghapus pelanggan.");
        }
      },
      true
    );
  }

  // ─── Detail riwayat
  async function openDetail(m: Member) {
    setDetailMember(m);
    setLoadingRiwayat(true);
    try {
      const list = await getTagihanByMember(m.id!);
      setRiwayatTagihan(list);
    } catch {
      setRiwayatTagihan([]);
    } finally {
      setLoadingRiwayat(false);
    }
  }

  // ─── Reset RT ketika dusun berubah
  useEffect(() => {
    const rts = settings.rtPerDusun?.[form.dusun] || [];
    if (form.rt && !rts.includes(form.rt)) {
      setForm((f) => ({ ...f, rt: "" }));
    }
  }, [form.dusun]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

      {/* ── Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6, marginBottom: 4 }}>
        {[
          { label: "Total", value: stats.total, color: "var(--color-primary)" },
          { label: "Aktif", value: stats.aktif, color: "var(--color-lunas)" },
          { label: "Non-Aktif", value: stats.nonaktif, color: "var(--color-txt3)" },
          { label: "Pindah", value: stats.pindah, color: "var(--color-tunggakan)" },
        ].map((s) => (
          <div key={s.label} className="card" style={{ padding: "10px 4px", textAlign: "center", minWidth: 0 }}>
            <div className="mono" style={{ fontSize: 18, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 10, color: "var(--color-txt3)", marginTop: 3, fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Search + Filter + Tambah */}
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Search size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--color-txt3)" }} />
          <input
            className="input-field"
            style={{ paddingLeft: 40 }}
            placeholder="Cari nama / no. sambungan / dusun…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 4, color: "var(--color-txt3)" }}
            >
              <X size={16} />
            </button>
          )}
        </div>
        <button
          className="btn-secondary"
          style={{ paddingInline: 14, gap: 6 }}
          onClick={() => setShowFilter(!showFilter)}
        >
          {showFilter ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {isAdmin && (
          <button className="btn-primary" style={{ paddingInline: 16, gap: 6 }} onClick={openTambah}>
            <Plus size={18} />
          </button>
        )}
      </div>

      {/* ── Filter Panel */}
      {showFilter && (
        <div className="card" style={{ padding: 16, marginBottom: 12, display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <div className="section-label">Status</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(["semua", "aktif", "nonaktif", "pindah"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  style={{
                    padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600,
                    cursor: "pointer", border: "1.5px solid",
                    borderColor: filterStatus === s ? "var(--color-primary)" : "var(--color-border)",
                    background: filterStatus === s ? "var(--color-primary)" : "transparent",
                    color: filterStatus === s ? "#fff" : "var(--color-txt3)",
                  }}
                >
                  {s === "semua" ? "Semua" : STATUS_LABEL[s as MemberStatus]}
                </button>
              ))}
            </div>
          </div>
          {dusunList.length > 0 && (
            <div>
              <div className="section-label">Dusun</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {["semua", ...dusunList].map((d) => (
                  <button
                    key={d}
                    onClick={() => setFilterDusun(d)}
                    style={{
                      padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600,
                      cursor: "pointer", border: "1.5px solid",
                      borderColor: filterDusun === d ? "var(--color-primary)" : "var(--color-border)",
                      background: filterDusun === d ? "var(--color-primary)" : "transparent",
                      color: filterDusun === d ? "#fff" : "var(--color-txt3)",
                    }}
                  >
                    {d === "semua" ? "Semua Dusun" : d}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Result count */}
      {(search || filterStatus !== "semua" || filterDusun !== "semua") && (
        <div style={{ fontSize: 13, color: "var(--color-txt3)", marginBottom: 10 }}>
          Menampilkan {filtered.length} dari {members.length} pelanggan
        </div>
      )}

      {/* ── Member List */}
      {members.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: "center" }}>
          <Users size={40} style={{ color: "var(--color-txt3)", margin: "0 auto 12px" }} />
          <div style={{ color: "var(--color-txt3)", fontSize: 15 }}>Belum ada pelanggan.</div>
          {isAdmin && (
            <button className="btn-primary" style={{ margin: "16px auto 0", width: 180 }} onClick={openTambah}>
              <Plus size={18} /> Tambah Pelanggan
            </button>
          )}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: 32, textAlign: "center", color: "var(--color-txt3)" }}>
          Tidak ada pelanggan yang sesuai filter.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((m) => (
            <div key={m.id} className="card" style={{ padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>{m.nama}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 20,
                      color: STATUS_COLOR[m.status], background: STATUS_BG[m.status],
                    }}>
                      {STATUS_LABEL[m.status]}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <span className="mono" style={{ fontSize: 13, color: "var(--color-primary)", fontWeight: 600 }}>
                      #{m.nomorSambungan}
                    </span>
                    {m.dusun && (
                      <span style={{ fontSize: 13, color: "var(--color-txt3)" }}>
                        {m.dusun}{m.rt ? ` · RT ${m.rt}` : ""}
                      </span>
                    )}
                  </div>
                  {m.alamat && (
                    <div style={{ fontSize: 13, color: "var(--color-txt3)", marginTop: 4, lineHeight: 1.4 }}>{m.alamat}</div>
                  )}
                </div>
                {/* Actions */}
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button
                    className="btn-ghost"
                    style={{ padding: "8px", minHeight: 40, color: "var(--color-primary)" }}
                    onClick={() => openDetail(m)}
                    title="Riwayat tagihan"
                  >
                    <FileText size={17} />
                  </button>
                  {isAdmin && (
                    <>
                      <button
                        className="btn-ghost"
                        style={{ padding: "8px", minHeight: 40 }}
                        onClick={() => openEdit(m)}
                        title="Edit"
                      >
                        <Pencil size={17} />
                      </button>
                      <button
                        className="btn-ghost"
                        style={{ padding: "8px", minHeight: 40, color: "var(--color-belum)" }}
                        onClick={() => handleDelete(m)}
                        title="Hapus"
                      >
                        <Trash2 size={17} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal Tambah / Edit */}
      {modalOpen && (
        <div className="bottom-sheet">
          <div className="bottom-sheet-content card" style={{
            borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
            borderTopLeftRadius: 20, borderTopRightRadius: 20,
            padding: "20px 20px 32px",
          }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontWeight: 800, fontSize: 17 }}>
                {editTarget ? "Edit Pelanggan" : "Tambah Pelanggan Baru"}
              </div>
              <button className="btn-ghost" style={{ padding: 8 }} onClick={() => setModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Nama */}
              <div>
                <div className="section-label">Nama Lengkap *</div>
                <input
                  className="input-field"
                  placeholder="Nama pelanggan"
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                />
              </div>

              {/* Nomor Sambungan */}
              <div>
                <div className="section-label">Nomor Sambungan *</div>
                <input
                  className="input-field mono"
                  placeholder="Contoh: 001, A-12"
                  value={form.nomorSambungan}
                  onChange={(e) => setForm({ ...form, nomorSambungan: e.target.value })}
                />
              </div>

              {/* Dusun */}
              <div>
                <div className="section-label">Dusun *</div>
                {dusunList.length > 0 ? (
                  <select
                    className="input-field"
                    value={form.dusun}
                    onChange={(e) => setForm({ ...form, dusun: e.target.value, rt: "" })}
                    style={{ cursor: "pointer" }}
                  >
                    <option value="">-- Pilih Dusun --</option>
                    {dusunList.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                ) : (
                  <input
                    className="input-field"
                    placeholder="Nama dusun"
                    value={form.dusun}
                    onChange={(e) => setForm({ ...form, dusun: e.target.value })}
                  />
                )}
              </div>

              {/* RT */}
              <div>
                <div className="section-label">RT</div>
                {rtList.length > 0 ? (
                  <select
                    className="input-field"
                    value={form.rt}
                    onChange={(e) => setForm({ ...form, rt: e.target.value })}
                    style={{ cursor: "pointer" }}
                  >
                    <option value="">-- Pilih RT --</option>
                    {rtList.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                ) : (
                  <input
                    className="input-field"
                    placeholder="Nomor RT (opsional)"
                    value={form.rt}
                    onChange={(e) => setForm({ ...form, rt: e.target.value })}
                  />
                )}
              </div>

              {/* Alamat */}
              <div>
                <div className="section-label">Alamat</div>
                <textarea
                  className="input-field"
                  style={{ height: "auto", paddingTop: 14, paddingBottom: 14, resize: "none", minHeight: 80 }}
                  placeholder="Alamat lengkap (opsional)"
                  value={form.alamat}
                  onChange={(e) => setForm({ ...form, alamat: e.target.value })}
                  rows={2}
                />
              </div>

              {/* Meter Awal (hanya saat tambah) */}
              {!editTarget && (
                <div>
                  <div className="section-label">Meter Awal Pertama (m³) *</div>
                  <input
                    className="input-field mono"
                    inputMode="numeric"
                    placeholder="Angka meter saat pemasangan"
                    value={form.meterAwalPertama}
                    onChange={(e) => setForm({ ...form, meterAwalPertama: e.target.value })}
                  />
                  <div style={{ fontSize: 12, color: "var(--color-txt3)", marginTop: 4 }}>
                    Digunakan sebagai meter awal bulan pertama entry.
                  </div>
                </div>
              )}

              {/* Status (hanya saat edit) */}
              {editTarget && (
                <div>
                  <div className="section-label">Status</div>
                  <div style={{ display: "flex", gap: 10 }}>
                    {(["aktif", "nonaktif", "pindah"] as MemberStatus[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => setForm({ ...form, status: s })}
                        style={{
                          flex: 1, height: 48, borderRadius: 8, fontWeight: 600, fontSize: 14,
                          cursor: "pointer", border: "1.5px solid",
                          borderColor: form.status === s ? STATUS_COLOR[s] : "var(--color-border)",
                          background: form.status === s ? STATUS_BG[s] : "transparent",
                          color: form.status === s ? STATUS_COLOR[s] : "var(--color-txt3)",
                        }}
                      >
                        {STATUS_LABEL[s]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Error */}
              {formError && (
                <div style={{
                  background: "rgba(185,28,28,0.1)", border: "1px solid var(--color-belum)",
                  borderRadius: 8, padding: "10px 14px", fontSize: 14, color: "var(--color-belum)",
                }}>
                  {formError}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setModalOpen(false)}>
                  Batal
                </button>
                <button
                  className="btn-primary"
                  style={{ flex: 2 }}
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "Menyimpan…" : editTarget ? "Simpan Perubahan" : "Tambah Pelanggan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Detail Riwayat */}
      {detailMember && (
        <div className="bottom-sheet">
          <div className="bottom-sheet-content card" style={{
            borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
            borderTopLeftRadius: 20, borderTopRightRadius: 20,
            padding: "20px 16px 32px",
          }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 17 }}>{detailMember.nama}</div>
                <div style={{ display: "flex", gap: 10, marginTop: 4, flexWrap: "wrap" }}>
                  <span className="mono" style={{ fontSize: 13, color: "var(--color-primary)", fontWeight: 600 }}>
                    #{detailMember.nomorSambungan}
                  </span>
                  <span style={{ fontSize: 13, color: "var(--color-txt3)" }}>
                    {detailMember.dusun}{detailMember.rt ? ` · RT ${detailMember.rt}` : ""}
                  </span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 20,
                    color: STATUS_COLOR[detailMember.status],
                    background: STATUS_BG[detailMember.status],
                  }}>
                    {STATUS_LABEL[detailMember.status]}
                  </span>
                </div>
              </div>
              <button className="btn-ghost" style={{ padding: 8 }} onClick={() => setDetailMember(null)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ fontSize: 13, color: "var(--color-txt3)", marginBottom: 4 }}>
              Meter awal pertama: <span className="mono" style={{ color: "var(--color-txt)" }}>{detailMember.meterAwalPertama} m³</span>
            </div>

            <hr className="divider" />
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Riwayat Tagihan</div>

            {loadingRiwayat ? (
              <div style={{ textAlign: "center", padding: 24, color: "var(--color-txt3)" }}>Memuat…</div>
            ) : riwayatTagihan.length === 0 ? (
              <div style={{ textAlign: "center", padding: 24, color: "var(--color-txt3)" }}>
                Belum ada tagihan tercatat.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {riwayatTagihan.map((t) => (
                  <div key={t.id} style={{
                    padding: "12px 14px", borderRadius: 10,
                    background: "var(--color-bg)", border: "1px solid var(--color-border)",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>
                        {["", "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"][t.bulan]} {t.tahun}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--color-txt3)", marginTop: 2 }}>
                        {t.pemakaian} m³ · {formatRp(t.total)}
                      </div>
                    </div>
                    <span className={t.status === "lunas" ? "badge-lunas" : "badge-belum"}>
                      {t.status === "lunas" ? "Lunas" : "Belum"}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <button className="btn-secondary" style={{ width: "100%", marginTop: 16 }} onClick={() => setDetailMember(null)}>
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
