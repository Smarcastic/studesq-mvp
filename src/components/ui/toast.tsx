"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
  createdAt: number;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const iconColors = {
  success: "text-emerald-500",
  error: "text-red-500",
  info: "text-blue-500",
  warning: "text-amber-500",
};

const borderColors = {
  success: "border-emerald-200",
  error: "border-red-200",
  info: "border-blue-200",
  warning: "border-amber-200",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = "success", duration: number = 3500) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type, duration, createdAt: Date.now() }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
        <AnimatePresence>
          {toasts.map((t) => {
            const Icon = icons[t.type];
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: 40, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
                className={cn(
                  "flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg",
                  "bg-white backdrop-blur-2xl",
                  borderColors[t.type]
                )}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
                >
                  <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", iconColors[t.type])} />
                </motion.div>
                <p className="text-sm flex-1 text-slate-700">{t.message}</p>
                <button
                  onClick={() => removeToast(t.id)}
                  className="shrink-0 p-0.5 rounded hover:bg-slate-50 transition-colors"
                >
                  <X className="h-4 w-4 text-slate-400" />
                </button>

                {/* Auto-dismiss progress bar */}
                <motion.div
                  className={cn(
                    "absolute bottom-0 left-0 h-[2px] rounded-b-xl",
                    t.type === "success" ? "bg-emerald-400" : t.type === "error" ? "bg-red-400" : t.type === "warning" ? "bg-amber-400" : "bg-blue-400"
                  )}
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: t.duration / 1000, ease: "linear" }}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
