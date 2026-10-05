"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  AlertCircle,
  CalendarClock,
  CheckSquare,
  Target,
} from "lucide-react";

interface Notification {
  id: string;
  type: "overdue" | "assignment" | "exam" | "goal";
  title: string;
  subtitle: string;
  priority: "urgent" | "normal";
  href: string;
}

const TYPE_ICONS = {
  overdue: AlertCircle,
  assignment: CheckSquare,
  exam: CalendarClock,
  goal: Target,
};

const TYPE_COLORS = {
  overdue: "text-red-500 bg-red-50",
  assignment: "text-blue-500 bg-blue-50",
  exam: "text-amber-500 bg-amber-50",
  goal: "text-cyan-500 bg-cyan-50",
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: () => fetch("/api/notifications").then((r) => { if (!r.ok) throw new Error("API error"); return r.json(); }),
    refetchInterval: 5 * 60 * 1000, // refetch every 5 minutes
  });

  const urgentCount = notifications.filter((n) => n.priority === "urgent").length;
  const totalCount = notifications.length;

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleClick = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl transition-colors"
        style={{ color: 'var(--text-muted)' }}
      >
        <Bell className="h-5 w-5" />

        {/* Badge */}
        {totalCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold text-white px-1 ${
              urgentCount > 0 ? "bg-red-500" : "bg-cyan-500"
            }`}
          >
            {totalCount > 9 ? "9+" : totalCount}
          </motion.span>
        )}
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 mt-2 w-80 rounded-2xl shadow-xl border overflow-hidden"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-normal)' }}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Notifications</h3>
              {totalCount > 0 && (
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {urgentCount > 0 ? `${urgentCount} urgent` : `${totalCount} upcoming`}
                </p>
              )}
            </div>

            {/* Items */}
            <div className="max-h-[340px] overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((notification) => {
                  const Icon = TYPE_ICONS[notification.type];
                  const colorClass = TYPE_COLORS[notification.type];
                  return (
                    <button
                      key={notification.id}
                      onClick={() => handleClick(notification.href)}
                      className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors cursor-pointer ${
                        notification.priority === "urgent" ? "bg-red-50/40 dark:bg-red-500/5" : ""
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${colorClass}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                          {notification.title}
                        </p>
                        <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {notification.subtitle}
                        </p>
                      </div>
                      {notification.priority === "urgent" && (
                        <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider text-red-500 bg-red-50 px-1.5 py-0.5 rounded-md mt-1">
                          Urgent
                        </span>
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="py-8 text-center">
                  <Bell className="h-8 w-8 mx-auto mb-2" style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>All caught up!</p>
                  <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>No upcoming deadlines</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
