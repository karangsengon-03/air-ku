"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/hooks/useSettings";
import { useAppStore } from "@/store/useAppStore";
import { PAGE_TITLES } from "@/lib/constants";
import Header from "./Header";
import BottomNav from "./BottomNav";
import LockBanner from "./LockBanner";
import LoadingScreen from "./LoadingScreen";
import Toast from "@/components/ui/Toast";
import Confirm from "@/components/ui/Confirm";

export default function AppShell({ children }: { children: React.ReactNode }) {
  useAuth();
  useSettings();

  const { authLoading, firebaseUser, userRole, darkMode, setIsOnline } = useAppStore();
  const router = useRouter();
  const pathname = usePathname();

  // Init dark mode from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("airku-dark");
    if (saved === "1") {
      document.documentElement.classList.add("dark");
      useAppStore.setState({ darkMode: true });
    }
  }, []);

  // Online/offline detection
  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    setIsOnline(navigator.onLine);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [setIsOnline]);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !firebaseUser) {
      router.replace("/login");
    }
  }, [authLoading, firebaseUser, router]);

  if (authLoading) return <LoadingScreen />;
  if (!firebaseUser) return null;

  // Determine page title from pathname
  const segment = pathname.split("/")[1] || "dashboard";
  const title = PAGE_TITLES[segment] || "AirKu";

  return (
    <div style={{ minHeight: "100svh", background: "var(--color-bg)" }}>
      <LockBanner />
      <Header title={title} />
      <main className="pb-safe" style={{ padding: "16px 16px 0" }}>
        {children}
      </main>
      <BottomNav />
      <Toast />
      <Confirm />
    </div>
  );
}
