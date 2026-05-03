"use client";
import dynamic from "next/dynamic";

const DashboardView = dynamic(() => import("@/components/features/dashboard/DashboardView"), {
  ssr: false,
});

export default function Page() {
  return <DashboardView />;
}
