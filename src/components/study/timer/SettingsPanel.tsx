"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { type PomodoroSettings } from "./TimerCore";
import { type Theme } from "./themes";

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
  settings: PomodoroSettings;
  onUpdate: (s: Partial<PomodoroSettings>) => void;
  deepFocusDuration: number;
  onDeepFocusChange: (min: number) => void;
  theme: Theme;
}

export function SettingsPanel({
  open,
  onClose,
  settings,
  onUpdate,
  deepFocusDuration,
  onDeepFocusChange,
  theme,
}: SettingsPanelProps) {
  const isMinimal = theme.id === "minimal";
  const bg = isMinimal ? "rgba(255,255,255,0.95)" : "rgba(0,0,0,0.85)";
  const border = isMinimal ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)";
  const inputBg = isMinimal ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.08)";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-[60]"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed right-0 top-0 bottom-0 w-[340px] z-[70] overflow-y-auto p-6"
            style={{
              background: bg,
              backdropFilter: "blur(24px)",
              borderLeft: `1px solid ${border}`,
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold" style={{ color: theme.textColor }}>
                Settings
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg transition-colors cursor-pointer"
                style={{ color: theme.textColor, opacity: 0.6 }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Pomodoro Settings */}
            <Section title="Pomodoro" theme={theme}>
              <NumberField
                label="Focus duration"
                value={settings.focusDuration}
                onChange={(v) => onUpdate({ focusDuration: v })}
                min={5} max={90} suffix="min"
                theme={theme} inputBg={inputBg}
              />
              <NumberField
                label="Short break"
                value={settings.shortBreak}
                onChange={(v) => onUpdate({ shortBreak: v })}
                min={1} max={30} suffix="min"
                theme={theme} inputBg={inputBg}
              />
              <NumberField
                label="Long break"
                value={settings.longBreak}
                onChange={(v) => onUpdate({ longBreak: v })}
                min={5} max={60} suffix="min"
                theme={theme} inputBg={inputBg}
              />
              <NumberField
                label="Sessions before long break"
                value={settings.sessionsBeforeLong}
                onChange={(v) => onUpdate({ sessionsBeforeLong: v })}
                min={1} max={8} suffix=""
                theme={theme} inputBg={inputBg}
              />
              <ToggleField
                label="Auto-start breaks"
                value={settings.autoStartBreaks}
                onChange={(v) => onUpdate({ autoStartBreaks: v })}
                theme={theme}
              />
              <ToggleField
                label="Auto-start focus"
                value={settings.autoStartFocus}
                onChange={(v) => onUpdate({ autoStartFocus: v })}
                theme={theme}
              />
            </Section>

            {/* Deep Focus */}
            <Section title="Deep Focus" theme={theme}>
              <div className="space-y-2">
                <label className="text-xs font-medium" style={{ color: theme.textColor, opacity: 0.6 }}>
                  Duration: {deepFocusDuration} min
                </label>
                <input
                  type="range"
                  min={5} max={120} step={5}
                  value={deepFocusDuration}
                  onChange={(e) => onDeepFocusChange(parseInt(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${theme.ringColor} 0%, ${theme.ringColor} ${((deepFocusDuration - 5) / 115) * 100}%, ${inputBg} ${((deepFocusDuration - 5) / 115) * 100}%, ${inputBg} 100%)`,
                  }}
                />
              </div>
            </Section>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Section({ title, theme, children }: { title: string; theme: Theme; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3
        className="text-xs uppercase tracking-[0.1em] font-semibold mb-3"
        style={{ color: theme.textColor, opacity: 0.4 }}
      >
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function NumberField({
  label, value, onChange, min, max, suffix, theme, inputBg,
}: {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; suffix: string; theme: Theme; inputBg: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-sm" style={{ color: theme.textColor, opacity: 0.8 }}>
        {label}
      </label>
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          value={value}
          onChange={(e) => {
            const v = parseInt(e.target.value);
            if (!isNaN(v) && v >= min && v <= max) onChange(v);
          }}
          min={min} max={max}
          className="w-14 text-center rounded-lg px-2 py-1 text-sm font-medium border-none outline-none"
          style={{ background: inputBg, color: theme.textColor }}
        />
        {suffix && (
          <span className="text-xs" style={{ color: theme.textColor, opacity: 0.4 }}>
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function ToggleField({
  label, value, onChange, theme,
}: {
  label: string; value: boolean; onChange: (v: boolean) => void; theme: Theme;
}) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-sm" style={{ color: theme.textColor, opacity: 0.8 }}>
        {label}
      </label>
      <button
        onClick={() => onChange(!value)}
        className="w-10 h-5 rounded-full transition-colors relative cursor-pointer"
        style={{
          background: value ? theme.ringColor : (theme.id === "minimal" ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.15)"),
        }}
      >
        <motion.div
          animate={{ x: value ? 20 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm"
        />
      </button>
    </div>
  );
}
