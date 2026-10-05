"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  LayoutDashboard,
  Trophy,
  BarChart3,
  CalendarClock,
  Timer,
  Layers,
  FileText,
  CheckSquare,
  BookOpen,
  Target,
  TrendingUp,
  Heart,
  CheckCircle2,
  Compass,
  GitBranch,
  FolderOpen,
  Settings,
  User,
  type LucideIcon,
} from "lucide-react";

interface SearchResult {
  type: string;
  id: string;
  title: string;
  subtitle?: string | null;
  href: string;
}

interface QuickAction {
  label: string;
  href: string;
  icon: LucideIcon;
  keywords: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, keywords: "home overview" },
  { label: "Timeline", href: "/timeline", icon: GitBranch, keywords: "activity feed" },
  { label: "Achievements", href: "/achievements", icon: Trophy, keywords: "awards badges" },
  { label: "GPA & Grades", href: "/grades", icon: BarChart3, keywords: "score marks" },
  { label: "Exams", href: "/exams", icon: CalendarClock, keywords: "tests countdown revision" },
  { label: "Study Timer", href: "/study/timer", icon: Timer, keywords: "focus pomodoro clock" },
  { label: "Flashcards", href: "/study/flashcards", icon: Layers, keywords: "cards review quiz" },
  { label: "Notes", href: "/study/notes", icon: FileText, keywords: "write docs" },
  { label: "Assignments", href: "/assignments", icon: CheckSquare, keywords: "homework tasks" },
  { label: "Documents", href: "/documents", icon: FolderOpen, keywords: "files upload" },
  { label: "Reading List", href: "/reading", icon: BookOpen, keywords: "books library" },
  { label: "Goals", href: "/goals", icon: Target, keywords: "milestones objectives" },
  { label: "Analytics", href: "/study/analytics", icon: TrendingUp, keywords: "stats data charts" },
  { label: "Wellness", href: "/wellness", icon: Heart, keywords: "mood health" },
  { label: "Habits", href: "/habits", icon: CheckCircle2, keywords: "daily streak tracker" },
  { label: "Opportunities", href: "/opportunities", icon: Compass, keywords: "scholarships programs" },
  { label: "Profile", href: "/profile", icon: User, keywords: "account bio" },
  { label: "Settings", href: "/settings", icon: Settings, keywords: "preferences config" },
];

const TYPE_ICONS: Record<string, LucideIcon> = {
  achievement: Trophy,
  assignment: CheckSquare,
  goal: Target,
  note: FileText,
  exam: CalendarClock,
  habit: CheckCircle2,
  book: BookOpen,
};

