import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { type ReactNode } from "react";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-slate-100 text-slate-600 border border-slate-200",
        primary:
          "bg-primary-50 text-primary-700 border border-primary-200",
        secondary:
          "bg-secondary-50 text-secondary-700 border border-secondary-200",
        success:
          "bg-emerald-50 text-emerald-700 border border-emerald-200",
        warning:
          "bg-amber-50 text-amber-700 border border-amber-200",
        error:
          "bg-red-50 text-red-700 border border-red-200",
        info:
          "bg-blue-50 text-blue-700 border border-blue-200",
        teal:
          "bg-cyan-50 text-cyan-700 border border-cyan-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface BadgeProps extends VariantProps<typeof badgeVariants> {
  children: ReactNode;
  className?: string;
}

export function Badge({ children, variant, className }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)}>
      {children}
    </span>
  );
}
