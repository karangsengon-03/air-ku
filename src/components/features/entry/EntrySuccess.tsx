"use client";
// #16b — Sub-komponen tampilan sukses setelah entry bayar
import { CheckCircle2, User } from "lucide-react";
import { formatRp } from "@/lib/helpers";

interface EntrySuccessProps {
  nama: string;
  bulanLabel: string;
  total: number;
  onReset: () => void;
}

export default function EntrySuccess({ nama, bulanLabel, total, onReset }: EntrySuccessProps) {
  return (
    <div className="col-12">
      <div className="card" style={{ padding: 24, textAlign: "center" }}>
        <div
          style={{
            width: 60, height: 52, borderRadius: "50%",
            background: "rgba(21,128,61,0.12)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 14px",
          }}
        >
          <CheckCircle2 size={30} style={{ color: "var(--color-lunas)" }} />
        </div>
        <p style={{ fontWeight: 800, fontSize: 18, color: "var(--color-txt)" }}>
          Entry Bayar Berhasil!
        </p>
        <p style={{ fontSize: 13, color: "var(--color-txt3)", marginTop: 4 }}>
          {nama} · {bulanLabel}
        </p>
        <div
          style={{
            marginTop: 14, background: "var(--color-bg)",
            borderRadius: 10, padding: "12px 16px",
          }}
        >
          <p style={{ fontSize: 13, color: "var(--color-txt3)" }}>Total Pembayaran</p>
          <p
            style={{
              fontSize: 24, fontWeight: 900, color: "var(--color-lunas)",
              fontFamily: "monospace", marginTop: 2,
            }}
          >
            {total === 0 ? "Rp 0 (Pelanggan Baru)" : formatRp(total)}
          </p>
          <p style={{ fontSize: 13, color: "var(--color-lunas)", marginTop: 6, fontWeight: 700 }}>
            Status: LUNAS
          </p>
        </div>
      </div>
      <button
        className="btn-primary"
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
        onClick={onReset}
      >
        <User size={16} /> Entry Pelanggan Berikutnya
      </button>
    </div>
  );
}
