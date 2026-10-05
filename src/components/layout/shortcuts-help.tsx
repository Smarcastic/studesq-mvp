"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Keyboard } from "lucide-react";

interface ShortcutGroup {
  label: string;
  shortcuts: { keys: string[]; description: string }[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    label: "Global",
    shortcuts: [
      { keys: ["Ctrl", "K"], description: "Open command palette" },
      { keys: ["?"], description: "Show keyboard shortcuts" },
    ],
  },
  {
    label: "Navigation",
    shortcuts: [
      { keys: ["G", "D"], description: "Go to Dashboard" },
      { keys: ["G", "T"], description: "Go to Timer" },
      { keys: ["G", "N"], description: "Go to Notes" },
      { keys: ["G", "A"], description: "Go to Achievements" },
      { keys: ["G", "G"], description: "Go to Goals" },
      { keys: ["G", "E"], description: "Go to Exams" },
      { keys: ["G", "H"], description: "Go to Habits" },
    ],
  },
  {
    label: "Focus Timer",
    shortcuts: [
      { keys: ["Space"], description: "Start / Pause timer" },
      { keys: ["R"], description: "Reset timer" },
      { keys: ["F"], description: "Toggle fullscreen" },
      { keys: ["1-5"], description: "Switch theme" },
    ],
  },
];

export function ShortcutsHelp() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      )
        return;

      if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape" && open) setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/25 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 12 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Keyboard className="h-5 w-5 text-cyan-500" />
                <h2 className="text-base font-semibold text-slate-900">Keyboard Shortcuts</h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <X className="h-4 w-4 text-slate-400" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-4 max-h-[60vh] overflow-y-auto space-y-5">
              {SHORTCUT_GROUPS.map((group) => (
                <div key={group.label}>
                  <h3 className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    {group.label}
                  </h3>
                  <div className="space-y-1.5">
                    {group.shortcuts.map((shortcut, i) => (
                      <div key={i} className="flex items-center justify-between py-1.5">
                        <span className="text-sm text-slate-600">{shortcut.description}</span>
                        <div className="flex items-center gap-1">
                          {shortcut.keys.map((key, j) => (
                            <span key={j}>
                              <kbd className="inline-block px-2 py-1 text-[11px] font-medium bg-slate-50 border border-slate-200 rounded-md text-slate-500 min-w-[28px] text-center">
                                {key}
                              </kbd>
                              {j < shortcut.keys.length - 1 && (
                                <span className="text-slate-300 mx-0.5">+</span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-slate-100 text-center">
              <p className="text-[11px] text-slate-400">
                Press <kbd className="px-1 py-0.5 bg-slate-50 border border-slate-200 rounded text-[10px]">?</kbd> to toggle this panel
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
