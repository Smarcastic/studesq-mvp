"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  GitBranch,
  Trophy,
  Calendar,
  Timer,
  Layers,
  FileText,
  CheckSquare,
  Heart,
  Compass,
  Store,
  Settings,
  Users,
  MessageCircle,
  UsersRound,
  Medal,
  UserCircle,
} from "lucide-react";
import { useSocialUnread } from "@/hooks/use-social-unread";

const navItems = [
  // Home
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Calendar", href: "/calendar", icon: Calendar },
  // Discover
  { label: "Marketplace", href: "/marketplace", icon: Store },
  { label: "Opportunities", href: "/opportunities", icon: Compass },
  { label: "Saved Events", href: "/marketplace/saved", icon: Heart },
  // Profile
  { label: "Achievements", href: "/achievements", icon: Trophy },
  { label: "Timeline", href: "/timeline", icon: GitBranch },
  { label: "My Profile", href: "/profile", icon: UserCircle },
  // Study
  { label: "Flashcards", href: "/study/flashcards", icon: Layers },
  { label: "Assignments", href: "/assignments", icon: CheckSquare },
  { label: "Study Timer", href: "/study/timer", icon: Timer },
  { label: "Notes", href: "/study/notes", icon: FileText },
  // Social
  { label: "Friends", href: "/social", icon: Users },
  { label: "Groups", href: "/groups", icon: UsersRound },
  { label: "Leaderboard", href: "/leaderboard", icon: Medal },
  { label: "Chat", href: "/chat", icon: MessageCircle },
  // Settings
  { label: "Settings", href: "/settings", icon: Settings },
];

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  const pathname = usePathname();
  const { data: unread } = useSocialUnread();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 md:hidden"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-0 top-0 bottom-0 w-[280px] z-50 md:hidden shadow-2xl border-r"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
          >
            <div className="flex items-center justify-between px-4 h-16 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">S</span>
                </div>
                <span className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                  Studes<span className="text-primary-500">Q</span>
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="py-4 px-3 space-y-0.5 overflow-y-auto max-h-[calc(100vh-64px)]">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary-50 dark:bg-primary-500/10 text-primary-600 border border-primary-100 dark:border-primary-500/20"
                        : ""
                    )}
                    style={!isActive ? { color: 'var(--text-secondary)' } : undefined}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="flex-1">{item.label}</span>
                    {item.href === "/chat" && unread?.unreadChats ? (
                      <span className="min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-cyan-500 text-white text-[10px] font-bold px-1">
                        {unread.unreadChats > 99 ? "99+" : unread.unreadChats}
                      </span>
                    ) : null}
                    {item.href === "/social" && unread?.pendingRequests ? (
                      <span className="min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-amber-500 text-white text-[10px] font-bold px-1">
                        {unread.pendingRequests}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
