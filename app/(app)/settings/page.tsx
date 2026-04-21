import dynamic from "next/dynamic";

const SettingsView = dynamic(() => import("@/components/views/SettingsView"), { ssr: false });

export default function Page() {
  return <SettingsView />;
}
