"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, ClipboardList, Droplets, FolderOpen,
  AlertTriangle, BarChart2, Users, Settings
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

const adminNav = [
  { href: "/dashboard", icon: Home, label: "Beranda" },
  { href: "/entry", icon: ClipboardList, label: "Entry" },
  { href: "/tagihan", icon: Droplets, label: "Tagihan" },
  { href: "/members", icon: Users, label: "Pelanggan" },
  { href: "/settings", icon: Settings, label: "Pengaturan" },
];

const penagihNav = [
  { href: "/dashboard", icon: Home, label: "Beranda" },
  { href: "/entry", icon: ClipboardList, label: "Entry" },
  { href: "/tagihan", icon: Droplets, label: "Tagihan" },
  { href: "/tunggakan", icon: AlertTriangle, label: "Tunggakan" },
  { href: "/grafik", icon: BarChart2, label: "Grafik" },
];

export default function BottomNav() {
  const { userRole } = useAppStore();
  const pathname = usePathname();
  const navItems = userRole?.role === "admin" ? adminNav : penagihNav;

  return (
    <nav style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      background: "var(--color-card)",
      borderTop: "1px solid var(--color-border)",
      display: "flex", zIndex: 50,
      paddingBottom: "env(safe-area-inset-bottom, 0px)",
    }}>
      {navItems.map(({ href, icon: Icon, label }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link key={href} href={href} style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            padding: "8px 4px", gap: 3,
            color: active ? "var(--color-primary)" : "var(--color-txt3)",
            textDecoration: "none", minHeight: 56,
          }}>
            <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
            <span style={{ fontSize: 10, fontWeight: active ? 700 : 500 }}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
