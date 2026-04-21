import dynamic from "next/dynamic";

const DashboardView = dynamic(() => import("@/components/views/DashboardView"), {
  ssr: false,
});

export default function Page() {
  return <DashboardView />;
}
