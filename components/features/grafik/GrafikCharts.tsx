"use client";
import { formatRp, formatM3 } from "@/lib/helpers";

// ── Custom Tooltip Recharts ────────────────────────────────────────────────────

export function TooltipRp({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card p-2" style={{ fontSize: 12, minWidth: 140 }}>
      <div className="font-bold mb-1" style={{ color: "var(--color-txt)" }}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ color: p.color }}>
          {p.name}: <span className="font-semibold">{formatRp(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function TooltipM3({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card p-2" style={{ fontSize: 12, minWidth: 120 }}>
      <div className="font-bold mb-1" style={{ color: "var(--color-txt)" }}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ color: p.color }}>
          {p.name}: <span className="font-semibold">{formatM3(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ── SectionHeader ─────────────────────────────────────────────────────────────

export function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div style={{ color: "var(--color-primary)" }}>{icon}</div>
      <span className="font-bold text-sm" style={{ color: "var(--color-txt)" }}>{title}</span>
    </div>
  );
}

// ── TopPelangganList ───────────────────────────────────────────────────────────

interface TopPelanggan {
  nama: string;
  nomorSambungan: string;
  pemakaian: number;
}

export function TopPelangganList({ data }: { data: TopPelanggan[] }) {
  if (data.length === 0) return null;
  const maxM3 = data[0].pemakaian || 1;

  return (
    <div className="flex flex-col gap-4">
      {data.map((p, idx) => {
        const pct = (p.pemakaian / maxM3) * 100;
        return (
          <div key={p.nomorSambungan} className="flex items-center gap-3">
            <span style={{ fontSize: 18, width: 24, textAlign: "center" }}>{idx + 1}</span>
            <div className="flex-min">
              <div className="font-semibold text-sm truncate" style={{ color: "var(--color-txt)" }}>
                {p.nama}
              </div>
              <div style={{ height: 6, background: "var(--color-border)", borderRadius: 3, marginTop: 3, overflow: "hidden" }}>
                <div style={{
                  height: "100%", width: `${pct}%`,
                  background: idx === 0 ? "#F59E0B" : "var(--color-primary)",
                  borderRadius: 3, transition: "width 0.5s ease",
                }} />
              </div>
            </div>
            <div className="mono font-bold text-sm" style={{ color: "var(--color-txt2)", flexShrink: 0 }}>
              {formatM3(p.pemakaian)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
