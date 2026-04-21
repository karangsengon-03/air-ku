"use client";
import dynamic from "next/dynamic";

const EntryView = dynamic(() => import("@/components/views/EntryView"), {
  ssr: false,
});

export default function Page() {
  return <EntryView />;
}
