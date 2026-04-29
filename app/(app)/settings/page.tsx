"use client";
import dynamic from "next/dynamic";

const SettingsView = dynamic(() => import("@/components/features/settings/SettingsView"), { ssr: false });

export default function Page() {
  return <SettingsView />;
}
