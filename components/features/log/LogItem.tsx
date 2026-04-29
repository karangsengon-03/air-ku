"use client";
import { FileText } from "lucide-react";
import type { LucideProps } from "lucide-react";
import {
  UserPlus, UserMinus, Pencil, ClipboardList, CheckCircle2,
  Trash2, Banknote, Settings, Lock, Unlock,
  ClipboardCheck, Trash, RotateCcw,
} from "lucide-react";
import { Timestamp } from "firebase/firestore";
import { ActivityLog, FirestoreTs } from "@/types";

// ── Icon map
const ICON_MAP: Record<string, React.FC<LucideProps>> = {
  UserPlus, UserMinus, Pencil, ClipboardList, CheckCircle2,
  Trash2, Banknote, Settings, Lock, Unlock, FileText,
  ClipboardCheck, Trash, RotateCcw,
};

function ActionIcon({ name, color }: { name: string; color: string }) {
  const Icon = ICON_MAP[name] ?? FileText;
  return <Icon size={16} style={{ color, flexShrink: 0 }} />;
}

// ── Action metadata
export const ACTION_META: Record<string, { label: string; icon: string; color: string }> = {
  tambah_member: { label: "Tambah Pelanggan", icon: "UserPlus", color: "var(--color-lunas)" },
  edit_member: { label: "Edit Pelanggan", icon: "Pencil", color: "var(--color-primary)" },
  hapus_member: { label: "Hapus Pelanggan", icon: "UserMinus", color: "var(--color-belum)" },
  entry_meter: { label: "Entry Meter", icon: "ClipboardList", color: "var(--color-primary)" },
  lunas: { label: "Tandai Lunas", icon: "CheckCircle2", color: "var(--color-lunas)" },
  batal_lunas: { label: "Batal Lunas", icon: "RotateCcw", color: "var(--color-tunggakan)" },
  hapus_tagihan: { label: "Hapus Tagihan", icon: "Trash2", color: "var(--color-belum)" },
  tambah_operasional: { label: "Catat Pengeluaran", icon: "Banknote", color: "var(--color-tunggakan)" },
  hapus_operasional: { label: "Hapus Pengeluaran", icon: "Trash2", color: "var(--color-belum)" },
  update_harga: { label: "Update Tarif", icon: "Settings", color: "var(--color-primary)" },
  update_settings: { label: "Update Pengaturan", icon: "Settings", color: "var(--color-primary)" },
  global_lock: { label: "Global Lock", icon: "Lock", color: "var(--color-belum)" },
  global_unlock: { label: "Global Unlock", icon: "Unlock", color: "var(--color-lunas)" },
  entry_bayar: { label: "Entry Bayar", icon: "ClipboardCheck", color: "var(--color-lunas)" },
  hapus_entry: { label: "Hapus Entry", icon: "Trash2", color: "var(--color-belum)" },
};

export function getActionMeta(action: string) {
  return ACTION_META[action] || { label: action, icon: "FileText", color: "var(--color-txt3)" };
}

export function formatTimestamp(ts: FirestoreTs): string {
  if (!ts) return "-";
  try {
    let date: Date;
    if (ts instanceof Date) {
      date = ts;
    } else if (ts instanceof Timestamp) {
      date = ts.toDate();
    } else if (typeof ts === "object" && ts !== null && "seconds" in ts) {
      date = new Timestamp((ts as { seconds: number }).seconds, 0).toDate();
    } else {
      return "-";
    }
    return date.toLocaleString("id-ID", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return "-";
  }
}

export function getDateString(ts: FirestoreTs): string {
  if (!ts) return "";
  try {
    let date: Date;
    if (ts instanceof Date) {
      date = ts;
    } else if (ts instanceof Timestamp) {
      date = ts.toDate();
    } else if (typeof ts === "object" && ts !== null && "seconds" in ts) {
      date = new Timestamp((ts as { seconds: number }).seconds, 0).toDate();
    } else {
      return "";
    }
    return date.toISOString().split("T")[0];
  } catch {
    return "";
  }
}

// ── LogItem component
interface LogItemProps {
  log: ActivityLog;
  index: number;
  currentUserEmail?: string;
}

export default function LogItem({ log, index, currentUserEmail }: LogItemProps) {
  const meta = getActionMeta(log.action);
  const isMe = log.user === currentUserEmail;

  return (
    <div
      key={log.id || index}
      style={{
        padding: "14px 16px",
        background: "var(--color-card)",
        border: "1px solid var(--color-border)",
        borderLeft: `3px solid ${meta.color}`,
        borderRadius: 10,
      }}
    >
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <ActionIcon name={meta.icon} color={meta.color} />
        <div className="flex-min">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: meta.color }}>{meta.label}</span>
            <span style={{ fontSize: 11, color: "var(--color-txt3)", whiteSpace: "nowrap", flexShrink: 0 }}>
              {formatTimestamp(log.ts)}
            </span>
          </div>
          <div style={{ fontSize: 13, color: "var(--color-txt2)", marginTop: 3, lineHeight: 1.5 }}>
            {log.detail}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 5, alignItems: "center" }}>
            <span style={{
              fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
              background: isMe ? "rgba(3,105,161,0.1)" : "var(--color-border)",
              color: isMe ? "var(--color-primary)" : "var(--color-txt3)",
            }}>
              {log.user?.split("@")[0]}
            </span>
            <span style={{
              fontSize: 11, padding: "2px 8px", borderRadius: 20,
              background: log.role === "admin" ? "rgba(3,105,161,0.08)" : "rgba(146,64,14,0.08)",
              color: log.role === "admin" ? "var(--color-primary)" : "var(--color-tunggakan)",
              fontWeight: 600,
            }}>
              {log.role}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
