"use client";
import { X } from "lucide-react";
import { Member, Tagihan } from "@/types";
import { formatRp } from "@/lib/helpers";
import { STATUS_LABEL, STATUS_COLOR, STATUS_BG } from "./MemberCard";

const BULAN_LABEL = ["", "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

interface MemberDetailProps {
  member: Member;
  riwayat: Tagihan[];
  loading: boolean;
  onClose: () => void;
}

export default function MemberDetail({ member: m, riwayat, loading, onClose }: MemberDetailProps) {
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
        style={{ width: "100%", maxWidth: 480, borderRadius: 20, padding: "20px 16px 28px" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17 }}>{m.nama}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap", alignItems: "center" }}>
              <span className="mono" style={{ fontSize: 13, color: "var(--color-primary)", fontWeight: 600 }}>
                #{m.nomorSambungan}
              </span>
              <span style={{ fontSize: 13, color: "var(--color-txt3)" }}>
                {m.dusun}{m.rt ? ` · RT ${m.rt}` : ""}
              </span>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 20,
                color: STATUS_COLOR[m.status], background: STATUS_BG[m.status],
              }}>
                {STATUS_LABEL[m.status]}
              </span>
            </div>
          </div>
          <button className="btn-ghost" style={{ padding: 8 }} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div style={{ fontSize: 13, color: "var(--color-txt3)", marginBottom: 12 }}>
          Meter awal pertama:{" "}
          <span className="mono" style={{ color: "var(--color-txt)", fontWeight: 600 }}>
            {m.meterAwalPertama} m³
          </span>
        </div>

        <div style={{ height: 1, background: "var(--color-border)", marginBottom: 14 }} />
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Riwayat Tagihan</div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 24, color: "var(--color-txt3)" }}>Memuat…</div>
        ) : riwayat.length === 0 ? (
          <div style={{ textAlign: "center", padding: 24, color: "var(--color-txt3)" }}>
            Belum ada tagihan tercatat.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {riwayat.map((t) => (
              <div key={t.id} style={{
                padding: "12px 14px", borderRadius: 10,
                background: "var(--color-bg)", border: "1px solid var(--color-border)",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>
                    {BULAN_LABEL[t.bulan]} {t.tahun}
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

        <button className="btn-secondary" style={{ width: "100%", marginTop: 16, height: 48 }} onClick={onClose}>
          Tutup
        </button>
      </div>
    </div>
  );
}
