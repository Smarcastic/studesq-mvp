"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { CommandPalette } from "@/components/layout/command-palette";
import { ShortcutsHelp } from "@/components/layout/shortcuts-help";
import { useGlobalShortcuts } from "@/hooks/use-global-shortcuts";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Global keyboard shortcuts (G+D, G+T, etc.)
  useGlobalShortcuts();

  // Apply saved theme on mount
  useEffect(() => {
    const stored = localStorage.getItem("studesq-theme");
    if (stored && ["light", "dark", "cosmic"].includes(stored)) {
      document.documentElement.setAttribute("data-theme", stored);
    }
  }, []);

  return (
    <div className="relative min-h-screen" style={{ background: "var(--bg-base)" }}>
      {/* Animated gradient mesh background — theme-aware, hidden in dark/cosmic */}
      <div className="fixed inset-0 -z-10 animated-gradient" aria-hidden="true">
        <div
          className="absolute top-0 left-[20%] w-[500px] h-[500px] rounded-full blur-[120px]"
          style={{ background: "var(--accent-glow, rgba(6,182,212,0.15))" }}
        />
        <div
          className="absolute top-[30%] right-[15%] w-[450px] h-[450px] rounded-full blur-[120px]"
          style={{ background: "var(--accent-glow, rgba(99,102,241,0.1))" }}
        />
        <div
          className="absolute bottom-[20%] left-[35%] w-[400px] h-[400px] rounded-full blur-[120px]"
          style={{ background: "var(--accent-glow, rgba(6,182,212,0.1))" }}
        />
      </div>

      {/* Cosmic theme background layers (CSS-driven, only visible with [data-theme="cosmic"]) */}
      <div className="cosmic-bg" />
      <div className="cosmic-stars" />

      <div className="flex">
        <Sidebar />
        <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

        <div className="flex-1 flex flex-col min-h-screen">
          <Topbar onMenuClick={() => setMobileNavOpen(true)} />
          <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {children}
          </main>
        </div>
      </div>

      <CommandPalette />
      <ShortcutsHelp />
    </div>
  );
}
