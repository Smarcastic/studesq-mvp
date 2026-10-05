"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, Sparkles } from "lucide-react";

type Theme = "light" | "dark" | "cosmic";

const THEMES: { id: Theme; label: string; icon: typeof Sun }[] = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "cosmic", label: "Cosmic", icon: Sparkles },
];

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("studesq-theme") as Theme | null;
    if (stored && ["light", "dark", "cosmic"].includes(stored)) {
      setTheme(stored);
      document.documentElement.setAttribute("data-theme", stored);
    }
  }, []);

  const cycleTheme = () => {
    const order: Theme[] = ["light", "dark", "cosmic"];
    const next = order[(order.indexOf(theme) + 1) % order.length];
    setTheme(next);
    localStorage.setItem("studesq-theme", next);
    document.documentElement.setAttribute("data-theme", next);
  };

  if (!mounted) return null;

  const current = THEMES.find((t) => t.id === theme)!;
  const Icon = current.icon;

  if (compact) {
    return (
      <button
        onClick={cycleTheme}
        className="relative p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
        title={`Theme: ${current.label}`}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={theme}
            initial={{ scale: 0.5, opacity: 0, rotate: -90 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.5, opacity: 0, rotate: 90 }}
            transition={{ duration: 0.2 }}
          >
            <Icon className="h-5 w-5" />
          </motion.div>
        </AnimatePresence>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100">
      {THEMES.map((t) => {
        const TIcon = t.icon;
        const isActive = theme === t.id;
        return (
          <button
            key={t.id}
            onClick={() => {
              setTheme(t.id);
              localStorage.setItem("studesq-theme", t.id);
              document.documentElement.setAttribute("data-theme", t.id);
            }}
            className={`
              relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${isActive ? "text-slate-900" : "text-slate-500 hover:text-slate-700"}
            `}
          >
            {isActive && (
              <motion.div
                layoutId="theme-active"
                className="absolute inset-0 bg-white rounded-lg shadow-sm"
                transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <TIcon className="h-4 w-4" />
              {t.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
