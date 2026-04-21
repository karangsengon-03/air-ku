"use client";
import dynamic from "next/dynamic";
const OperasionalView = dynamic(() => import("@/components/views/OperasionalView"), { ssr: false });
export default function Page() { return <OperasionalView />; }
