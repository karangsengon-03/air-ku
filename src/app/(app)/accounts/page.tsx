"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Accounts section sudah terintegrasi di dalam SettingsView
export default function Page() {
  const router = useRouter();
  useEffect(() => { router.replace("/settings"); }, [router]);
  return null;
}
