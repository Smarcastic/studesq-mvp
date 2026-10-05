"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { Menu, LogOut, User, Settings, Search } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NotificationBell } from "@/components/layout/notification-bell";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface TopbarProps {
  onMenuClick?: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { data: session } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header
      className="sticky top-0 z-30 h-16 backdrop-blur-xl border-b flex items-center justify-between px-4 md:px-6"
      style={{
        background: "var(--glass-bg, rgba(255,255,255,0.85))",
        borderColor: "var(--border-subtle, #f1f5f9)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
      }}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-lg transition-colors"
          style={{ color: "var(--text-secondary)" }}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Search hint — opens command palette */}
        <button
          onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }))}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm cursor-pointer transition-colors"
          style={{
            borderColor: "var(--border-normal)",
            color: "var(--text-muted)",
          }}
          aria-label="Search (Ctrl+K)"
        >
          <Search className="h-4 w-4" />
          <span>Search...</span>
          <kbd
            className="ml-4 px-1.5 py-0.5 text-[10px] font-medium rounded border"
            style={{
              background: "var(--bg-elevated)",
              borderColor: "var(--border-normal)",
              color: "var(--text-muted)",
            }}
          >
            Ctrl K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-3">
        <NotificationBell />
        <ThemeToggle compact />
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl transition-colors"
            aria-label="User menu"
            aria-expanded={dropdownOpen}
          >
            <Avatar
              src={session?.user?.image}
              name={session?.user?.name}
              size="sm"
            />
            <span
              className="hidden sm:block text-sm font-medium max-w-[120px] truncate"
              style={{ color: "var(--text-primary)" }}
            >
              {session?.user?.name || "User"}
            </span>
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                className="absolute right-0 mt-2 w-48 rounded-xl shadow-xl border py-1 overflow-hidden"
                style={{
                  background: "var(--bg-card)",
                  borderColor: "var(--border-normal)",
                }}
              >
                <Link
                  href="/profile"
                  className="flex items-center gap-2 px-4 py-2.5 text-sm transition-colors"
                  style={{ color: "var(--text-secondary)" }}
                  onClick={() => setDropdownOpen(false)}
                >
                  <User className="h-4 w-4" />
                  Profile
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center gap-2 px-4 py-2.5 text-sm transition-colors"
                  style={{ color: "var(--text-secondary)" }}
                  onClick={() => setDropdownOpen(false)}
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
                <div
                  className="border-t my-1"
                  style={{ borderColor: "var(--border-subtle)" }}
                />
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors w-full"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
