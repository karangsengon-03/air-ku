"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data dianggap stale setelah 30 detik
            staleTime: 30_000,
            // Retry 1x saat gagal (default 3 terlalu agresif untuk Firebase)
            retry: 1,
            // Jangan refetch saat window refocus (Firebase sudah realtime via listener)
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
