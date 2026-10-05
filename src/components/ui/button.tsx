"use client";

import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50 disabled:pointer-events-none cursor-pointer hover:-translate-y-0.5 active:scale-[0.96]",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white font-semibold shadow-lg shadow-cyan-500/20 rounded-xl",
        secondary:
          "bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-indigo-500/20 rounded-xl",
        outline:
          "border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-slate-700",
        ghost:
          "bg-transparent hover:bg-slate-50 rounded-xl text-slate-500 hover:text-slate-900 hover:translate-y-0",
        danger:
          "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white font-semibold shadow-lg shadow-red-500/20 rounded-xl",
        glass:
          "bg-white/75 backdrop-blur-xl border border-slate-200 hover:bg-white rounded-xl text-slate-700",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-5 py-2.5 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
