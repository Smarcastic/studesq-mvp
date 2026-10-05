"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, id, ...props }, ref) => {
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
        <div className="relative">
          <select
            id={id}
            className={cn(
              "flex h-10 w-full appearance-none bg-[var(--bg-elevated)] border border-[var(--border-normal)] rounded-xl px-4 py-2 pr-10 text-sm text-[var(--text-primary)]",
              "focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "transition-all duration-200",
              error && "border-error focus:border-error focus:ring-error/20",
              className
            )}
            ref={ref}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)] pointer-events-none" />
        </div>
        {error && <p className="text-sm text-error">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";

export { Select };
