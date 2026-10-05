"use client";

import { motion } from "framer-motion";
import { THEMES, THEME_IDS, type ThemeId } from "./themes";
import { useState } from "react";

interface ThemePickerProps {
  activeTheme: ThemeId;
  onSelect: (theme: ThemeId) => void;
}

export function ThemePicker({ activeTheme, onSelect }: ThemePickerProps) {
  const [hoveredId, setHoveredId] = useState<ThemeId | null>(null);

  return (
    <div className="flex items-center gap-2">
      {THEME_IDS.map((id) => {
        const theme = THEMES[id];
        const isActive = activeTheme === id;

        return (
          <div key={id} className="relative group">
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onSelect(id)}
              onMouseEnter={() => setHoveredId(id)}
              onMouseLeave={() => setHoveredId(null)}
              className="relative w-6 h-6 rounded-full cursor-pointer transition-all"
              style={{
                background: id === "minimal"
                  ? "linear-gradient(135deg, #ffffff, #ecfeff)"
                  : `linear-gradient(135deg, ${theme.gradient[0]}, ${theme.gradient[theme.gradient.length - 1]})`,
                boxShadow: isActive
                  ? `0 0 0 2px ${theme.ringColor}, 0 0 12px ${theme.glowColor}`
                  : "none",
                border: id === "minimal" ? "1px solid #e2e8f0" : "none",
              }}
            />

            {/* Tooltip */}
            {hoveredId === id && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap pointer-events-none z-50"
                style={{
                  background: activeTheme === "minimal" ? "rgba(15, 23, 42, 0.9)" : "rgba(255, 255, 255, 0.15)",
                  backdropFilter: "blur(8px)",
                  color: activeTheme === "minimal" ? "#ffffff" : "#ffffff",
                }}
              >
                {theme.label}
              </motion.div>
            )}
          </div>
        );
      })}
    </div>
  );
}
