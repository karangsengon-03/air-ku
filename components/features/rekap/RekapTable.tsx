"use client";
import { CheckCircle2, Clock } from "lucide-react";
import { formatRp, formatM3 } from "@/lib/helpers";
import { RekapRow } from "@/lib/export";

interface RekapTableProps {
  rows: RekapRow[];
  totalM3: number;
  totalTerkumpul: number;
  totalTagihan: number;
  jumlahLunas: number;
  jumlahBelum: number;
}

export default function RekapTable({
  rows, totalM3, totalTerkumpul, totalTagihan, jumlahLunas, jumlahBelum,
}: RekapTableProps) {
  const COL_HEADERS = [
    { label: "No", align: "center" as const },
    { label: "Nama", align: "left" as const },
    { label: "Dusun/RT", align: "left" as const },
    { label: "Pakai", align: "right" as const },
    { label: "Tagihan", align: "right" as const },
    { label: "Status", align: "center" as const },
  ];

  return (
    <div className="card overflow-hidden mb-3" style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", minWidth: 480, borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "var(--color-bg)" }}>
            {COL_HEADERS.map((col) => (
              <th
                key={col.label}
                style={{
                  padding: "13px 10px", textAlign: col.align, fontWeight: 700,
                  fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em",
                  color: "var(--color-txt3)", borderBottom: "1px solid var(--color-border)", whiteSpace: "nowrap",
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={`${row.nomorSambungan}-${idx}`} style={{ background: idx % 2 === 0 ? "var(--color-card)" : "var(--color-bg)" }}>
              <td style={{ padding: "13px 10px", textAlign: "center", color: "var(--color-txt3)", fontSize: 12 }}>{idx + 1}</td>
              <td style={{ padding: "13px 10px" }}>
                <div className="font-semibold" style={{ color: "var(--color-txt)" }}>{row.nama}</div>
                <div className="text-xs" style={{ color: "var(--color-txt3)" }}>{row.nomorSambungan}</div>
              </td>
              <td style={{ padding: "13px 10px", color: "var(--color-txt2)", fontSize: 12 }}>
                {row.dusun ? `${row.dusun} / ` : ""}RT {row.rt}
              </td>
              <td style={{ padding: "13px 10px", textAlign: "right", fontFamily: "JetBrains Mono, monospace", color: "var(--color-txt2)" }}>
                {formatM3(row.pemakaian)}
              </td>
              <td style={{ padding: "13px 10px", textAlign: "right", fontFamily: "JetBrains Mono, monospace", fontWeight: 600, color: "var(--color-txt)" }}>
                {formatRp(row.total)}
              </td>
              <td style={{ padding: "13px 10px", textAlign: "center" }}>
                <span className={row.status === "lunas" ? "badge-lunas" : "badge-belum"} style={{ fontSize: 11 }}>
                  {row.status === "lunas" ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                  {row.status === "lunas" ? "Lunas" : "Belum"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ background: "var(--color-bg)", borderTop: "2px solid var(--color-border)" }}>
            <td colSpan={3} style={{ padding: "13px 10px", fontWeight: 700, fontSize: 12, color: "var(--color-txt2)" }}>
              Total ({rows.length} pelanggan)
            </td>
            <td style={{ padding: "13px 10px", textAlign: "right", fontFamily: "JetBrains Mono, monospace", fontWeight: 700, color: "var(--color-txt)" }}>
              {formatM3(totalM3)}
            </td>
            <td style={{ padding: "13px 10px", textAlign: "right", fontFamily: "JetBrains Mono, monospace", fontWeight: 700, color: "var(--color-primary)" }}>
              {formatRp(totalTerkumpul)}
              <div style={{ fontSize: 10, color: "var(--color-txt3)", fontWeight: 400 }}>/ {formatRp(totalTagihan)}</div>
            </td>
            <td style={{ padding: "13px 10px", textAlign: "center", fontSize: 12, color: "var(--color-txt3)" }}>
              {jumlahLunas} Lunas / {jumlahBelum} Belum
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
