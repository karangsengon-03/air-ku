"use client";
import { Settings } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import TarifSection from "./TarifSection";
import DusunRTSection from "./DusunRTSection";
import {
  ModeTunggakanSection,
  InfoOrganisasiSection,
  AccountsSection,
  BackupSection,
  InfoAppSection,
  LogoutSection,
} from "./SettingsSections";

export default function SettingsView() {
  const { settings, userRole, addToast, showConfirm } = useAppStore();
  const isAdmin = userRole?.role === "admin";

  if (!isAdmin) {
    return (
      <div style={{ padding: "40px 16px", textAlign: "center" }}>
        <Settings size={40} style={{ color: "var(--color-txt3)", margin: "0 auto 12px" }} />
        <p style={{ color: "var(--color-txt3)" }}>Hanya admin yang dapat mengakses pengaturan.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up" style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <TarifSection settings={settings} userRole={userRole} addToast={addToast} showConfirm={showConfirm} />
      <DusunRTSection settings={settings} addToast={addToast} showConfirm={showConfirm} />
      <ModeTunggakanSection settings={settings} addToast={addToast} />
      <InfoOrganisasiSection settings={settings} addToast={addToast} />
      <AccountsSection />
      <BackupSection addToast={addToast} showConfirm={showConfirm} />
      <InfoAppSection />
      <LogoutSection showConfirm={showConfirm} />
    </div>
  );
}
