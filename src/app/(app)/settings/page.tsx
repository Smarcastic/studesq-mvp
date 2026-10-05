"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  User,
  Bell,
  Monitor,
  Database,
  Timer,
  Shield,
  Download,
  Trash2,
  ExternalLink,
  Settings as SettingsIcon,
  Palette,
  Sparkles,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { FadeUp } from "@/components/ui/motion";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { THEMES, THEME_IDS, type ThemeId } from "@/components/study/timer/themes";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface StudesqSettings {
  // Study preferences
  defaultTimerMode: string;
  defaultTimerDuration: number;
  breakDuration: number;
  autoStartBreaks: boolean;
  dailyStudyGoal: number;
  // Timer theme
  timerTheme: string;
  // Notification preferences
  assignmentReminders: boolean;
  streakReminders: boolean;
  weeklySummary: boolean;
  soundEffects: boolean;
  // Display preferences
  sidebarCollapsed: boolean;
  showWelcomeCard: boolean;
  defaultAssignmentsView: string;
  cardsPerRow: number;
}

const DEFAULT_SETTINGS: StudesqSettings = {
  defaultTimerMode: "pomodoro",
  defaultTimerDuration: 25,
  breakDuration: 5,
  autoStartBreaks: false,
  dailyStudyGoal: 120,
  timerTheme: "mercury",
  assignmentReminders: true,
  streakReminders: true,
  weeklySummary: true,
  soundEffects: true,
  sidebarCollapsed: false,
  showWelcomeCard: true,
  defaultAssignmentsView: "list",
  cardsPerRow: 3,
};

const STORAGE_KEY = "studesq-settings";