const TYPE_LABELS: Record<string, string> = {
  achievement: "Achievement",
  assignment: "Assignment",
  goal: "Goal",
  note: "Note",
  exam: "Exam",
  habit: "Habit",
  book: "Book",
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Focus input on open
  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Debounced search
  const search = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch {
        // Network error — silently ignore for search
      }
      setLoading(false);
    }, 250);
  }, []);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    setSelectedIndex(0);
    search(val);
  };

  // Filter quick actions by query — memoized
  const filteredActions = useMemo(
    () =>
      query.length > 0
        ? QUICK_ACTIONS.filter((a) =>
            (a.label + " " + a.keywords).toLowerCase().includes(query.toLowerCase())
          )
        : QUICK_ACTIONS.slice(0, 6),
    [query]
  );

  // Combined items for keyboard nav
  const allItems = useMemo(
    () => [
      ...filteredActions.map((a) => ({ type: "action", href: a.href, label: a.label })),
      ...results.map((r) => ({ type: "result", href: r.href, label: r.title })),
    ],
    [filteredActions, results]
  );

  const navigate = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, allItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && allItems[selectedIndex]) {
      e.preventDefault();
      navigate(allItems[selectedIndex].href);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh]">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -12 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="relative w-full max-w-lg rounded-2xl shadow-2xl border overflow-hidden"
            style={{
              background: "var(--bg-card, #ffffff)",
              borderColor: "var(--border-normal, #e2e8f0)",
            }}
          >
            {/* Search input */}
            <div
              className="flex items-center gap-3 px-5 py-4 border-b"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <Search className="h-5 w-5 shrink-0" style={{ color: "var(--text-muted)" }} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search pages, notes, goals..."
                className="flex-1 text-sm outline-none bg-transparent"
                style={{ color: "var(--text-primary)" }}
              />
              <kbd
                className="px-1.5 py-0.5 text-[10px] font-medium rounded border"
                style={{
                  background: "var(--bg-elevated)",
                  borderColor: "var(--border-normal)",
                  color: "var(--text-muted)",
                }}
              >
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-[340px] overflow-y-auto py-2">
              {/* Quick navigation */}
              {filteredActions.length > 0 && (
                <div>
                  <p
                    className="px-5 py-1.5 text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {query ? "Pages" : "Quick Navigation"}
                  </p>
                  {filteredActions.map((action, i) => {
                    const Icon = action.icon;
                    const idx = i;
                    return (
                      <button
                        key={action.href}
                        onClick={() => navigate(action.href)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className="w-full flex items-center gap-3 px-5 py-2.5 text-sm transition-colors cursor-pointer"
                        style={{
                          background:
                            selectedIndex === idx
                              ? "var(--accent-glow, rgba(6, 182, 212, 0.15))"
                              : "transparent",
                          color:
                            selectedIndex === idx
                              ? "var(--text-primary)"
                              : "var(--text-secondary)",
                        }}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="font-medium">{action.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Search results */}
              {results.length > 0 && (
                <div>
                  <p
                    className="px-5 py-1.5 text-[10px] font-semibold uppercase tracking-wider mt-1"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Results
                  </p>
                  {results.map((result, i) => {
                    const Icon = TYPE_ICONS[result.type] || FileText;
                    const idx = filteredActions.length + i;
                    return (
                      <button
                        key={`${result.type}-${result.id}`}
                        onClick={() => navigate(result.href)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className="w-full flex items-center gap-3 px-5 py-2.5 text-sm transition-colors cursor-pointer"
                        style={{
                          background:
                            selectedIndex === idx
                              ? "var(--accent-glow, rgba(6, 182, 212, 0.15))"
                              : "transparent",
                          color:
                            selectedIndex === idx
                              ? "var(--text-primary)"
                              : "var(--text-secondary)",
                        }}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <div className="flex-1 text-left min-w-0">
                          <span className="font-medium truncate block">{result.title}</span>
                          {result.subtitle && (
                            <span
                              className="text-xs truncate block"
                              style={{ color: "var(--text-muted)" }}
                            >
                              {result.subtitle}
                            </span>
                          )}
                        </div>
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-md shrink-0"
                          style={{
                            background: "var(--bg-elevated)",
                            color: "var(--text-muted)",
                          }}
                        >
                          {TYPE_LABELS[result.type] || result.type}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Loading */}
              {loading && (
                <p className="px-5 py-3 text-sm text-center" style={{ color: "var(--text-muted)" }}>
                  Searching...
                </p>
              )}

              {/* No results */}
              {query.length >= 2 && !loading && results.length === 0 && filteredActions.length === 0 && (
                <p className="px-5 py-6 text-sm text-center" style={{ color: "var(--text-muted)" }}>
                  No results found for &ldquo;{query}&rdquo;
                </p>
              )}
            </div>

            {/* Footer */}
            <div
              className="flex items-center gap-4 px-5 py-2.5 border-t text-[10px]"
              style={{
                borderColor: "var(--border-subtle)",
                color: "var(--text-muted)",
              }}
            >
              <span className="flex items-center gap-1">
                <kbd
                  className="px-1 py-0.5 rounded border"
                  style={{ background: "var(--bg-elevated)", borderColor: "var(--border-normal)" }}
                >
                  &uarr;
                </kbd>
                <kbd
                  className="px-1 py-0.5 rounded border"
                  style={{ background: "var(--bg-elevated)", borderColor: "var(--border-normal)" }}
                >
                  &darr;
                </kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd
                  className="px-1 py-0.5 rounded border"
                  style={{ background: "var(--bg-elevated)", borderColor: "var(--border-normal)" }}
                >
                  &crarr;
                </kbd>
                Open
              </span>
              <span className="flex items-center gap-1">
                <kbd
                  className="px-1 py-0.5 rounded border"
                  style={{ background: "var(--bg-elevated)", borderColor: "var(--border-normal)" }}
                >
                  Esc
                </kbd>
                Close
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
