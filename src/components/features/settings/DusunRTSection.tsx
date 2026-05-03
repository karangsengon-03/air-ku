"use client";
import React, { useState } from "react";
import { MapPin, Plus, Edit2, Trash2, ChevronDown, ChevronUp, X } from "lucide-react";
import { updateSettings } from "@/lib/db";
import { AppSettings } from "@/types";
import SettingsSection from "./SettingsSection";
import { toast } from "@/lib/toast";

// ── ModalInput
function ModalInput({
  title, placeholder, initialValue = "", onSave, onClose,
}: {
  title: string; placeholder: string; initialValue?: string;
  onSave: (val: string) => void; onClose: () => void;
}) {
  const [val, setVal] = React.useState(initialValue);
  const handleSave = () => { const t = val.trim(); if (!t) return; onSave(t); };
  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 20px" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-fade-in-up"
        style={{ background: "var(--color-card)", borderRadius: 16, padding: 24, width: "100%", maxWidth: 360, boxShadow: "0 20px 60px rgba(0,0,0,0.3)", display: "flex", flexDirection: "column", gap: 16 }}
      >
        <div style={{ fontWeight: 800, fontSize: 17, color: "var(--color-txt)" }}>{title}</div>
        <input
          className="input-field" type="text" inputMode="text" autoComplete="off"
          placeholder={placeholder} value={val} onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") onClose(); }}
          autoFocus style={{ fontSize: 16, height: 48 }}
        />
        <div className="row-10">
          <button className="btn-secondary" style={{ flex: 1, height: 48 }} onClick={onClose}>Batal</button>
          <button className="btn-primary" style={{ flex: 2, height: 48 }} onClick={handleSave} disabled={!val.trim()}>Simpan</button>
        </div>
      </div>
    </div>
  );
}

interface DusunRTSectionProps {
  settings: AppSettings;
  showConfirm: (title: string, message: string, onConfirm: () => void, danger?: boolean) => void;
}

