"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/hooks/useSettings";
import { useData } from "@/hooks/useData";
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
  useData();

  const { authLoading, firebaseUser, setIsOnline } = useAppStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const saved = localStorage.getItem("airku-dark");
    if (saved === "1") {
      document.documentElement.classList.add("dark");
      useAppStore.setState({ darkMode: true });
    }
  }, []);

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

  useEffect(() => {
    if (!authLoading && !firebaseUser) {
      router.replace("/login");
    }
  }, [authLoading, firebaseUser, router]);

  if (authLoading) return <LoadingScreen />;
  if (!firebaseUser) return null;

  const segment = pathname.split("/")[1] || "dashboard";
  const title = PAGE_TITLES[segment] || "AirKu";

  return (
    // id="app-shell" → display:flex flex-direction:column height:100svh overflow:hidden
    <div id="app-shell">
      <LockBanner />
      <Header title={title} />
      {/* id="app-main" → flex:1 overflow-y:auto — SATU-SATUNYA area scroll */}
      <main id="app-main">
        {children}
      </main>
      <BottomNav />
      <Toast />
      <Confirm />
    </div>
  );
}
