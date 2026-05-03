"use client";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface SettingsSectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export default function SettingsSection({ icon, title, children, defaultOpen = false }: SettingsSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card" style={{ marginBottom: 12, overflow: "hidden" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px", background: "none", border: "none", cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: "var(--color-primary)" }}>{icon}</span>
          <span style={{ fontWeight: 700, fontSize: 15, color: "var(--color-txt)" }}>{title}</span>
        </div>
        <span style={{ color: "var(--color-txt3)" }}>
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </span>
      </button>
      {open && (
        <div style={{ padding: "0 16px 16px", borderTop: "1px solid var(--color-border)" }}>
          {children}
        </div>
      )}
    </div>
  );
}
