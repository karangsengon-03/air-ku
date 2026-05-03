"use client";
import dynamic from "next/dynamic";
const OperasionalView = dynamic(() => import("@/components/features/operasional/OperasionalView"), { ssr: false });
export default function Page() { return <OperasionalView />; }
