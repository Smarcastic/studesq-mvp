"use client";

import { type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  icon?: ReactNode;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  variant = "danger",
  icon,
  loading = false,
}: ConfirmDialogProps) {
  const isDanger = variant === "danger";

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/25 backdrop-blur-sm"
            onClick={onCancel}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 12 }}
            transition={{ type: "spring", stiffness: 400, damping: 26 }}
            className="relative w-full max-w-sm rounded-2xl shadow-2xl border overflow-hidden"
            style={{
              background: "var(--bg-card, #ffffff)",
              borderColor: "var(--border-normal, #e2e8f0)",
            }}
          >
            <div className="p-6">
              {/* Icon */}
              <div
                className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
                  isDanger ? "bg-red-500/10" : "bg-cyan-500/10"
                }`}
              >
                {icon || (
                  <AlertTriangle
                    className={`h-6 w-6 ${
                      isDanger ? "text-red-500" : "text-cyan-600"
                    }`}
                  />
                )}
              </div>

              {/* Text */}
              <h3
                className="text-center text-base font-semibold mb-1"
                style={{ color: "var(--text-primary)" }}
              >
                {title}
              </h3>
              <p
                className="text-center text-sm leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                {description}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={onCancel}
                disabled={loading}
                aria-label={cancelLabel}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
                style={{
                  background: "var(--bg-elevated, #f1f5f9)",
                  color: "var(--text-primary)",
                }}
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                aria-label={confirmLabel}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors cursor-pointer disabled:opacity-50 ${
                  isDanger
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-cyan-600 hover:bg-cyan-700"
                }`}
              >
                {loading ? (
                  <span className="inline-flex items-center gap-1.5">
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                      className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full"
                    />
                    Deleting...
                  </span>
                ) : (
                  confirmLabel
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
