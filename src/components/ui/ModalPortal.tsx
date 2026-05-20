"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ModalPortalProps {
  children: React.ReactNode;
}

/**
 * ModalPortal — render children langsung ke document.body via React Portal.
 *
 * Diperlukan karena #app-shell memiliki overflow:hidden yang menciptakan
 * containing block baru, sehingga position:fixed di dalam app-shell
 * tidak bisa keluar dari batas container (modal gelap/freeze, FAB tidak fixed).
 *
 * Dengan Portal, modal & overlay di-render di luar #app-shell sehingga
 * position:fixed benar-benar relatif terhadap viewport.
 */
export default function ModalPortal({ children }: ModalPortalProps) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = document.createElement("div");
    el.setAttribute("data-modal-portal", "");
    document.body.appendChild(el);
    // setState dalam useEffect: OK — ini intentional mount pattern untuk portal
    setContainer(el); // eslint-disable-line react-hooks/set-state-in-effect
    return () => {
      document.body.removeChild(el);
    };
  }, []);

  if (!container) return null;
  return createPortal(children, container);
}
