"use client";
// #16b — Sub-komponen tampilan ketika pelanggan sudah entry di bulan ini
import { CheckCircle2, Trash2 } from "lucide-react";
import { formatRp } from "@/lib/helpers";
import { Tagihan } from "@/types";

interface EntryAlreadyPaidProps {
  sudahAda: Tagihan;
  isAdmin: boolean;
  onHapus: (t: Tagihan) => void;
  onReset: () => void;
}

export default function EntryAlreadyPaid({
  sudahAda,
  isAdmin,
  onHapus,
  onReset,
}: EntryAlreadyPaidProps) {
  const tanggalEntry =
    (sudahAda.tanggalEntry as unknown as { seconds: number })?.seconds * 1000 || 0;

  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <CheckCircle2 size={18} style={{ color: "var(--color-lunas)" }} />
        <strong style={{ color: "var(--color-lunas)", fontSize: 15 }}>Sudah Entry Bayar</strong>
      </div>
      <div
        style={{
          background: "var(--color-bg)", borderRadius: 10,
          padding: "14px 16px", marginBottom: 12,
        }}
      >
        <div
          style={{
            fontSize: 20, fontWeight: 900, color: "var(--color-lunas)", fontFamily: "monospace",
          }}
        >
          {formatRp(sudahAda.total)}
        </div>
        <div style={{ fontSize: 13, color: "var(--color-txt3)", marginTop: 4 }}>
          Entry: {new Date(tanggalEntry).toLocaleDateString("id-ID")}
          {sudahAda.catatan && <span> · {sudahAda.catatan}</span>}
        </div>
      </div>
      <div className="row-8">
        {isAdmin && (
          <button
            onClick={() => onHapus(sudahAda)}
            style={{
              flex: 1, height: 48, borderRadius: 8,
              border: "1px solid var(--color-belum)",
              background: "rgba(185,28,28,0.07)",
              color: "var(--color-belum)", cursor: "pointer",
              fontSize: 13, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            <Trash2 size={14} /> Hapus Entry
          </button>
        )}
        <button
          onClick={onReset}
          style={{
            flex: 1, height: 48, borderRadius: 8,
            border: "1px solid var(--color-border)",
            background: "var(--color-bg)", color: "var(--color-txt2)",
            cursor: "pointer", fontSize: 13, fontWeight: 600,
          }}
        >
          Pelanggan Lain
        </button>
      </div>
    </div>
  );
}
