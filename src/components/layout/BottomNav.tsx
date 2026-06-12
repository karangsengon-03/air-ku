"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, ClipboardList, Droplets, Users, Settings,
  FolderOpen, TrendingUp, AlertTriangle, Wrench, ScrollText,
  Grid3x3,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useState, useEffect } from "react";

const adminNav = [
  { href: "/dashboard", icon: Home, label: "Beranda" },
  { href: "/entry", icon: ClipboardList, label: "Entry" },
  { href: "/tagihan", icon: Droplets, label: "Tagihan" },
  { href: "/members", icon: Users, label: "Pelanggan" },
  { href: "/settings", icon: Settings, label: "Pengaturan" },
];

const adminMoreNav = [
  { href: "/rekap", icon: FolderOpen, label: "Rekap" },
  { href: "/grafik", icon: TrendingUp, label: "Grafik" },
  { href: "/tunggakan", icon: AlertTriangle, label: "Tunggakan" },
  { href: "/operasional", icon: Wrench, label: "Operasional" },
  { href: "/log", icon: ScrollText, label: "Log Aktivitas" },
];

const penagihNav = [
  { href: "/dashboard", icon: Home, label: "Beranda" },
  { href: "/entry", icon: ClipboardList, label: "Entry" },
  { href: "/tagihan", icon: Droplets, label: "Tagihan" },
  { href: "/tunggakan", icon: AlertTriangle, label: "Tunggakan" },
  { href: "/grafik", icon: TrendingUp, label: "Grafik" },
];

const viewerNav = [
  { href: "/dashboard", icon: Home, label: "Beranda" },
  { href: "/tagihan", icon: Droplets, label: "Tagihan" },
  { href: "/members", icon: Users, label: "Pelanggan" },
  { href: "/tunggakan", icon: AlertTriangle, label: "Tunggakan" },
  { href: "/grafik", icon: TrendingUp, label: "Grafik" },
];

export default function BottomNav() {
  const { userRole } = useAppStore();
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);
  const isAdmin = userRole?.role === "admin";
  const isViewer = userRole?.role === "viewer";
  const navItems = isAdmin ? adminNav : isViewer ? viewerNav : penagihNav;
  const activeInMore = isAdmin && adminMoreNav.some((m) => pathname === m.href);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowMore(false);
  }, [pathname]);

  return (
    <>
      {showMore && isAdmin && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 99 }}
            onClick={() => setShowMore(false)}
          />
          <div style={{
            position: "fixed",
            bottom: "calc(var(--nav-height) + 10px)",
            left: 12, right: 12,
            background: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: 16,
            zIndex: 100,
            padding: "14px 12px",
            boxShadow: "0 -4px 32px rgba(0,0,0,0.18)",
          }}>
            {/* #2 Fix: 11px → 13px */}
            <div style={{
              fontSize: 13, fontWeight: 700, color: "var(--color-txt3)",
              textTransform: "uppercase", letterSpacing: "0.07em",
              marginBottom: 12, paddingLeft: 4,
            }}>
              Menu Lainnya
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {adminMoreNav.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setShowMore(false)}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "center",
                      /* #3 Fix: min-height 48px */
                      padding: "14px 8px 12px", borderRadius: 10, textDecoration: "none",
                      background: active ? "rgba(3,105,161,0.1)" : "var(--color-bg)",
                      border: active ? "1.5px solid var(--color-primary)" : "1px solid var(--color-border)",
                      color: active ? "var(--color-primary)" : "var(--color-txt2)",
                      /* #2 Fix: 12px → 13px */
                      fontSize: 13, fontWeight: 600, textAlign: "center",
                      gap: 6, minHeight: 48,
                    }}
                  >
                    <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                    <span style={{ lineHeight: 1.3 }}>{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}

      <nav style={{
        position: "fixed",
        bottom: 0, left: 0, right: 0,
        height: "var(--nav-height)",
        background: "var(--color-card)",
        borderTop: "1px solid var(--color-border)",
        display: "flex",
        zIndex: 100,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}>
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              gap: 3, color: active ? "var(--color-primary)" : "var(--color-txt3)",
              textDecoration: "none", paddingBottom: 2,
            }}>
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span style={{ fontSize: 11, fontWeight: active ? 700 : 500, lineHeight: 1 }}>{label}</span>
            </Link>
          );
        })}
        {isAdmin && (
          <button
            onClick={() => setShowMore((prev) => !prev)}
            aria-label="Menu Lainnya"
            style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              gap: 3, background: "none", border: "none", cursor: "pointer",
              color: (showMore || activeInMore) ? "var(--color-primary)" : "var(--color-txt3)",
              paddingBottom: 2,
            }}
          >
            <Grid3x3 size={22} strokeWidth={(showMore || activeInMore) ? 2.5 : 1.8} />
            <span style={{ fontSize: 11, fontWeight: (showMore || activeInMore) ? 700 : 500, lineHeight: 1 }}>Lainnya</span>
          </button>
        )}
      </nav>
    </>
  );
}
