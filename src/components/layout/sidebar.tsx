"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  GitBranch,
  Trophy,
  BarChart3,
  CalendarClock,
  Calendar,
  GraduationCap,
  Timer,
  Layers,
  FileText,
  CheckSquare,
  FolderOpen,
  Target,
  TrendingUp,
  Heart,
  Compass,
  Store,
  Settings,
  ChevronLeft,
  ChevronRight,
  Users,
  MessageCircle,
  UsersRound,
  Medal,
  UserCircle,
  type LucideIcon,
} from "lucide-react";
import { useSocialUnread } from "@/hooks/use-social-unread";
import { useState, useEffect } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

const navigation: NavGroup[] = [
  {
    group: "Home",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Calendar", href: "/calendar", icon: Calendar },
    ],
  },
  {
    group: "Discover",
    items: [
      { label: "Marketplace", href: "/marketplace", icon: Store },
      { label: "Opportunities", href: "/opportunities", icon: Compass },
      { label: "Saved Events", href: "/marketplace/saved", icon: Heart },
    ],
  },
  {
    group: "Profile",
    items: [
      { label: "Achievements", href: "/achievements", icon: Trophy },
      { label: "Timeline", href: "/timeline", icon: GitBranch },
      { label: "My Profile", href: "/profile", icon: UserCircle },
    ],
  },
  {
    group: "Study",
    items: [
      { label: "Flashcards", href: "/study/flashcards", icon: Layers },
      { label: "Assignments", href: "/assignments", icon: CheckSquare },
      { label: "Study Timer", href: "/study/timer", icon: Timer },
      { label: "Notes", href: "/study/notes", icon: FileText },
    ],
  },
  {
    group: "Social",
    items: [
      { label: "Friends", href: "/social", icon: Users },
      { label: "Groups", href: "/groups", icon: UsersRound },
      { label: "Leaderboard", href: "/leaderboard", icon: Medal },
      { label: "Chat", href: "/chat", icon: MessageCircle },
    ],
  },
  {
    group: "More",
    items: [
      { label: "GPA & Grades", href: "/grades", icon: BarChart3 },
      { label: "Exams", href: "/exams", icon: CalendarClock },
      { label: "Goals", href: "/goals", icon: Target },
      { label: "Analytics", href: "/study/analytics", icon: TrendingUp },
      { label: "Applications", href: "/applications", icon: GraduationCap },
      { label: "Documents", href: "/documents", icon: FolderOpen },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const { data: unread } = useSocialUnread();
  const totalUnread = (unread?.unreadChats || 0) + (unread?.pendingRequests || 0);

  // Hydration-safe localStorage read
  useEffect(() => {
    setCollapsed(localStorage.getItem("sidebar-collapsed") === "true");
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem("sidebar-collapsed", String(collapsed));
  }, [collapsed, hydrated]);

  // Cmd+B / Ctrl+B keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        setCollapsed((c) => !c);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 256 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="hidden md:flex flex-col h-screen sticky top-0 z-40 overflow-hidden border-r"
      style={{
        background: "var(--bg-surface, #f8fafc)",
        borderColor: "var(--border-subtle, #f1f5f9)",
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-4 h-16 border-b shrink-0"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm">S</span>
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.15 }}
              className="font-bold text-lg whitespace-nowrap overflow-hidden"
              style={{ color: "var(--text-primary)" }}
            >
              Studes<span className="text-cyan-500">Q</span>
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
        {navigation.map((group) => (
          <div key={group.group} className="mb-2">
            {!collapsed && (
              <div className="px-3 pt-4 pb-2">
                <span
                  className={cn(
                    "text-[10px] uppercase tracking-[0.12em] font-semibold",
                    group.group === "More" && "opacity-60",
                  )}
                  style={{ color: "var(--text-muted)" }}
                >
                  {group.group}
                </span>
              </div>
            )}
            {collapsed && (
              <div
                className="mx-2 mt-3 mb-2 border-t"
                style={{ borderColor: "var(--border-subtle)" }}
              />
            )}

            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              const isMoreGroup = group.group === "More";

              return (
                <div key={item.href} className="relative group">
                  <Link
                    href={item.href}
                    className={cn(
                      "relative flex items-center gap-3 px-3 py-2 rounded-xl font-medium transition-colors",
                      isMoreGroup ? "text-xs" : "text-sm",
                      collapsed && "justify-center",
                    )}
                    style={{
                      color: isActive
                        ? "var(--accent-text, #0891b2)"
                        : "var(--text-secondary)",
                    }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute inset-0 rounded-xl"
                        style={{
                          background: "var(--accent-glow, rgba(6, 182, 212, 0.15))",
                          border: "1px solid rgba(6, 182, 212, 0.2)",
                        }}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                      />
                    )}
                    <Icon className={cn("relative z-10 shrink-0", isMoreGroup ? "h-4 w-4" : "h-5 w-5")} />
                    <AnimatePresence>
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.1 }}
                          className="relative z-10 truncate flex-1"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {/* Unread badge for Chat */}
                    {item.href === "/chat" && unread?.unreadChats ? (
                      <span className="relative z-10 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-cyan-500 text-white text-[10px] font-bold px-1">
                        {unread.unreadChats > 99 ? "99+" : unread.unreadChats}
                      </span>
                    ) : null}
                    {item.href === "/social" && unread?.pendingRequests ? (
                      <span className="relative z-10 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-amber-500 text-white text-[10px] font-bold px-1">
                        {unread.pendingRequests}
                      </span>
                    ) : null}
                  </Link>

                  {/* Tooltip when collapsed */}
                  {collapsed && (
                    <div
                      className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg border"
                      style={{
                        background: "var(--bg-card)",
                        borderColor: "var(--border-normal)",
                        color: "var(--text-primary)",
                      }}
                    >
                      {item.label}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Settings + Collapse */}
      <div
        className="shrink-0 border-t"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <Link
          href="/settings"
          className={cn(
            "relative flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors",
            collapsed && "justify-center px-0",
          )}
          style={{
            color: pathname === "/settings"
              ? "var(--accent-text, #0891b2)"
              : "var(--text-secondary)",
          }}
        >
          <Settings className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Settings</span>}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full h-10 transition-colors"
          style={{ color: "var(--text-muted)" }}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>
    </motion.aside>
  );
}
