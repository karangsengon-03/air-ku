"use client";
// #16d — Sub-komponen filter panel MembersView
import { MemberStatus } from "@/types";

interface MembersFilterProps {
  filterStatus: "semua" | MemberStatus;
  filterDusun: string;
  dusunList: string[];
  activeFilterCount: number;
  onStatusChange: (s: "semua" | MemberStatus) => void;
  onDusunChange: (d: string) => void;
  onReset: () => void;
}

export default function MembersFilter({
  filterStatus,
  filterDusun,
  dusunList,
  activeFilterCount,
  onStatusChange,
  onDusunChange,
  onReset,
}: MembersFilterProps) {
  return (
    <div className="card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Status */}
      <div>
        <div className="section-label">Status</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {(["semua", "aktif", "nonaktif", "pindah"] as const).map((s) => (
            <button
              key={s}
              onClick={() => onStatusChange(s)}
              style={{
                padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600,
                cursor: "pointer", border: "1.5px solid",
                borderColor: filterStatus === s ? "var(--color-primary)" : "var(--color-border)",
                background: filterStatus === s ? "var(--color-primary)" : "transparent",
                color: filterStatus === s ? "white" : "var(--color-txt3)",
              }}
            >
              {s === "semua" ? "Semua" : s === "aktif" ? "Aktif" : s === "nonaktif" ? "Non-Aktif" : "Pindah"}
            </button>
          ))}
        </div>
      </div>

      {/* Dusun */}
      {dusunList.length > 0 && (
        <div>
          <div className="section-label">Dusun</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["semua", ...dusunList].map((d) => (
              <button
                key={d}
                onClick={() => onDusunChange(d)}
                style={{
                  padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600,
                  cursor: "pointer", border: "1.5px solid",
                  borderColor: filterDusun === d ? "var(--color-primary)" : "var(--color-border)",
                  background: filterDusun === d ? "var(--color-primary)" : "transparent",
                  color: filterDusun === d ? "white" : "var(--color-txt3)",
                }}
              >
                {d === "semua" ? "Semua Dusun" : d}
              </button>
            ))}
          </div>
        </div>
      )}

      {activeFilterCount > 0 && (
        <button
          onClick={onReset}
          style={{
            alignSelf: "flex-start", fontSize: 13, color: "var(--color-belum)",
            background: "none", border: "none", cursor: "pointer",
            fontWeight: 600, padding: 0,
          }}
        >
          Reset filter
        </button>
      )}
    </div>
  );
}
