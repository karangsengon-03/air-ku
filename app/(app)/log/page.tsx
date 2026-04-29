"use client";
import dynamic from "next/dynamic";
const LogView = dynamic(() => import("@/components/features/log/LogView"), { ssr: false });
export default function Page() { return <LogView />; }
