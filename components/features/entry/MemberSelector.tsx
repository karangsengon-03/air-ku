"use client";
import { Search, ChevronRight, User } from "lucide-react";
import { Member, Tagihan } from "@/types";

interface MemberSelectorProps {
  search: string;
  onSearchChange: (v: string) => void;
  members: Member[];
  tagihan: Tagihan[];
  bulanLabel: string;
  onSelect: (m: Member) => void;
}

export default function MemberSelector({
  search, onSearchChange, members, tagihan, bulanLabel, onSelect,
}: MemberSelectorProps) {
  const filtered = members.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      m.nama.toLowerCase().includes(q) ||
      m.nomorSambungan.toLowerCase().includes(q) ||
      m.dusun.toLowerCase().includes(q) ||
      m.rt.toLowerCase().includes(q)
    );
  });

  return (
    <div className="col-10">
      <p style={{ fontSize: 13, color: "var(--color-txt2)" }}>
        Pilih pelanggan untuk <strong>{bulanLabel}</strong>
      </p>

      <div style={{ position: "relative" }}>
        <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-txt3)" }} />
        <input
          className="input-field"
          style={{ paddingLeft: 38 }}
          placeholder="Cari nama, nomor, dusun, RT..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <User size={32} style={{ margin: "0 auto 8px", opacity: 0.4 }} />
          <p style={{ fontSize: 13 }}>
            {members.length === 0
              ? "Belum ada pelanggan. Tambah di menu Pelanggan."
              : "Tidak ada yang cocok."}
          </p>
        </div>
      ) : (
        filtered.map((m) => {
          const t = tagihan.find((t) => t.memberId === m.id);
          const sudahEntri = !!t;
          const isLunas = t?.status === "lunas";
          return (
            <button
              key={m.id}
              onClick={() => onSelect(m)}
              className="card"
              style={{ width: "100%", padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", textAlign: "left", cursor: "pointer" }}
            >
              <div>
                <p style={{ fontWeight: 700, fontSize: 14, color: "var(--color-txt)" }}>{m.nama}</p>
                <p style={{ fontSize: 11, color: "var(--color-txt3)", marginTop: 2 }}>
                  No. {m.nomorSambungan} · {m.dusun} RT {m.rt}
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {sudahEntri && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 10,
                    background: isLunas ? "rgba(21,128,61,0.12)" : "rgba(185,28,28,0.1)",
                    color: isLunas ? "var(--color-lunas)" : "var(--color-belum)",
                  }}>
                    {isLunas ? "Lunas" : "Belum"}
                  </span>
                )}
                <ChevronRight size={16} style={{ color: "var(--color-txt3)" }} />
              </div>
            </button>
          );
        })
      )}
    </div>
  );
}
