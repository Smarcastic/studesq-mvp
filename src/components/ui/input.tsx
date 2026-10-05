"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-[var(--text-secondary)]"
          >
            {label}
          </label>
        )}
        <input
          id={id}
          className={cn(
            "w-full bg-[var(--bg-elevated)] border border-[var(--border-normal)] rounded-xl px-4 py-3 text-[var(--text-primary)] text-sm",
            "placeholder:text-[var(--text-muted)]",
            "focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "transition-all duration-200",
            error && "border-error focus:border-error focus:ring-error/20",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="text-sm text-error">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