export default function DusunRTSection({ settings, showConfirm }: DusunRTSectionProps) {
  const [modal, setModal] = React.useState<{
    type: "tambah-dusun" | "edit-dusun" | "tambah-rt" | null;
    dusun?: string; initialValue?: string;
  }>({ type: null });
  const [expandedDusun, setExpandedDusun] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const dusunList = settings.dusunList || [];
  const rtPerDusun = settings.rtPerDusun || {};

  const save = async (data: Partial<typeof settings>) => {
    setSaving(true);
    try { await updateSettings(data); toast.success("Tersimpan"); }
    catch { toast.error("Gagal menyimpan"); }
    finally { setSaving(false); }
  };

  const closeModal = () => setModal({ type: null });

  const tambahDusun = async (name: string) => {
    if (dusunList.includes(name)) { toast.error("Nama dusun sudah ada"); return; }
    await save({ dusunList: [...dusunList, name].sort(), rtPerDusun: { ...rtPerDusun, [name]: [] } });
    closeModal();
  };

  const editDusun = async (oldName: string, newName: string) => {
    if (newName === oldName) { closeModal(); return; }
    if (dusunList.includes(newName)) { toast.error("Nama dusun sudah ada"); return; }
    const newList = dusunList.map((d) => d === oldName ? newName : d).sort();
    const newRtPerDusun = { ...rtPerDusun };
    newRtPerDusun[newName] = newRtPerDusun[oldName] || [];
    delete newRtPerDusun[oldName];
    await save({ dusunList: newList, rtPerDusun: newRtPerDusun });
    if (expandedDusun === oldName) setExpandedDusun(newName);
    closeModal();
  };

  const hapusDusun = (name: string) => {
    showConfirm("Hapus Dusun",
      `Hapus dusun "${name}" beserta semua RT-nya? Data pelanggan tidak terhapus.`,
      async () => {
        const newRtPerDusun = { ...rtPerDusun };
        delete newRtPerDusun[name];
        await save({ dusunList: dusunList.filter((d) => d !== name), rtPerDusun: newRtPerDusun });
        if (expandedDusun === name) setExpandedDusun(null);
      }, true);
  };

  const tambahRT = async (dusun: string, rt: string) => {
    const current = rtPerDusun[dusun] || [];
    if (current.includes(rt)) { toast.error("RT sudah ada"); return; }
    const newList = [...current, rt].sort((a, b) => a.localeCompare(b, "id", { numeric: true }));
    await save({ rtPerDusun: { ...rtPerDusun, [dusun]: newList } });
    closeModal();
  };

  const hapusRT = (dusun: string, rt: string) => {
    showConfirm("Hapus RT", `Hapus ${rt} dari Dusun ${dusun}? Data pelanggan tidak terhapus.`, async () => {
      const newList = (rtPerDusun[dusun] || []).filter((r) => r !== rt);
      await save({ rtPerDusun: { ...rtPerDusun, [dusun]: newList } });
    }, true);
  };

  return (
    <>
      {modal.type === "tambah-dusun" && (
        <ModalInput title="Tambah Dusun Baru" placeholder="cth: Dusun Krajan, Dusun Timur..." onSave={tambahDusun} onClose={closeModal} />
      )}
      {modal.type === "edit-dusun" && modal.dusun && (
        <ModalInput title="Edit Nama Dusun" placeholder="Nama dusun baru..." initialValue={modal.initialValue || ""}
          onSave={(val) => editDusun(modal.dusun!, val)} onClose={closeModal} />
      )}
      {modal.type === "tambah-rt" && modal.dusun && (
        <ModalInput title={`Tambah RT — ${modal.dusun}`} placeholder="cth: 001, 002, RT 01..."
          onSave={(val) => tambahRT(modal.dusun!, val)} onClose={closeModal} />
      )}

      <SettingsSection icon={<MapPin size={18} />} title="Dusun & RT">
        <div style={{ paddingTop: 12 }}>
          <button className="btn-primary" style={{ width: "100%", marginBottom: 14, height: 48, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            onClick={() => setModal({ type: "tambah-dusun" })} disabled={saving}>
            <Plus size={16} /> Tambah Dusun Baru
          </button>

          {dusunList.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--color-txt3)", textAlign: "center", padding: "8px 0" }}>
              Belum ada dusun. Klik tombol di atas untuk menambah.
            </p>
          ) : dusunList.map((dusun) => (
            <div key={dusun} style={{ marginBottom: 8, border: "1px solid var(--color-border)", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", padding: "14px 16px", background: "var(--color-bg)", gap: 6 }}>
                <button
                  onClick={() => setExpandedDusun(expandedDusun === dusun ? null : dusun)}
                  style={{ flex: 1, textAlign: "left", background: "none", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 700, color: "var(--color-txt)", display: "flex", alignItems: "center", gap: 8 }}
                >
                  <MapPin size={14} style={{ color: "var(--color-primary)", flexShrink: 0 }} />
                  <span>{dusun}</span>
                  <span style={{ fontSize: 13, color: "var(--color-txt3)", fontWeight: 400 }}>({(rtPerDusun[dusun] || []).length} RT)</span>
                  {expandedDusun === dusun
                    ? <ChevronUp size={14} style={{ marginLeft: "auto", color: "var(--color-txt3)" }} />
                    : <ChevronDown size={14} style={{ marginLeft: "auto", color: "var(--color-txt3)" }} />}
                </button>
                <button onClick={() => setModal({ type: "edit-dusun", dusun, initialValue: dusun })}
                  style={{ color: "var(--color-primary)", background: "none", border: "none", cursor: "pointer", padding: "6px 8px" }}>
                  <Edit2 size={15} />
                </button>
                <button onClick={() => hapusDusun(dusun)}
                  style={{ color: "var(--color-belum)", background: "none", border: "none", cursor: "pointer", padding: "6px 8px" }}>
                  <Trash2 size={15} />
                </button>
              </div>

              {expandedDusun === dusun && (
                <div style={{ padding: "14px 14px", background: "var(--color-card)", borderTop: "1px solid var(--color-border)" }}>
                  {(rtPerDusun[dusun] || []).length === 0 ? (
                    <p style={{ fontSize: 13, color: "var(--color-txt3)", marginBottom: 12, textAlign: "center" }}>Belum ada RT di dusun ini.</p>
                  ) : (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                      {(rtPerDusun[dusun] || []).map((rt) => (
                        <div key={rt} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 20, background: "var(--color-bg)", border: "1px solid var(--color-border)", fontSize: 13, fontWeight: 600 }}>
                          <span style={{ color: "var(--color-txt)" }}>{rt}</span>
                          <button onClick={() => hapusRT(dusun, rt)}
                            style={{ color: "var(--color-belum)", background: "none", border: "none", cursor: "pointer", padding: 2, lineHeight: 0, display: "flex", alignItems: "center" }}>
                            <X size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <button className="btn-secondary" style={{ width: "100%", height: 48, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 13 }}
                    onClick={() => setModal({ type: "tambah-rt", dusun })} disabled={saving}>
                    <Plus size={14} /> Tambah RT di {dusun}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </SettingsSection>
    </>
  );
}
