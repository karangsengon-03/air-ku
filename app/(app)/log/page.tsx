import dynamic from "next/dynamic";
const LogView = dynamic(() => import("@/components/views/LogView"), { ssr: false });
export default function Page() { return <LogView />; }
