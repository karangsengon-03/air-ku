"use client";
// #16d — Sub-komponen sort bar MembersView
import { ChevronDown, ChevronUp, SortAsc } from "lucide-react";

export type SortKey = "nomorSambungan" | "nama" | "dusun" | "rt";

export const SORT_LABELS: Record<SortKey, string> = {
  nomorSambungan: "No. Sambungan",
  nama: "Nama",
  dusun: "Dusun",
  rt: "RT",
};

interface MembersSortProps {
  sortKey: SortKey;
  sortAsc: boolean;
  showFilter: boolean;
  activeFilterCount: number;
  onToggleFilter: () => void;
  onToggleSort: (key: SortKey) => void;
}

export default function MembersSort({
  sortKey,
  sortAsc,
  showFilter,
  activeFilterCount,
  onToggleFilter,
  onToggleSort,
}: MembersSortProps) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {/* Filter toggle */}
      <button
        onClick={onToggleFilter}
        style={{
          height: 48, paddingInline: 14, borderRadius: 8, fontSize: 13, fontWeight: 700,
          border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
          background: (showFilter || activeFilterCount > 0) ? "var(--color-primary)" : "var(--color-bg)",
          color: (showFilter || activeFilterCount > 0) ? "white" : "var(--color-txt3)",
          outline: (!showFilter && activeFilterCount === 0) ? "1px solid var(--color-border)" : "none",
          position: "relative",
        }}
      >
        {showFilter ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        Saring
        {activeFilterCount > 0 && (
          <span style={{
            position: "absolute", top: -6, right: -6,
            width: 20, height: 20, borderRadius: "50%",
            background: "var(--color-belum)", color: "white",
            fontSize: 13, fontWeight: 800,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Sort buttons */}
      {(["nomorSambungan", "nama", "dusun", "rt"] as SortKey[]).map((key) => (
        <button
          key={key}
          onClick={() => onToggleSort(key)}
          style={{
            flex: 1, height: 48, borderRadius: 8, fontSize: 13, fontWeight: 700,
            border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
            background: sortKey === key ? "var(--color-primary)" : "var(--color-bg)",
            color: sortKey === key ? "white" : "var(--color-txt3)",
            outline: sortKey !== key ? "1px solid var(--color-border)" : "none",
          }}
        >
          {key === "nomorSambungan" ? "No." : key === "nama" ? "Nama" : key === "dusun" ? "Dusun" : "RT"}
          {sortKey === key && (
            <SortAsc size={11} style={{ transform: sortAsc ? "none" : "scaleY(-1)", transition: "transform 0.15s" }} />
          )}
        </button>
      ))}
    </div>
  );
}