// ---------------------------------------------------------------------------
// Theme-Aware Toggle Component
// ---------------------------------------------------------------------------
function Toggle({
  enabled,
  onToggle,
  label,
  description,
}: {
  enabled: boolean;
  onToggle: (value: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          {label}
        </p>
        {description && (
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {description}
          </p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onToggle(!enabled)}
        className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/40 focus-visible:ring-offset-2"
        style={{
          background: enabled
            ? "var(--accent-glow-strong, #06b6d4)"
            : "var(--border-normal, #e2e8f0)",
        }}
      >
        <span
          className={`
            pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm
            ring-0 transition-transform duration-200 ease-in-out
            ${enabled ? "translate-x-5" : "translate-x-0"}
          `}
        />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Timer Theme Preview
// ---------------------------------------------------------------------------
function TimerThemeSelector({
  activeTheme,
  onSelect,
}: {
  activeTheme: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-5 gap-3">
      {THEME_IDS.map((id) => {
        const t = THEMES[id];
        const isActive = id === activeTheme;
        return (
          <button
            key={id}
            onClick={() => onSelect(id)}
            className="flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer"
            style={{
              borderColor: isActive
                ? t.ringColor
                : "var(--border-subtle, rgba(0,0,0,0.06))",
              background: isActive
                ? `color-mix(in srgb, ${t.ringColor} 8%, var(--bg-surface))`
                : "var(--bg-surface, #ffffff)",
              boxShadow: isActive
                ? `0 0 16px color-mix(in srgb, ${t.ringColor} 25%, transparent)`
                : "none",
            }}
          >
            {/* Preview circle */}
            <div
              className="w-10 h-10 rounded-full border-[3px]"
              style={{
                borderColor: t.ringColor,
                background: `linear-gradient(135deg, ${t.gradient[0]}, ${t.gradient[2]})`,
                boxShadow: isActive
                  ? `0 0 12px ${t.glowColor}`
                  : "none",
              }}
            />
            <span
              className="text-[11px] font-medium"
              style={{
                color: isActive ? t.ringColor : "var(--text-secondary)",
              }}
            >
              {t.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Settings Page
// ---------------------------------------------------------------------------
export default function SettingsPage() {
  const { data: session } = useSession();
  const { toast } = useToast();

  const [settings, setSettings] = useState<StudesqSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);

  // Fetch member-since date from profile API
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await fetch("/api/profile");
      if (!res.ok) return null;
      return res.json();
    },
  });

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : null;

  // Load settings from localStorage on mount + sync timer theme
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const timerTheme = localStorage.getItem("timer-theme") || "mercury";
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<StudesqSettings>;
        setSettings((prev) => ({ ...prev, ...parsed, timerTheme }));
      } else {
        setSettings((prev) => ({ ...prev, timerTheme }));
      }
    } catch {
      // Ignore parse errors, use defaults
    }
    setLoaded(true);
  }, []);

  // Persist a single setting change
  const updateSetting = useCallback(
    <K extends keyof StudesqSettings>(key: K, value: StudesqSettings[K]) => {
      setSettings((prev) => {
        const next = { ...prev, [key]: value };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          // Sync timer theme to its own localStorage key
          if (key === "timerTheme") {
            localStorage.setItem("timer-theme", String(value));
          }
        } catch {
          // Storage full or blocked
        }
        return next;
      });
      toast("Setting saved");
    },
    [toast]
  );

  // Avoid rendering with stale defaults before localStorage loads
  if (!loaded) {
    return (
      <div>
        <PageHeader
          title="Settings"
          description="Customize your preferences and account settings."
        />
        <div className="space-y-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-48 rounded-[14px] animate-pulse"
              style={{ background: "var(--bg-surface)" }}
            />
          ))}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div>
      <PageHeader
        title="Settings"
        description="Customize your preferences and account settings."
        action={
          <Badge variant="teal">
            <SettingsIcon className="h-3 w-3 mr-1" />
            Local Preferences
          </Badge>
        }
      />

      <div className="space-y-6 max-w-3xl">
        {/* ================================================================ */}
        {/* SECTION 1 : Account Info                                        */}
        {/* ================================================================ */}
        <FadeUp>
          <Card>
            <div className="flex items-center gap-2 mb-5">
              <div
                className="flex items-center justify-center h-8 w-8 rounded-lg"
                style={{ background: "color-mix(in srgb, var(--accent-glow) 15%, transparent)" }}
              >
                <User className="h-4 w-4" style={{ color: "var(--accent-glow)" }} />
              </div>
              <CardTitle>Account Information</CardTitle>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p
                    className="text-xs font-medium uppercase tracking-wider mb-1"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Name
                  </p>
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {session?.user?.name || "Not set"}
                  </p>
                </div>
                <div>
                  <p
                    className="text-xs font-medium uppercase tracking-wider mb-1"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Email
                  </p>
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {session?.user?.email || "Not set"}
                  </p>
                </div>
              </div>

              <div>
                <p
                  className="text-xs font-medium uppercase tracking-wider mb-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  Member Since
                </p>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  {memberSince || "Loading..."}
                </p>
              </div>

              <div
                className="pt-2 border-t"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                <Link href="/profile">
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-3.5 w-3.5" />
                    Edit Profile
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </FadeUp>

        {/* ================================================================ */}
        {/* SECTION 2 : Study Preferences                                   */}
        {/* ================================================================ */}
        <FadeUp delay={0.05}>
          <Card>
            <div className="flex items-center gap-2 mb-5">
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-indigo-500/10">
                <Timer className="h-4 w-4 text-indigo-500" />
              </div>
              <CardTitle>Study Preferences</CardTitle>
            </div>

            <div className="space-y-5">
              <Select
                id="timer-mode"
                label="Default Timer Mode"
                value={settings.defaultTimerMode}
                onChange={(e) =>
                  updateSetting("defaultTimerMode", e.target.value)
                }
                options={[
                  { value: "pomodoro", label: "Pomodoro" },
                  { value: "deep_focus", label: "Deep Focus" },
                  { value: "stopwatch", label: "Stopwatch" },
                ]}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  id="timer-duration"
                  label="Timer Duration (min)"
                  type="number"
                  min={1}
                  max={180}
                  value={settings.defaultTimerDuration}
                  onChange={(e) =>
                    updateSetting(
                      "defaultTimerDuration",
                      Math.max(1, parseInt(e.target.value) || 1)
                    )
                  }
                />
                <Input
                  id="break-duration"
                  label="Break Duration (min)"
                  type="number"
                  min={1}
                  max={60}
                  value={settings.breakDuration}
                  onChange={(e) =>
                    updateSetting(
                      "breakDuration",
                      Math.max(1, parseInt(e.target.value) || 1)
                    )
                  }
                />
              </div>

              <Toggle
                label="Auto-start breaks"
                description="Automatically begin break timer after a focus session ends"
                enabled={settings.autoStartBreaks}
                onToggle={(v) => updateSetting("autoStartBreaks", v)}
              />

              <Input
                id="daily-goal"
                label="Daily Study Goal (min)"
                type="number"
                min={10}
                max={720}
                value={settings.dailyStudyGoal}
                onChange={(e) =>
                  updateSetting(
                    "dailyStudyGoal",
                    Math.max(10, parseInt(e.target.value) || 10)
                  )
                }
              />
            </div>
          </Card>
        </FadeUp>

        {/* ================================================================ */}
        {/* SECTION 3 : Notification Preferences                            */}
        {/* ================================================================ */}
        <FadeUp delay={0.1}>
          <Card>
            <div className="flex items-center gap-2 mb-5">
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-amber-500/10">
                <Bell className="h-4 w-4 text-amber-500" />
              </div>
              <CardTitle>Notification Preferences</CardTitle>
            </div>

            <div
              className="divide-y"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <Toggle
                label="Assignment due reminders"
                description="Get notified before assignments are due"
                enabled={settings.assignmentReminders}
                onToggle={(v) => updateSetting("assignmentReminders", v)}
              />
              <Toggle
                label="Study streak reminders"
                description="Daily reminder to maintain your study streak"
                enabled={settings.streakReminders}
                onToggle={(v) => updateSetting("streakReminders", v)}
              />
              <Toggle
                label="Weekly summary"
                description="Receive a weekly overview of your study progress"
                enabled={settings.weeklySummary}
                onToggle={(v) => updateSetting("weeklySummary", v)}
              />
              <Toggle
                label="Sound effects"
                description="Play sounds for timer completion and achievements"
                enabled={settings.soundEffects}
                onToggle={(v) => updateSetting("soundEffects", v)}
              />
            </div>
          </Card>
        </FadeUp>

        {/* ================================================================ */}
        {/* SECTION 4 : App Theme                                           */}
        {/* ================================================================ */}
        <FadeUp delay={0.15}>
          <Card>
            <div className="flex items-center gap-2 mb-5">
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-rose-500/10">
                <Palette className="h-4 w-4 text-rose-500" />
              </div>
              <CardTitle>App Theme</CardTitle>
            </div>

            <div className="space-y-3">
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Choose your preferred appearance. Light is clean and minimal,
                Dark is easy on the eyes, and Cosmic adds animated star
                backgrounds.
              </p>
              <ThemeToggle />
            </div>
          </Card>
        </FadeUp>

        {/* ================================================================ */}
        {/* SECTION 4b : Timer Theme                                        */}
        {/* ================================================================ */}
        <FadeUp delay={0.17}>
          <Card>
            <div className="flex items-center gap-2 mb-5">
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-purple-500/10">
                <Sparkles className="h-4 w-4 text-purple-500" />
              </div>
              <CardTitle>Timer Theme</CardTitle>
            </div>

            <div className="space-y-4">
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Select the visual theme for your study timer. Each theme has
                unique backgrounds, ring effects, and animations.
              </p>
              <TimerThemeSelector
                activeTheme={settings.timerTheme}
                onSelect={(id) => updateSetting("timerTheme", id)}
              />
            </div>
          </Card>
        </FadeUp>

        {/* ================================================================ */}
        {/* SECTION 5 : Display Preferences                                 */}
        {/* ================================================================ */}
        <FadeUp delay={0.2}>
          <Card>
            <div className="flex items-center gap-2 mb-5">
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-violet-500/10">
                <Monitor className="h-4 w-4 text-violet-500" />
              </div>
              <CardTitle>Display Preferences</CardTitle>
            </div>

            <div className="space-y-4">
              <Toggle
                label="Sidebar collapsed by default"
                description="Start with the sidebar minimized on each visit"
                enabled={settings.sidebarCollapsed}
                onToggle={(v) => updateSetting("sidebarCollapsed", v)}
              />
              <Toggle
                label="Show welcome card on dashboard"
                description="Display the welcome greeting card on the home page"
                enabled={settings.showWelcomeCard}
                onToggle={(v) => updateSetting("showWelcomeCard", v)}
              />

              <div
                className="pt-2 border-t"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                <Select
                  id="assignments-view"
                  label="Default Assignments View"
                  value={settings.defaultAssignmentsView}
                  onChange={(e) =>
                    updateSetting("defaultAssignmentsView", e.target.value)
                  }
                  options={[
                    { value: "list", label: "List" },
                    { value: "kanban", label: "Kanban" },
                    { value: "calendar", label: "Calendar" },
                  ]}
                />
              </div>

              <Select
                id="cards-per-row"
                label="Cards per Row (Achievement Grid)"
                value={String(settings.cardsPerRow)}
                onChange={(e) =>
                  updateSetting("cardsPerRow", parseInt(e.target.value))
                }
                options={[
                  { value: "2", label: "2 Cards" },
                  { value: "3", label: "3 Cards" },
                  { value: "4", label: "4 Cards" },
                ]}
              />
            </div>
          </Card>
        </FadeUp>

        {/* ================================================================ */}
        {/* SECTION 6 : Data & Privacy                                      */}
        {/* ================================================================ */}
        <FadeUp delay={0.25}>
          <Card>
            <div className="flex items-center gap-2 mb-5">
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-emerald-500/10">
                <Shield className="h-4 w-4 text-emerald-500" />
              </div>
              <CardTitle>Data & Privacy</CardTitle>
            </div>

            <div className="space-y-4">
              {/* Export data */}
              <div
                className="flex items-center justify-between gap-4 py-3 border-b"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                <div className="flex items-start gap-3">
                  <Download
                    className="h-4 w-4 mt-0.5 shrink-0"
                    style={{ color: "var(--text-muted)" }}
                  />
                  <div>
                    <p
                      className="text-sm font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Export All Data
                    </p>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Download your study sessions, goals, and preferences
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    toast("Preparing your export...", "info");
                    try {
                      const res = await fetch("/api/export");
                      if (!res.ok) throw new Error("Export failed");
                      const blob = await res.blob();
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `studesq-export-${new Date().toISOString().split("T")[0]}.json`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                      toast("Data exported successfully!");
                    } catch {
                      toast("Failed to export data. Please try again.", "error");
                    }
                  }}
                >
                  <Download className="h-3.5 w-3.5" />
                  Export
                </Button>
              </div>

              {/* Clear study sessions */}
              <div
                className="flex items-center justify-between gap-4 py-3 border-b"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                <div className="flex items-start gap-3">
                  <Trash2
                    className="h-4 w-4 mt-0.5 shrink-0"
                    style={{ color: "var(--text-muted)" }}
                  />
                  <div>
                    <p
                      className="text-sm font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Clear Study Sessions
                    </p>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Remove all locally stored study session data
                    </p>
                  </div>
                </div>
                {!clearConfirm ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setClearConfirm(true)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Clear
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setClearConfirm(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        try {
                          localStorage.removeItem("studesq-study-sessions");
                        } catch {
                          // Ignore
                        }
                        setClearConfirm(false);
                        toast("Study sessions cleared");
                      }}
                    >
                      Confirm
                    </Button>
                  </div>
                )}
              </div>

              {/* Account management link */}
              <div className="flex items-center justify-between gap-4 py-3">
                <div className="flex items-start gap-3">
                  <Database
                    className="h-4 w-4 mt-0.5 shrink-0"
                    style={{ color: "var(--text-muted)" }}
                  />
                  <div>
                    <p
                      className="text-sm font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Account Management
                    </p>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Update your profile, password, and account details
                    </p>
                  </div>
                </div>
                <Link href="/profile">
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-3.5 w-3.5" />
                    Manage
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </FadeUp>

        {/* Bottom spacer */}
        <div className="h-8" />
      </div>
    </div>
  );
}
