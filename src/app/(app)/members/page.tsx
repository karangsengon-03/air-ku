"use client";
import dynamic from "next/dynamic";
const MembersView = dynamic(() => import("@/components/features/members/MembersView"), { ssr: false });
export default function Page() { return <MembersView />; }
