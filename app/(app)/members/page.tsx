import dynamic from "next/dynamic";
const MembersView = dynamic(() => import("@/components/views/MembersView"), { ssr: false });
export default function Page() { return <MembersView />; }
