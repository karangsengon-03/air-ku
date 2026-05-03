"use client";
import { FileText, Pencil, Trash2 } from "lucide-react";
import { Member, MemberStatus } from "@/types";

export const STATUS_LABEL: Record<MemberStatus, string> = {
  aktif: "Aktif", nonaktif: "Non-Aktif", pindah: "Pindah",
};
export const STATUS_COLOR: Record<MemberStatus, string> = {
  aktif: "var(--color-lunas)", nonaktif: "var(--color-txt3)", pindah: "var(--color-tunggakan)",
};
export const STATUS_BG: Record<MemberStatus, string> = {
  aktif: "rgba(21,128,61,0.12)", nonaktif: "rgba(107,114,128,0.12)", pindah: "rgba(146,64,14,0.12)",
};

interface MemberCardProps {
  member: Member;
  isAdmin: boolean;
  onDetail: (m: Member) => void;
  onEdit: (m: Member) => void;
  onDelete: (m: Member) => void;
}

export default function MemberCard({ member: m, isAdmin, onDetail, onEdit, onDelete }: MemberCardProps) {
  return (
    <div className="card" style={{ padding: "14px 16px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div className="flex-min">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>{m.nama}</span>
            <span style={{
              fontSize: 13, fontWeight: 700, padding: "2px 9px", borderRadius: 20,
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
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          <button className="btn-ghost" style={{ padding: 8, color: "var(--color-primary)" }} onClick={() => onDetail(m)} title="Riwayat">
            <FileText size={17} />
          </button>
          {isAdmin && (
            <>
              <button className="btn-ghost" style={{ padding: 8 }} onClick={() => onEdit(m)} title="Edit">
                <Pencil size={17} />
              </button>
              <button className="btn-ghost" style={{ padding: 8, color: "var(--color-belum)" }} onClick={() => onDelete(m)} title="Hapus">
                <Trash2 size={17} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
